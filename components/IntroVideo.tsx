"use client";

import { useEffect, useRef, useState } from "react";
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
 *
 * While it plays and the visitor scrolls down, the same <video> element turns
 * into a small floating player in the top-right corner, so the sound never
 * stops (top, because the buy bar and the chat button live at the bottom).
 * Tapping it scrolls back to the hero; ✕ pauses it and puts it back.
 */
export function IntroVideo({ url, poster: uploaded }: { url: string; poster: string | null }) {
  // Without an uploaded poster, use the designed cover. Its play button sits on
  // the seam between photo and title, so the caption is drawn in the image.
  const branded = !uploaded;
  const poster = uploaded ?? BRANDED_POSTER;
  const ref = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  /** True while the video is actually running (not paused, not ended). */
  const [running, setRunning] = useState(false);
  /**
   * Size of the in-page video box, measured when the hero scrolls away; null
   * while the hero is in view. Doubles as the placeholder size while floating.
   */
  const [away, setAway] = useState<{ w: number; h: number } | null>(null);

  const floating = playing && running && away !== null;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !playing) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const gone = !e.isIntersecting || e.intersectionRatio < 0.35;
        setAway((prev) => {
          if (!gone) return null;
          if (prev) return prev;
          const r = boxRef.current?.getBoundingClientRect();
          return { w: r?.width ?? 0, h: r?.height ?? 0 };
        });
      },
      { threshold: [0, 0.35, 0.6] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [playing]);

  function start() {
    setPlaying(true);
    track("Видео: пуснато");
    ref.current?.play().catch(() => {});
  }

  function backToVideo() {
    wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function close() {
    ref.current?.pause();
    track("Видео: затворено мини");
  }

  return (
    <div className="hero-video-wrap" ref={wrapRef}>
      <p className="hero-video-label">
        <span aria-hidden="true">▶</span> Гледай, преди да продължиш
      </p>
    <div
      ref={boxRef}
      className={
        "hero-video" +
        (branded ? " branded" : "") +
        (playing ? " is-playing" : "") +
        (floating ? " is-floating" : "")
      }
    >
      <video
        ref={ref}
        src={url}
        controls={playing && !floating}
        playsInline
        preload="none"
        onPlay={() => setRunning(true)}
        onPause={() => setRunning(false)}
        onEnded={() => setRunning(false)}
      />
      {floating && (
        <>
          <button type="button" className="hero-video-mini-back" onClick={backToVideo} aria-label="Върни се към видеото" />
          <button type="button" className="hero-video-mini-x" onClick={close} aria-label="Спри видеото">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </button>
        </>
      )}
      {!playing && (
        <>
          <Image className="hero-video-cover" src={poster} alt="" fill priority sizes="(min-width: 900px) 320px, 80vw" />
          <button type="button" className="hero-video-play" onClick={start} aria-label="Пусни видеото">
            <span className="hero-video-btn" aria-hidden="true">
              <span className="hero-video-tri">
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                </svg>
              </span>
              <span className="hero-video-btn-t">Натисни тук</span>
            </span>
            <span className={"hero-video-cap" + (branded ? " sr-only" : "")}>
              <b>Изгледай, преди да купиш</b>
              <span>Минута от мен: какво има вътре и за кого е</span>
            </span>
          </button>
        </>
      )}
    </div>
    {floating && away && (
      <div className="hero-video-ph" style={{ width: away.w, height: away.h }} aria-hidden="true" />
    )}
    </div>
  );
}
