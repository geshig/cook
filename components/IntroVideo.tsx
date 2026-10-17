"use client";

import { track } from "@/lib/track";

/** „Изгледай, преди да купиш“ — a short personal video from Gesha. */
export function IntroVideo({ url, poster }: { url: string; poster: string | null }) {
  return (
    <section className="intro-video reveal" aria-labelledby="intro-video-h">
      <div className="intro-copy">
        <h2 id="intro-video-h">Изгледай, преди да купиш</h2>
        <p>Минута от мен: какво има в рецептурника, за кого е и как го ползвам всеки ден.</p>
      </div>
      <div className="intro-frame">
        <video
          src={url}
          poster={poster ?? undefined}
          controls
          playsInline
          preload={poster ? "none" : "metadata"}
          onPlay={() => track("Видео: пуснато")}
        />
      </div>
    </section>
  );
}
