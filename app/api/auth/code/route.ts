import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Sign in with the 6-digit code from the email, on the server. The session
 * cookie then comes as a real HTTP cookie (Set-Cookie), which Safari keeps
 * for the full 400 days; a cookie written from JavaScript is cut to 7 days.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; code?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const token = String(body.code ?? "").replace(/\s/g, "");
  if (!email || !/^\d{6,10}$/.test(token)) {
    return NextResponse.json({ error: "Невалиден код." }, { status: 400 });
  }
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return NextResponse.json({ error: "Кодът не става или е изтекъл." }, { status: 401 });
  return NextResponse.json({ ok: true });
}
