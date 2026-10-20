/**
 * Short links for bios, stories and posts (geshapov.com/ig …). Each one opens
 * the page with OUR utm tags only: Instagram adds its own (utm_source=ig,
 * utm_content=link_in_bio) to bio links, which made Umami count one visit
 * under two names. Other query params (fbclid…) are kept.
 */
type Short = { dest: string; source: string; medium: string; campaign?: string };

export const SHORT_LINKS: Record<string, Short> = {
  "/ig": { dest: "/", source: "instagram", medium: "bio" },
  "/story": { dest: "/", source: "instagram", medium: "story" },
  "/reel": { dest: "/", source: "instagram", medium: "reel" },
  "/dm": { dest: "/", source: "instagram", medium: "dm" },
  "/tt": { dest: "/", source: "tiktok", medium: "bio" },
  "/ttv": { dest: "/", source: "tiktok", medium: "video" },
  "/skool": { dest: "/", source: "skool", medium: "community" },
  "/fb": { dest: "/", source: "facebook", medium: "bio" },
  "/fbp": { dest: "/", source: "facebook", medium: "post" },
  "/menu": { dest: "/menyuta", source: "instagram", medium: "post", campaign: "menyuta" },
  "/dvama": { dest: "/#pricing", source: "instagram", medium: "post", campaign: "za-dvama" },
  // Pinned comments under videos.
  "/k": { dest: "/", source: "instagram", medium: "comment" },
  "/kf": { dest: "/", source: "facebook", medium: "comment" },
  "/kt": { dest: "/", source: "tiktok", medium: "comment" },
  // ManyChat DM links (free chicken recipe).
  "/pi": { dest: "/pile", source: "instagram", medium: "manychat", campaign: "pile" },
  "/pf": { dest: "/pile", source: "facebook", medium: "manychat", campaign: "pile" },
};

/** The full redirect URL for a short link, or null if the path is not one. */
export function shortLinkTarget(url: URL): URL | null {
  const s = SHORT_LINKS[url.pathname.replace(/\/+$/, "") || "/"];
  if (!s) return null;
  const [path, hash] = s.dest.split("#");
  const target = new URL(path, url.origin);
  url.searchParams.forEach((v, k) => {
    if (!k.toLowerCase().startsWith("utm_")) target.searchParams.append(k, v);
  });
  target.searchParams.set("utm_source", s.source);
  target.searchParams.set("utm_medium", s.medium);
  if (s.campaign) target.searchParams.set("utm_campaign", s.campaign);
  if (hash) target.hash = hash;
  return target;
}
