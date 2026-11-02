import { NextResponse } from "next/server";
import { getAccess, isAdmin } from "@/lib/access";
import { sendTestEmail } from "@/lib/email";
import { CONTACT_EMAIL } from "@/lib/site";

/** Админ → Имейли: one test email to hello@ (forwarded to the inbox). */
export async function POST() {
  const access = await getAccess();
  if (!isAdmin(access)) return NextResponse.json({ error: "Няма достъп" }, { status: 403 });
  const ok = await sendTestEmail(CONTACT_EMAIL);
  if (!ok) return NextResponse.json({ error: "Resend не го прие. Провери RESEND_API_KEY във Vercel." }, { status: 500 });
  return NextResponse.json({ ok: true, to: CONTACT_EMAIL });
}
