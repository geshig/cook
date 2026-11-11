"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GuideVideo, GUIDE_SEEN_KEY } from "./GuideVideo";

/**
 * One-time window on the buyer's first visit to /recipes: the "how it works"
 * video with "По-късно". Shown once per device; closing it or starting the
 * video counts as seen. The video stays on /narachnik for later.
 */
export function GuideWelcome({ url, poster }: { url: string; poster: string | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = !!localStorage.getItem(GUIDE_SEEN_KEY);
    } catch {
      seen = true; // no storage: don't nag on every visit
    }
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    try {
      localStorage.setItem(GUIDE_SEEN_KEY, "1");
    } catch {
      /* private mode */
    }
    setOpen(false);
  }

  if (!open) return null;
  return (
    <div className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-modal-title" onClick={close}>
      <div className="guide-modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="about-kicker">Добре дошъл в книгата 🐾</p>
        <h2 id="guide-modal-title" className="display">
          Как да използваш книгата
        </h2>
        <p className="guide-modal-sub">Виж всичко за 1:38. Пусни го със звук.</p>
        <GuideVideo url={url} poster={poster} where="прозорец" />
        <div className="guide-modal-actions">
          <button type="button" className="btn btn-ghost" onClick={close}>
            По-късно
          </button>
        </div>
        <p className="guide-modal-note">
          Винаги го намираш в <Link href="/narachnik" onClick={close}>„Наръчник“</Link> в менюто горе.
        </p>
      </div>
    </div>
  );
}
