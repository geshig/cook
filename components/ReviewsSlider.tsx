"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Item = { id?: number; name: string; recipe: string; text: string; photo: string; rating: number | null };

/**
 * „Сготвено от вас“ as a slow, endless strip of cards. It starts moving only
 * once it scrolls into view, pauses while a finger or the mouse is on it, and
 * stays still (and swipeable) for people who prefer reduced motion.
 */
export function ReviewsSlider({ items }: { items: Item[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const card = (t: Item, i: number, copy: boolean) => (
    <figure key={(copy ? "c" : "") + (t.id ?? i)} className="review" aria-hidden={copy || undefined}>
      <div className="review-photo">
        <Image src={t.photo} alt={copy ? "" : `${t.recipe || "Ястие"}, сготвено от ${t.name}`} fill sizes="280px" />
      </div>
      {t.rating && (
        <div className="review-stars" aria-label={`${t.rating} от 5 звезди`}>
          {"★".repeat(t.rating)}
          <span>{"★".repeat(5 - t.rating)}</span>
        </div>
      )}
      {t.text ? (
        <>
          <blockquote>„{t.text}“</blockquote>
          <figcaption>
            <b>{t.name}</b>
            {t.recipe && <> · {t.recipe}</>}
          </figcaption>
        </>
      ) : (
        <figcaption className="review-cooked">
          <b>{t.name}</b> сготви
          {t.recipe && <span>{t.recipe}</span>}
        </figcaption>
      )}
    </figure>
  );

  return (
    <div
      ref={box}
      className={"marquee" + (visible && !held ? " running" : "")}
      style={{ ["--marquee-time" as string]: `${Math.max(24, items.length * 5)}s` }}
      onPointerDown={() => setHeld(true)}
      onPointerUp={() => setHeld(false)}
      onPointerCancel={() => setHeld(false)}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
    >
      <div className="marquee-track">
        {items.map((t, i) => card(t, i, false))}
        {items.length > 1 && items.map((t, i) => card(t, i, true))}
      </div>
    </div>
  );
}
