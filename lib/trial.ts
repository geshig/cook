import "server-only";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

export const TRIAL_DAYS = 90;

/**
 * Starts the free 3-month subscription for a book owner, without asking for a
 * card. If no card is added by the end, Stripe cancels it (no charge). If the
 * customer adds a card in the billing portal, it continues at 5,99 €/month.
 */
export async function startFreeTrial(
  stripe: Stripe,
  admin: SupabaseClient,
  opts: { email: string; customerId: string; idempotencyKey: string }
): Promise<{ ok: boolean; trialEnd: string | null; error?: string }> {
  const priceId = process.env.STRIPE_PRICE_SUBSCRIPTION?.trim();
  if (!priceId) return { ok: false, trialEnd: null, error: "STRIPE_PRICE_SUBSCRIPTION липсва" };

  const sub = await stripe.subscriptions.create(
    {
      customer: opts.customerId,
      items: [{ price: priceId }],
      trial_period_days: TRIAL_DAYS,
      trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      payment_settings: { save_default_payment_method: "on_subscription" },
      metadata: { kind: "book_bonus" },
    },
    { idempotencyKey: opts.idempotencyKey }
  );

  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
  const { error } = await admin
    .from("subscribers")
    .update({ subscription_status: "active", current_period_end: trialEnd, stripe_customer_id: opts.customerId })
    .eq("email", opts.email);
  if (error) return { ok: false, trialEnd, error: error.message };

  // Separate, best-effort: the column may not exist yet.
  await admin.from("subscribers").update({ trial_end: trialEnd }).eq("email", opts.email);
  return { ok: true, trialEnd };
}
