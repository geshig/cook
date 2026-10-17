import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

const TYPES: EmailOtpType[] = ["email", "magiclink", "signup", "invite", "recovery", "email_change"];

/** Same-site paths only: "//evil.com" or "@evil.com" would leave the site. */
function safeNext(raw: string | null): string | null {
  return raw && /^\/(?![\/\\])/.test(raw) ? raw : null;
}

/**
 * Login link from the email (token_hash flow). Unlike /auth/callback it works
 * in ANY browser: people often ask for the link inside Instagram's browser and
 * open the email in Gmail or Safari, which broke the old link and sent them
 * back to the login page in a loop.
 *
 * Supabase email template link:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&redirect_to={{ .RedirectTo }}
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const { origin, searchParams } = url;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Where to go afterwards: ?next=/path, or the ?next= inside redirect_to
  // (…/auth/callback?next=/podarak/CODE), else the recipes.
  let next = safeNext(searchParams.get("next"));
  if (!next) {
    try {
      const rt = searchParams.get("redirect_to");
      if (rt) {
        const inner = new URL(rt, origin);
        if (inner.origin === origin) next = safeNext(inner.searchParams.get("next"));
      }
    } catch {}
  }
  next ??= "/recipes";

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=auth${next !== "/recipes" ? `&next=${encodeURIComponent(next)}` : ""}`);
}
