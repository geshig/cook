import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return ["", "/recipes", "/usloviya", "/poveritelnost"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: p === "" || p === "/recipes" ? "weekly" : "yearly",
    priority: p === "" ? 1 : 0.5,
  }));
}
