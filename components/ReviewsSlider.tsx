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
  const held = useRef(false);
  const resumeAt = useRef(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Gentle auto-scroll on a normal scroll container, so a finger can always
  // swipe it; it pauses while touched and resumes a few seconds later.
  useEffect(() => {
    const el = box.current;
    if (!el || !visible || items.length < 2) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (!held.current && now > resumeAt.current) {
        acc += dt * 0.035;
        if (acc >= 1) {
          const step = Math.floor(acc);
          acc -= step;
          const half = el.scrollWidth / 2;
          el.scrollLeft = el.scrollLeft + step >= half ? el.scrollLeft + step - half : el.scrollLeft + step;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, items.length]);

  const hold = () => {
    held.current = true;
  };
  const release = () => {
    held.current = false;
    resumeAt.current = performance.now() + 3500;
  };

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
      className="marquee"
      onPointerDown={hold}
      onPointerUp={release}
      onPointerCancel={release}
      onTouchStart={hold}
      onTouchEnd={release}
      onMouseEnter={hold}
      onMouseLeave={release}
      onWheel={() => {
        resumeAt.current = performance.now() + 3500;
      }}
    >
      <div className="marquee-track">
        {items.map((t, i) => card(t, i, false))}
        {items.length > 1 && items.map((t, i) => card(t, i, true))}
      </div>
    </div>
  );
}
