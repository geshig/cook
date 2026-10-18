import "server-only";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase/admin";

/**
 * Launch offer: the first 100 PAYING buyers get 3 months of new recipes free;
 * after that the bonus is 1 month. The counter on the site is real: it counts
 * people who bought the book, not people who got it as a gift, not admins.
 */
export const FIRST_BUYERS = 100;
export const BONUS_DAYS_FIRST = 90;
export const BONUS_DAYS_LATER = 30;

export async function countPaidBuyers(admin: SupabaseClient): Promise<number> {
  const [{ data: buyers }, { data: gifts }] = await Promise.all([
    admin.from("subscribers").select("email").eq("purchased_book", true).limit(5000),
    admin.from("gift_codes").select("redeemed_by").not("redeemed_by", "is", null).limit(5000),
  ]);
  const giftEmails = new Set((gifts ?? []).map((g) => String(g.redeemed_by).toLowerCase()));
  const admins = new Set(
    (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  );
  return (buyers ?? []).filter((b) => {
    const e = String(b.email).toLowerCase();
    return !giftEmails.has(e) && !admins.has(e);
  }).length;
}

/** Trial length for someone who just got the book (they are already counted). */
export async function bonusDaysNow(admin: SupabaseClient): Promise<number> {
  try {
    return (await countPaidBuyers(admin)) <= FIRST_BUYERS ? BONUS_DAYS_FIRST : BONUS_DAYS_LATER;
  } catch {
    return BONUS_DAYS_FIRST;
  }
}

export type LaunchOffer = { left: number; months: 3 | 1 };

/** For the landing page: how many of the 100 places are left. */
export const getLaunchOffer = unstable_cache(
  async (): Promise<LaunchOffer> => {
    try {
      const paid = await countPaidBuyers(createAdminClient());
      const left = Math.max(0, FIRST_BUYERS - paid);
      return { left, months: left > 0 ? 3 : 1 };
    } catch {
      return { left: FIRST_BUYERS, months: 3 };
    }
  },
  ["launch-offer-v1"],
  { revalidate: 60, tags: ["buyers"] }
);
