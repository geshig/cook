import Script from "next/script";
import { getAccess, isAdmin } from "@/lib/access";

const UMAMI_WEBSITE_ID = "8520e3d0-49de-4eb5-8848-da2a5446a625";

/**
 * Umami: cookieless, no personal data, no consent banner needed.
 * The admin (you, signed in) is never counted, on any device.
 */
export async function Analytics() {
  // The website ID is public (it is in every page's HTML), so it is kept here
  // too: tracking works even if the Vercel variable is missing or mistyped.
  const id = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim() || UMAMI_WEBSITE_ID;
  const access = await getAccess().catch(() => null);
  if (access && isAdmin(access)) return null;
  return <Script src="https://cloud.umami.is/script.js" data-website-id={id} strategy="afterInteractive" />;
}
