import { NextResponse } from "next/server";
import { getStripe, getSiteUrl } from "@/lib/stripe";
import { getAccess } from "@/lib/access";

export async function POST() {
  const priceId = process.env.STRIPE_PRICE_SUBSCRIPTION?.trim();
  if (!priceId) {
    return NextResponse.json(
      { error: "STRIPE_PRICE_SUBSCRIPTION не е конфигуриран" },
      { status: 500 },
    );
  }

  const siteUrl = getSiteUrl();
  const access = await getAccess();
  // Book owners get the first 3 months free; the card is charged after that
  // unless they cancel (Stripe sends a reminder before the trial ends).
  const trial = access.purchasedBook && !access.hadSubscription;
  let session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      ...(access.email ? { customer_email: access.email } : {}),
      ...(trial ? { subscription_data: { trial_period_days: 90 } } : {}),
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/recipes?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?checkout=cancelled`,
      locale: "bg",
      // Cards only (Visa, Mastercard, Revolut и т.н.); Apple Pay и Google Pay
      // идват с картите, ако са включени в Stripe → Settings → Payment methods.
      payment_method_types: ["card"],
      custom_fields: [
        {
          key: "marketing",
          label: { type: "custom", custom: "Имейли с нови рецепти и оферти" },
          type: "dropdown",
          optional: true,
          dropdown: {
            options: [
              { label: "Да, искам", value: "yes" },
              { label: "Не, благодаря", value: "no" },
            ],
          },
        },
      ],
      // Digital content: the buyer must expressly agree that access starts now
      // and that this waives the 14-day withdrawal right. Requires a Terms of
      // service URL in Stripe → Settings → Public details.
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        terms_of_service_acceptance: {
          message: `Съгласен съм с [Условията](${siteUrl}/usloviya).`,
        },
      },
    });
  } catch (e) {
    // Surface Stripe's reason instead of a blank 500, so problems are visible.
    const msg = e instanceof Error ? e.message : String(e);
    console.error("checkout session failed:", msg);
    return NextResponse.json(
      { error: `Плащането не можа да започне: ${msg}` },
      { status: 502 },
    );
  }

  if (!session.url) {
    return NextResponse.json(
      { error: "Неуспешно създаване на Checkout сесия" },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: session.url });
}
