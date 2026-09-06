import "server-only";
import { createAdminClient } from "./supabase/admin";
import { createServerSupabase } from "./supabase/server";
import type { Access } from "./types";

/**
 * The one place that answers "what is this visitor allowed to see".
 * Identity comes from the verified Supabase Auth session (magic link);
 * entitlement comes from the `subscribers` row for that email, written only
 * by the Stripe webhook. Never trust a client-supplied email for this.
 */
export async function getAccess(): Promise<Access> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { email: null, purchasedBook: false, subscriptionActive: false };
  }

  const admin = createAdminClient();
  const { data: subscriber } = await admin
    .from("subscribers")
    .select("purchased_book, subscription_status")
    .eq("email", user.email)
    .maybeSingle();

  return {
    email: user.email,
    purchasedBook: subscriber?.purchased_book ?? false,
    subscriptionActive: subscriber?.subscription_status === "active",
  };
}

/** Full catalog access (the one-time book). Active subscribers are always
 * a superset, since the subscription is an upsell on top of the book. */
export function hasBookAccess(access: Access) {
  return access.purchasedBook || access.subscriptionActive;
}
