"use client";

import { useEffect, useState } from "react";
import { CheckoutButton } from "@/components/CheckoutButton";

/**
 * Phone-only buy bar: appears once the hero button has scrolled away and
 * hides again while the pricing card itself is on screen.
 */
export function StickyBuy({ afterPx, note }: { afterPx?: number; note?: string } = {}) {
  const [heroGone, setHeroGone] = useState(false);
  const [pricingOn, setPricingOn] = useState(false);

  // Pages without a hero button (e.g. /menyuta): show after some scrolling.
  useEffect(() => {
    if (afterPx == null) return;
    const onScroll = () => setHeroGone(window.scrollY > afterPx);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    // Hide while the buy card itself is on screen (pages that have one).
    const pricing = document.getElementById("pricing");
    const io =
      pricing && "IntersectionObserver" in window
        ? new IntersectionObserver(([e]) => setPricingOn(e.isIntersecting), { threshold: 0.15 })
        : null;
    if (pricing && io) io.observe(pricing);
    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, [afterPx]);

  useEffect(() => {
    if (afterPx != null) return;
    const hero = document.getElementById("hero-cta");
    const pricing = document.getElementById("pricing");
    if (!hero || !pricing || !("IntersectionObserver" in window)) return;
    const a = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting && e.boundingClientRect.top < 0));
    const b = new IntersectionObserver(([e]) => setPricingOn(e.isIntersecting), { threshold: 0.2 });
    a.observe(hero);
    b.observe(pricing);
    return () => {
      a.disconnect();
      b.disconnect();
    };
  }, [afterPx]);

  if (!heroGone || pricingOn) return null;
  return (
    <div className="sticky-buy">
      <div className="sticky-buy-text">
        <b>100+ рецепти за само 47 €</b>
        <span>{note ?? "+ нови рецепти безплатно с книгата"}</span>
      </div>
      <CheckoutButton kind="book" className="btn" source="лента">
        Купи
      </CheckoutButton>
    </div>
  );
}
