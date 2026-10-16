import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/account", "/auth", "/podarak"] },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
