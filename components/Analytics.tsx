import Script from "next/script";
import { getAccess, isAdmin } from "@/lib/access";

/**
 * Umami: cookieless, no personal data, no consent banner needed. Turned on
 * by NEXT_PUBLIC_UMAMI_WEBSITE_ID in Vercel; without it nothing loads.
 * The admin (you, signed in) is never counted, on any device.
 */
export async function Analytics() {
  const id = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
  if (!id) return null;
  const access = await getAccess().catch(() => null);
  if (access && isAdmin(access)) return null;
  return <Script src="https://cloud.umami.is/script.js" data-website-id={id} strategy="afterInteractive" />;
}
