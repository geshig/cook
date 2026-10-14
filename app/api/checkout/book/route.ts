import { NextResponse } from "next/server";
import { getStripe, getSiteUrl } from "@/lib/stripe";

export async function POST() {
  const priceId = process.env.STRIPE_PRICE_BOOK;
  if (!priceId) {
    return NextResponse.json(
      { error: "STRIPE_PRICE_BOOK не е конфигуриран" },
      { status: 500 }
    );
  }

  const siteUrl = getSiteUrl();
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/recipes?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/?checkout=cancelled`,
    locale: "bg",
    // Digital content: the buyer must expressly agree that access starts now
    // and that this waives the 14-day withdrawal right. Requires a Terms of
    // service URL in Stripe → Settings → Public details.
    consent_collection: { terms_of_service: "required" },
    custom_text: {
      terms_of_service_acceptance: {
        message: `Съгласен съм с [Условията](${siteUrl}/usloviya). Искам достъп веднага и знам, че покупката не подлежи на връщане.`,
      },
    },
    customer_creation: "always",
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
