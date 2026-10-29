import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { sendCartReminder, sendGiftEmail, sendPurchaseEmail } from "@/lib/email";
import { createGiftCodes } from "@/lib/gifts";
import { bonusDaysFor } from "@/lib/launch";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side source of truth for who has paid. Stripe signs every request
 * with STRIPE_WEBHOOK_SECRET, so this is the only path that may ever mark a
 * subscribers row as paid/active — the client never sets these flags.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
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
      const rawEmail = session.customer_details?.email ?? session.customer_email;
      // Supabase Auth stores emails lowercased; match that so access lookups line up.
      const email = rawEmail?.trim().toLowerCase();
      const customerId =
        typeof session.customer === "string" ? session.customer : null;

      if (!email) {
        console.error("checkout.session.completed без имейл, session:", session.id);
        break;
      }

      // Unlock only for money actually received. Delayed methods would arrive
      // as "unpaid" here; we only offer instant ones, but never trust that.
      if (session.payment_status === "unpaid") {
        console.warn("checkout.session.completed още без плащане, session:", session.id);
        break;
      }

      // A friend's gift (27 €): make the codes and email the links. The
      // buyer already owns the book, so nothing else changes for them.
      if (session.metadata?.kind === "gift") {
        try {
          const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
          const qty = Math.max(1, Math.min(5, items.data.reduce((a, li) => a + (li.quantity ?? 1), 0)));
          const gifts = await createGiftCodes(session.id, email, qty);
          await sendGiftEmail({ email, codes: gifts.map((g) => g.code), sessionId: session.id }).catch((e) =>
            console.error("gift email failed:", e instanceof Error ? e.message : e)
          );
        } catch (e) {
          console.error("gift codes failed:", e instanceof Error ? e.message : e);
          return NextResponse.json({ error: "gift" }, { status: 500 });
        }
        break;
      }

      if (session.mode === "payment") {
        const { error } = await admin.from("subscribers").upsert(
          {
            email,
            stripe_customer_id: customerId,
            purchased_book: true,
          },
          { onConflict: "email" }
        );
        if (error) {
          // 500 makes Stripe retry instead of silently losing the purchase.
          console.error("subscribers upsert (book) failed:", error.message);
          return NextResponse.json({ error: "db" }, { status: 500 });
        }
        // Purchase time decides which recipes the book unlocks. Set once,
        // best-effort: a missing column must not block the purchase.
        const { error: tErr } = await admin
          .from("subscribers")
          .update({ book_purchased_at: new Date(session.created * 1000).toISOString() })
          .eq("email", email)
          .is("book_purchased_at", null);
        if (tErr) console.error("book_purchased_at update failed:", tErr.message);
        // The "first 100" counter on the landing page.
        revalidateTag("buyers", "max");

        // The book's bonus is not started here: the buyer claims it on the
        // site (Stripe page with 0 € today and the price after it). The
        // email says how long their free period will be.
        let bonusDays = 90;
        try {
          bonusDays = await bonusDaysFor(admin, email);
        } catch {}

        // Bought for two: one gift link for the friend.
        let giftCodes: string[] = [];
        if (session.metadata?.kind === "book_for_two") {
          try {
            giftCodes = (await createGiftCodes(session.id, email, 1)).map((g) => g.code);
          } catch (e) {
            console.error("gift code (for two) failed:", e instanceof Error ? e.message : e);
            return NextResponse.json({ error: "gift" }, { status: 500 });
          }
        }

        // Welcome + written confirmation of the purchase. Best-effort and
        // idempotent per session, so a Stripe retry never sends it twice.
        try {
          const total = (session.amount_total ?? 0) / 100;
          await sendPurchaseEmail({
            email,
            paidAt: session.created,
            amount: `${total.toFixed(2).replace(".", ",")} €`,
            bonusMonths: bonusDays >= 90 ? 3 : 1,
            sessionId: session.id,
            giftCodes,
          });
        } catch (e) {
          console.error("purchase email failed:", e instanceof Error ? e.message : e);
        }
      }

      // Marketing opt-in from the optional Checkout field. Kept separate and
      // best-effort so a missing column never blocks unlocking the purchase.
      const marketing = session.custom_fields?.find((f) => f.key === "marketing")?.dropdown?.value;
      if (marketing === "yes" || marketing === "no") {
        const { error: mErr } = await admin
          .from("subscribers")
          .update({ marketing_opt_in: marketing === "yes" })
          .eq("email", email);
        if (mErr) console.error("marketing_opt_in update failed:", mErr.message);
      }

      if (session.mode === "subscription") {
        let currentPeriodEnd: string | null = null;
        let trialEnd: string | null = null;
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription
          );
          const periodEndSeconds = subscription.items.data[0]?.current_period_end;
          currentPeriodEnd = periodEndSeconds
            ? new Date(periodEndSeconds * 1000).toISOString()
            : null;
          trialEnd =
            subscription.status === "trialing" && subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null;
        }

        const { error } = await admin.from("subscribers").upsert(
          {
            email,
            stripe_customer_id: customerId,
            subscription_status: "active",
            current_period_end: currentPeriodEnd,
          },
          { onConflict: "email" }
        );
        if (error) {
          console.error("subscribers upsert (subscription) failed:", error.message);
          return NextResponse.json({ error: "db" }, { status: 500 });
        }
        // The claimed bonus: its end date drives the banner. Best-effort.
        await admin.from("subscribers").update({ trial_end: trialEnd }).eq("email", email);
      }
      break;
    }

    case "checkout.session.expired": {
      // Abandoned book checkout: one reminder, only with marketing consent,
      // only if they still don't have the book (they may have paid in another tab).
      const s = event.data.object as Stripe.Checkout.Session;
      const email = s.customer_details?.email?.trim().toLowerCase();
      const link = s.after_expiration?.recovery?.url;
      if (s.mode !== "payment" || !email || !link || s.consent?.promotions !== "opt_in") break;
      const { data: owner } = await admin.from("subscribers").select("purchased_book").eq("email", email).maybeSingle();
      if (owner?.purchased_book) break;
      await sendCartReminder({ email, link, sessionId: s.id });
      break;
    }

    // Full refund of the book: take the book back, stop the bonus, and free
    // the place in "first 100". Gift refunds are ignored. Book charges carry
    // metadata.kind; older ones (before it) are recognised by the 47 € amount.
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      if (!charge.refunded) break; // partial refund: keep access
      const isBook = charge.metadata?.kind?.startsWith("book") || charge.amount >= 4000;
      if (!isBook) break; // not the book
      const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
      const email = (charge.billing_details?.email ?? charge.receipt_email ?? "").toLowerCase();
      const match = customerId
        ? admin.from("subscribers").update({ purchased_book: false }).eq("stripe_customer_id", customerId)
        : email
          ? admin.from("subscribers").update({ purchased_book: false }).eq("email", email)
          : null;
      if (match) {
        const { error } = await match;
        if (error) console.error("refund: revoke failed:", error.message);
      }
      if (customerId) {
        try {
          const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
          for (const sub of subs.data) {
            if (["trialing", "active", "past_due"].includes(sub.status)) await stripe.subscriptions.cancel(sub.id);
          }
        } catch (e) {
          console.error("refund: cancel subscription failed:", e instanceof Error ? e.message : e);
        }
      }
      revalidateTag("buyers", "max");
      break;
    }

    case "customer.subscription.created":
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
      // Trial end for the banner; best-effort (column may not exist yet).
      await admin
        .from("subscribers")
        .update({
          trial_end:
            subscription.status === "trialing" && subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
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
