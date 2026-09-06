import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side source of truth for who has paid. Stripe signs every request
 * with STRIPE_WEBHOOK_SECRET, so this is the only path that may ever mark a
 * subscribers row as paid/active — the client never sets these flags.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET не е конфигуриран" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Липсва подпис" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Невалиден подпис" }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email ?? session.customer_email;
      const customerId =
        typeof session.customer === "string" ? session.customer : null;

      if (!email) {
        console.error("checkout.session.completed без имейл, session:", session.id);
        break;
      }

      if (session.mode === "payment") {
        await admin.from("subscribers").upsert(
          {
            email,
            stripe_customer_id: customerId,
            purchased_book: true,
          },
          { onConflict: "email" }
        );
      } else if (session.mode === "subscription") {
        let currentPeriodEnd: string | null = null;
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription
          );
          const periodEndSeconds = subscription.items.data[0]?.current_period_end;
          currentPeriodEnd = periodEndSeconds
            ? new Date(periodEndSeconds * 1000).toISOString()
            : null;
        }

        await admin.from("subscribers").upsert(
          {
            email,
            stripe_customer_id: customerId,
            subscription_status: "active",
            current_period_end: currentPeriodEnd,
          },
          { onConflict: "email" }
        );
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : null;
      if (!customerId) break;

      const isActive =
        subscription.status === "active" || subscription.status === "trialing";
      const periodEndSeconds = subscription.items.data[0]?.current_period_end;

      await admin
        .from("subscribers")
        .update({
          subscription_status: isActive ? "active" : "canceled",
          current_period_end: periodEndSeconds
            ? new Date(periodEndSeconds * 1000).toISOString()
            : null,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
