import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { shortLinkTarget } from "@/lib/shortLinks";

// Refreshes the Supabase auth session cookie on every request so Server
// Components always see a valid (non-expired) session. This does not gate
// access to any route — access decisions happen in lib/access.ts against
// the `subscribers` table, not against whether a session cookie exists.
export async function proxy(request: NextRequest) {
  // Short links (/ig, /tt…): straight to the page with only our utm tags.
  const short = shortLinkTarget(request.nextUrl);
  if (short) return NextResponse.redirect(short, 307);

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Keep people signed in: once a day re-send the auth cookies from the
  // server with the full 400-day life. Safari caps cookies written by
  // JavaScript to 7 days, so without this a visit after a week looked like
  // "the site forgot me".
  if (user && !request.cookies.get("kg-keep")) {
    const year = 400 * 24 * 60 * 60;
    for (const c of request.cookies.getAll()) {
      if (!/^sb-.+-auth-token(\.\d+)?$/.test(c.name)) continue;
      if (response.cookies.get(c.name)) continue; // just refreshed above
      response.cookies.set(c.name, c.value, { path: "/", sameSite: "lax", secure: true, maxAge: year });
    }
    response.cookies.set("kg-keep", "1", { path: "/", sameSite: "lax", secure: true, maxAge: 24 * 60 * 60 });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
