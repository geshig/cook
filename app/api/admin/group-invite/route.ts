import { NextResponse } from "next/server";
import { getAccess, isAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendGroupInvite } from "@/lib/email";

export const maxDuration = 300;

const KEY = "group_invite_sent";
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Админ → Имейли: sends „Всичко наред ли е?“ + the Facebook group to everyone
 * who has the book, once. New buyers get the group link in the purchase email.
 */
export async function POST() {
  const access = await getAccess();
  if (!isAdmin(access)) return NextResponse.json({ error: "Няма достъп" }, { status: 403 });
  const admin = createAdminClient();

  const { data: done } = await admin.from("site_settings").select("value").eq("key", KEY).maybeSingle();
  if (done?.value) return NextResponse.json({ error: "Вече е изпратен." }, { status: 409 });

  const admins = new Set(
    (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  );
  const { data: buyers, error } = await admin.from("subscribers").select("email").eq("purchased_book", true);
  if (error) return NextResponse.json({ error: "Не успях да прочета купувачите." }, { status: 500 });

  const emails = [...new Set((buyers ?? []).map((b) => String(b.email).toLowerCase()))].filter((e) => !admins.has(e));
  let sent = 0;
  const failed: string[] = [];
  for (const email of emails) {
    if (await sendGroupInvite(email)) sent++;
    else failed.push(email);
    await pause(600);
  }

  await admin.from("site_settings").upsert({
    key: KEY,
    value: JSON.stringify({ at: new Date().toISOString(), sent, failed }),
    updated_at: new Date().toISOString(),
  });
  return NextResponse.json({ sent, failed });
}
