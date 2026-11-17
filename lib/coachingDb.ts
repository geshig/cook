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
