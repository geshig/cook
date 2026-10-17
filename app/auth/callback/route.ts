import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only same-site paths: "//evil.com" or "@evil.com" would leave the site.
  const raw = searchParams.get("next") ?? "";
  const next = /^\/(?![\/\\])/.test(raw) ? raw : "/recipes";

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Usually: the link was opened in another browser than the one that asked
  // for it. Back to login with a clear message, keeping where they were going.
  return NextResponse.redirect(`${origin}/login?error=auth${next !== "/recipes" ? `&next=${encodeURIComponent(next)}` : ""}`);
}
