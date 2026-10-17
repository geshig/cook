"use client";

import { useRef, useState } from "react";
import { track } from "@/lib/track";

/**
 * Gesha's short personal video, placed inside the hero so it is the first
 * thing seen on a phone. Before play it shows the poster (or the first frame)
 * with a big pulsing play button; one tap plays it with sound and controls.
 * Nothing is downloaded until the tap when a poster is set.
 */
export function IntroVideo({ url, poster }: { url: string; poster: string | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function start() {
    setPlaying(true);
    track("Видео: пуснато");
    ref.current?.play().catch(() => {});
  }

  return (
    <div className={"hero-video" + (playing ? " is-playing" : "")}>
      <video
        ref={ref}
        // #t=0.1 makes iOS show the first frame when there is no poster.
        src={poster ? url : `${url}#t=0.1`}
        poster={poster ?? undefined}
        controls={playing}
        playsInline
        preload={poster ? "none" : "metadata"}
      />
      {!playing && (
        <button type="button" className="hero-video-play" onClick={start} aria-label="Пусни видеото">
          <span className="hero-video-btn" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30">
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
          </span>
          <span className="hero-video-cap">
            <b>Изгледай, преди да купиш</b>
            <span>Минута от мен: какво има вътре и за кого е</span>
          </span>
        </button>
      )}
    </div>
  );
}
