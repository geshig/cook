import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client, used only for Supabase Auth (magic-link sign-in/out).
 * The app never queries `recipes` / `subscribers` from the browser — all
 * data reads happen server-side so locked content can't appear in
 * client-visible JSON before access is verified.
 */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
