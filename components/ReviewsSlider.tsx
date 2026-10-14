"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Item = { id?: number; name: string; recipe: string; text: string; photo: string };

/** Swipeable slideshow: one card at a time on phones, arrows and dots, gentle autoplay. */
export function ReviewsSlider({ items }: { items: Item[] }) {
  const row = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  function go(i: number) {
    const el = row.current;
    if (!el) return;
    const n = (i + items.length) % items.length;
    const card = el.children[n] as HTMLElement | undefined;
    if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
  }

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const onScroll = () => {
      const w = (el.children[0] as HTMLElement | undefined)?.offsetWidth ?? 1;
      setActive(Math.round(el.scrollLeft / (w + 12)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (paused || items.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => go(active + 1), 6000);
    return () => window.clearTimeout(t);
  });

  return (
    <div
      className="slider"
      onPointerDown={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="reviews-row" ref={row}>
        {items.map((t, i) => (
          <figure key={t.id ?? i} className="review" aria-roledescription="слайд" aria-label={`${i + 1} от ${items.length}`}>
            <div className="review-photo">
              <Image src={t.photo} alt={`${t.recipe || "Ястие"}, сготвено от ${t.name}`} fill sizes="(min-width: 640px) 300px, 80vw" />
            </div>
            <blockquote>„{t.text}“</blockquote>
            <figcaption>
              <b>{t.name}</b>
              {t.recipe && <> · {t.recipe}</>}
            </figcaption>
          </figure>
        ))}
      </div>
      {items.length > 1 && (
        <div className="slider-nav">
          <button type="button" className="icon-btn" aria-label="Предишен отзив" onClick={() => { setPaused(true); go(active - 1); }}>
            ←
          </button>
          <div className="dots" role="tablist" aria-label="Отзиви">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Отзив ${i + 1}`}
                className={"dot" + (i === active ? " on" : "")}
                onClick={() => { setPaused(true); go(i); }}
              />
            ))}
          </div>
          <button type="button" className="icon-btn" aria-label="Следващ отзив" onClick={() => { setPaused(true); go(active + 1); }}>
            →
          </button>
        </div>
      )}
    </div>
  );
}
