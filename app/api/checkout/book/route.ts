import { NextResponse } from "next/server";
import { getStripe, getSiteUrl } from "@/lib/stripe";
import { getAccess } from "@/lib/access";

export async function POST() {
  const priceId = process.env.STRIPE_PRICE_BOOK;
  if (!priceId) {
    return NextResponse.json(
      { error: "STRIPE_PRICE_BOOK не е конфигуриран" },
      { status: 500 }
    );
  }

  const siteUrl = getSiteUrl();
  const access = await getAccess();
  const subPriceId = process.env.STRIPE_PRICE_SUBSCRIPTION;
  // The book comes with the subscription: 47 € now, 3 months of new recipes
  // free, then 5,99 €/month until cancelled. Skipped for anyone who has had a
  // subscription before (no second free trial) or if no subscription price.
  const bundle = !!subPriceId && !access.hadSubscription;
  const session = await getStripe().checkout.sessions.create({
    ...(bundle
      ? {
          mode: "subscription" as const,
          line_items: [
            { price: priceId, quantity: 1 },
            { price: subPriceId!, quantity: 1 },
          ],
          subscription_data: { trial_period_days: 90 },
          payment_method_types: ["card" as const],
        }
      : {
          mode: "payment" as const,
          line_items: [{ price: priceId, quantity: 1 }],
          payment_method_types: ["card" as const, "revolut_pay" as const],
          customer_creation: "always" as const,
        }),
    metadata: { kind: "book" },
    ...(access.email ? { customer_email: access.email } : {}),
    success_url: `${siteUrl}/recipes?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/?checkout=cancelled`,
    locale: "bg",
    // Карти (Visa, Mastercard, Revolut и т.н.); Apple Pay и Google Pay идват с
    // картите. Revolut Pay само при еднократно плащане (без абонамент).
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
        message: bundle
          ? `Съгласен съм с [Условията](${siteUrl}/usloviya). Абонаментът за новите рецепти е безплатен 3 месеца, после 5,99 € на месец, докато не го спра.`
          : `Съгласен съм с [Условията](${siteUrl}/usloviya).`,
      },
    },
    // Stripe collects the email on the Checkout page; the webhook uses it
    // to upsert the subscribers row, and the buyer signs in with the same
    // email afterwards to unlock /recipes.
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Неуспешно създаване на Checkout сесия" },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: session.url });
}
