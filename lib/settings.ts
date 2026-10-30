import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase/admin";

export type IntroVideo = { url: string; poster: string | null } | null;

/**
 * The welcome video on the landing page, set from /admin/video. A failed
 * database read throws inside the cache, so it is NOT stored: otherwise one
 * hiccup would hide the video for the whole cache period.
 */
const cachedIntro = unstable_cache(
  async (): Promise<IntroVideo> => {
    const { data, error } = await createAdminClient()
      .from("site_settings")
      .select("key, value")
      .in("key", ["intro_video", "intro_poster"]);
    if (error) throw new Error(error.message);
    const url = data?.find((r) => r.key === "intro_video")?.value;
    if (!url) return null;
    return { url, poster: data?.find((r) => r.key === "intro_poster")?.value ?? null };
  },
  ["intro-video-v2"],
  { revalidate: 600, tags: ["settings"] }
);

export async function getIntroVideo(): Promise<IntroVideo> {
  try {
    return await cachedIntro();
  } catch (e) {
    console.error("intro video read failed:", e instanceof Error ? e.message : e);
    return null;
  }
}
