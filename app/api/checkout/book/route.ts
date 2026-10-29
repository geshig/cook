import { NextResponse } from "next/server";
import { getStripe, getSiteUrl } from "@/lib/stripe";
import { getAccess } from "@/lib/access";
import { GIFT_PRICE_CENTS } from "@/lib/gifts";

export async function POST(request: Request) {
  const forTwo = new URL(request.url).searchParams.get("for") === "2";
  const priceId = process.env.STRIPE_PRICE_BOOK?.trim();
  if (!priceId) {
    return NextResponse.json(
      { error: "STRIPE_PRICE_BOOK не е конфигуриран" },
      { status: 500 },
    );
  }

  const siteUrl = getSiteUrl();
  const access = await getAccess();
  let session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      ...(access.email ? { customer_email: access.email } : {}),
      line_items: [
        { price: priceId, quantity: 1 },
        ...(forTwo
          ? [
              {
                price_data: {
                  currency: "eur",
                  unit_amount: GIFT_PRICE_CENTS,
                  product_data: {
                    name: "Втори достъп за приятел",
                    description: "Получаваш линк, който пращаш. Той влиза със своя имейл.",
                  },
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      ...(forTwo ? { metadata: { kind: "book_for_two" } } : {}),
      success_url: `${siteUrl}/recipes?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?checkout=cancelled`,
      locale: "bg",
      // Always euro: no "pay in UAH/BGN…" currency switch (Stripe Adaptive Pricing).
      adaptive_pricing: { enabled: false },
      // Карти (Visa, Mastercard, Revolut и т.н.) и Revolut Pay; Apple Pay и Google Pay
      // идват с картите, ако са включени в Stripe → Settings → Payment methods.
      payment_method_types: ["card", "revolut_pay"],
      // Digital content: the buyer must expressly agree that access starts now
      // and that this waives the 14-day withdrawal right. Requires a Terms of
      // service URL in Stripe → Settings → Public details.
      // promotions "auto": in the EU Stripe adds an optional "send me emails"
      // box under the email. Only people who tick it get the reminder below.
      consent_collection: { terms_of_service: "required", promotions: "auto" },
      // If they leave, the session expires after an hour and Stripe makes a
      // recovery link; the webhook (checkout.session.expired) emails it once.
      after_expiration: { recovery: { enabled: true } },
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      custom_text: {
        submit: {
          message: forTwo
            ? "Веднага след плащането влизаш с този имейл, а линкът за втория човек идва в имейла ти. И двамата получавате и бонус: нови рецепти безплатно, активирате го в сайта."
            : "Вътре: 100+ рецепти с калориите, дневни менюта, калкулатор за калории и общност в Skool. Еднократно плащане. Веднага след него влизаш с този имейл, а бонуса с нови рецепти безплатно го активираш в сайта.",
        },
        terms_of_service_acceptance: {
          message: `Искам достъп веднага и знам, че след това губя правото на отказ от 14 дни. Приемам [Условията](${siteUrl}/usloviya).`,
        },
      },
      customer_creation: "always",
      // Stripe collects the email on the Checkout page; the webhook uses it
      // to upsert the subscribers row, and the buyer signs in with the same
      // email afterwards to unlock /recipes.
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
