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
    success_url: `${siteUrl}/recipes?checkout=success`,
    cancel_url: `${siteUrl}/?checkout=cancelled`,
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
