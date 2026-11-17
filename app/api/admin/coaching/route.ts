import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getAccess, isAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { getApplication } from "@/lib/coachingDb";
import { sendCoachingApproved, sendCoachingRejected } from "@/lib/email";

/** Админ → Коучинг: одобри (праща линкове за плащане), откажи, приключи. */
export async function POST(request: Request) {
  const access = await getAccess();
  if (!isAdmin(access)) return NextResponse.json({ error: "Няма достъп" }, { status: 403 });
  const { id, action } = (await request.json().catch(() => ({}))) as { id?: string; action?: string };
  const app = await getApplication({ id }).catch(() => null);
  if (!app) return NextResponse.json({ error: "Няма такава кандидатура." }, { status: 404 });
  const db = createAdminClient().from("coaching_applications");

  if (action === "approve") {
    if (app.status === "paid") return NextResponse.json({ error: "Вече е платил/а." }, { status: 400 });
    const token = app.pay_token ?? randomBytes(16).toString("hex");
    const { error } = await db.update({ status: "approved", pay_token: token, approved_at: new Date().toISOString() }).eq("id", app.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const sent = await sendCoachingApproved({ id: app.id, email: app.email, name: app.name, token });
    return NextResponse.json({ ok: true, status: "approved", sent });
  }
  if (action === "reject") {
    const { error } = await db.update({ status: "rejected" }).eq("id", app.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const sent = await sendCoachingRejected({ id: app.id, email: app.email, name: app.name });
    return NextResponse.json({ ok: true, status: "rejected", sent });
  }
  if (action === "end") {
    const { error } = await db.update({ status: "ended" }).eq("id", app.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status: "ended" });
  }
  return NextResponse.json({ error: "Непознато действие." }, { status: 400 });
}
