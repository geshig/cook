import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Auth-only client for Server Components / Route Handlers, scoped to the
 * signed-in user's session cookie. Used to find out *who* is asking
 * (`auth.getUser()`); actual data reads go through the admin client so
 * access decisions live in one place (lib/access.ts), not in RLS policies.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render — middleware already
            // refreshes the session cookie on the request, so this is safe
            // to ignore here.
          }
        },
      },
    }
  );
}
