import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase/admin";

export type IntroVideo = { url: string; poster: string | null } | null;

/** The welcome video on the landing page, set from /admin/video. */
export const getIntroVideo = unstable_cache(
  async (): Promise<IntroVideo> => {
    try {
      const { data } = await createAdminClient()
        .from("site_settings")
        .select("key, value")
        .in("key", ["intro_video", "intro_poster"]);
      const url = data?.find((r) => r.key === "intro_video")?.value;
      if (!url) return null;
      return { url, poster: data?.find((r) => r.key === "intro_poster")?.value ?? null };
    } catch {
      return null;
    }
  },
  ["intro-video-v1"],
  { revalidate: 600, tags: ["settings"] }
);
