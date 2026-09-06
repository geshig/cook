import { NextResponse } from "next/server";
import { getStripe, getSiteUrl } from "@/lib/stripe";

export async function POST() {
  const priceId = process.env.STRIPE_PRICE_SUBSCRIPTION;
  if (!priceId) {
    return NextResponse.json(
      { error: "STRIPE_PRICE_SUBSCRIPTION не е конфигуриран" },
      { status: 500 }
    );
  }

  const siteUrl = getSiteUrl();
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/recipes?checkout=success`,
    cancel_url: `${siteUrl}/?checkout=cancelled`,
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Неуспешно създаване на Checkout сесия" },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: session.url });
}
