import "server-only";
import { createAdminClient } from "./supabase/admin";
import { COACHING, type CoachingApp } from "./coaching";

/** Свободни места: 10 минус платилите (status = paid). Без таблица: 10. */
export async function spotsLeft(): Promise<number> {
  try {
    const { count, error } = await createAdminClient()
      .from("coaching_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid");
    if (error) return COACHING.spots;
    return Math.max(0, COACHING.spots - (count ?? 0));
  } catch {
    return COACHING.spots;
  }
}

export async function listApplications(): Promise<CoachingApp[] | null> {
  try {
    const { data, error } = await createAdminClient()
      .from("coaching_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) return null;
    return (data ?? []) as CoachingApp[];
  } catch {
    return null;
  }
}

export async function getApplication(by: { id?: string; token?: string }): Promise<CoachingApp | null> {
  if (!by.id && !by.token) return null;
  const q = createAdminClient().from("coaching_applications").select("*");
  const { data } = await (by.id ? q.eq("id", by.id) : q.eq("pay_token", by.token!)).maybeSingle();
  return (data as CoachingApp) ?? null;
}

/**
 * Already owns the book? Its price comes off the first coaching payment.
 * Looks up their paid book checkout in Stripe (the oldest one: gifts come
 * later). For two: half of it. Got it as a gift (paid nothing): 0.
 */
export async function bookCredit(email: string): Promise<number> {
  try {
    const { data } = await createAdminClient()
      .from("subscribers")
      .select("purchased_book")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (!data?.purchased_book) return 0;
    const { getStripe } = await import("./stripe");
    const list = await getStripe().checkout.sessions.list({
      customer_details: { email: email.toLowerCase() },
      status: "complete",
      limit: 30,
    });
    const books = list.data
      .filter(
        (s) =>
          s.mode === "payment" &&
          s.payment_status === "paid" &&
          !["gift", "coaching"].includes(s.metadata?.kind ?? "") &&
          (s.amount_total ?? 0) >= 1000
      )
      .sort((a, b) => a.created - b.created);
    const first = books[0];
    if (!first) return 0;
    const paid = first.amount_total ?? 0;
    return first.metadata?.kind === "book_for_two" ? Math.round(paid / 2) : paid;
  } catch (e) {
    console.error("bookCredit failed:", e instanceof Error ? e.message : e);
    return 0;
  }
}
