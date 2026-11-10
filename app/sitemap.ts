import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return ["", "/menyuta", "/kalkulator", "/produkti", "/za-men", "/recipes", "/usloviya", "/poveritelnost"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: p === "" || p === "/recipes" || p === "/menyuta" ? "weekly" : "yearly",
    priority: p === "" ? 1 : 0.5,
  }));
}
