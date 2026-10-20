"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { track } from "@/lib/track";

/** Default cover: Gesha and Homie in chef's hats, with the title baked in. */
const BRANDED_POSTER = "/intro-poster-v3.jpg";

/**
 * Gesha's short personal video, placed inside the hero so it is the first
 * thing seen on a phone. Before play a sharp cover image sits on top of the
 * video (iOS draws the <video poster> blurry and letterboxed, so it is not
 * used); one tap hides the cover and plays with sound and controls. Nothing
 * of the video is downloaded until the tap.
 */
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
    <div className="hero-video-wrap">
      <p className="hero-video-label">
        <span aria-hidden="true">▶</span> Изгледай, преди да продължиш
      </p>
    <div className={"hero-video" + (branded ? " branded" : "") + (playing ? " is-playing" : "")}>
      <video ref={ref} src={url} controls={playing} playsInline preload="none" />
      {!playing && (
        <>
          <Image className="hero-video-cover" src={poster} alt="" fill priority sizes="(min-width: 900px) 320px, 80vw" />
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
        </>
      )}
    </div>
    </div>
  );
}
