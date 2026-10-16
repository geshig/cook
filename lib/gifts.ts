import "server-only";
import { randomBytes } from "crypto";
import { createAdminClient } from "./supabase/admin";
import { getSiteUrl } from "./site";

export const GIFT_PRICE_CENTS = 2700;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

function newCode(): string {
  const bytes = randomBytes(10);
  let s = "";
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return `${s.slice(0, 5)}-${s.slice(5)}`;
}

export function giftLink(code: string) {
  return `${getSiteUrl()}/podarak/${code}`;
}

export type Gift = { code: string; redeemedBy: string | null; redeemedAt: string | null };

/** Creates `qty` codes for a paid gift session; safe to call twice (Stripe retries). */
export async function createGiftCodes(sessionId: string, buyerEmail: string, qty: number): Promise<Gift[]> {
  const admin = createAdminClient();
  const rows = Array.from({ length: qty }, (_, i) => ({
    code: newCode(),
    buyer_email: buyerEmail,
    session_id: sessionId,
    idx: i,
  }));
  const { error } = await admin.from("gift_codes").upsert(rows, { onConflict: "session_id,idx", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  const { data } = await admin
    .from("gift_codes")
    .select("code, redeemed_by, redeemed_at")
    .eq("session_id", sessionId)
    .order("idx");
  return (data ?? []).map((r) => ({ code: r.code, redeemedBy: r.redeemed_by, redeemedAt: r.redeemed_at }));
}

export async function giftsBoughtBy(email: string | null): Promise<Gift[]> {
  if (!email) return [];
  const { data, error } = await createAdminClient()
    .from("gift_codes")
    .select("code, redeemed_by, redeemed_at")
    .eq("buyer_email", email.toLowerCase())
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({ code: r.code, redeemedBy: r.redeemed_by, redeemedAt: r.redeemed_at }));
}

export async function giftStatus(code: string): Promise<"ok" | "used" | "missing"> {
  const { data } = await createAdminClient()
    .from("gift_codes")
    .select("redeemed_by")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (!data) return "missing";
  return data.redeemed_by ? "used" : "ok";
}
