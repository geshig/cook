import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let email: unknown;
  let source: unknown;
  try {
    ({ email, source } = await request.json());
  } catch {
    return NextResponse.json({ error: "Невалидна заявка" }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Невалиден имейл" }, { status: 400 });
  }

  const admin = createAdminClient();
  const clean = email.toLowerCase().trim();
  const src = typeof source === "string" && /^[a-z0-9-]{1,30}$/.test(source) ? source : "landing";
  let { error } = await admin.from("leads").upsert({ email: clean, source: src }, { onConflict: "email" });
  // Older tables have no "source" column: store the email anyway.
  if (error) ({ error } = await admin.from("leads").upsert({ email: clean }, { onConflict: "email" }));

  if (error) {
    console.error("Failed to store lead:", error);
    return NextResponse.json({ error: "Грешка при запис" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
