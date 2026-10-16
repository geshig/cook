"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/** Sends one event per browser session for `onceKey` (e.g. a purchase). */
export function TrackOnce({ name, onceKey }: { name: string; onceKey: string }) {
  useEffect(() => {
    const key = `tracked:${onceKey}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode: still track once per page view */
    }
    // Umami loads after the page; give it a moment.
    const t = setTimeout(() => track(name), 1500);
    return () => clearTimeout(t);
  }, [name, onceKey]);
  return null;
}
