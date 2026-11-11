"use client";

import { useRef } from "react";
import { track } from "@/lib/track";

/** Remembered on this device once the buyer has started the "how it works" video. */
export const GUIDE_SEEN_KEY = "guide_seen_v3";

/**
 * The "how it works" video (Наръчник). No autoplay: the buyer taps play and
 * hears the voice. Starting it marks the guide as seen on this device, so the
 * welcome window in the recipes does not pop up again.
 */
export function GuideVideo({ url, poster, where }: { url: string; poster: string | null; where: string }) {
  const started = useRef(false);
  return (
    <video
      className="guide-video"
      src={url}
      poster={poster ?? undefined}
      controls
      playsInline
      preload="metadata"
      onPlay={() => {
        if (started.current) return;
        started.current = true;
        try {
          localStorage.setItem(GUIDE_SEEN_KEY, "1");
        } catch {
          /* private mode */
        }
        track("Наръчник: пуснат", { where });
      }}
      onEnded={() => track("Наръчник: догледан", { where })}
    />
  );
}
