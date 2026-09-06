import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Невалидна заявка" }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Невалиден имейл" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("leads")
    .upsert({ email: email.toLowerCase().trim() }, { onConflict: "email" });

  if (error) {
    console.error("Failed to store lead:", error);
    return NextResponse.json({ error: "Грешка при запис" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
