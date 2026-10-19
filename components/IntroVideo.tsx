"use client";

import { useRef, useState } from "react";
import { track } from "@/lib/track";

/**
 * Gesha's short personal video, placed inside the hero so it is the first
 * thing seen on a phone. Before play it shows the poster (or the first frame)
 * with a big pulsing play button; one tap plays it with sound and controls.
 * Nothing is downloaded until the tap when a poster is set.
 */
/** Default cover: Gesha and Homie in chef's hats, with the title baked in. */
const BRANDED_POSTER = "/intro-poster.jpg";

export function IntroVideo({ url, poster: uploaded }: { url: string; poster: string | null }) {
  // Without an uploaded poster, use the designed cover. Its play button sits on
  // the seam between photo and title, so the caption is drawn in the image.
  const branded = !uploaded;
  const poster = uploaded ?? BRANDED_POSTER;
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function start() {
    setPlaying(true);
    track("Видео: пуснато");
    ref.current?.play().catch(() => {});
  }

  return (
    <div className={"hero-video" + (branded ? " branded" : "") + (playing ? " is-playing" : "")}>
      <video
        ref={ref}
        src={url}
        poster={poster}
        controls={playing}
        playsInline
        preload="none"
      />
      {!playing && (
        <button type="button" className="hero-video-play" onClick={start} aria-label="Пусни видеото">
          <span className="hero-video-btn" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30">
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
          </span>
          <span className={"hero-video-cap" + (branded ? " sr-only" : "")}>
            <b>Изгледай, преди да купиш</b>
            <span>Минута от мен: какво има вътре и за кого е</span>
          </span>
        </button>
      )}
    </div>
  );
}
