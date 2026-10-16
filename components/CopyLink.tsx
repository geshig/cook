"use client";

import { useState } from "react";

/** Share (phone) or copy (desktop) a link. */
export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="link-btn"
      onClick={async () => {
        try {
          if (navigator.share) await navigator.share({ title: "Подарък: Кухнята на Геша", url });
          else {
            await navigator.clipboard.writeText(url);
            setDone(true);
            setTimeout(() => setDone(false), 2000);
          }
        } catch {}
      }}
    >
      {done ? "Копирано ✓" : "Изпрати линка"}
    </button>
  );
}
