"use client";

import { useEffect, useState } from "react";
import { CheckoutButton } from "@/components/CheckoutButton";

/**
 * Phone-only buy bar: appears once the hero button has scrolled away and
 * hides again while the pricing card itself is on screen.
 */
export function StickyBuy({ afterPx }: { afterPx?: number } = {}) {
  const [heroGone, setHeroGone] = useState(false);
  const [pricingOn, setPricingOn] = useState(false);

  // Pages without a hero button (e.g. /menyuta): show after some scrolling.
  useEffect(() => {
    if (afterPx == null) return;
    const onScroll = () => setHeroGone(window.scrollY > afterPx);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
        <b>101 рецепти · 47 €</b>
        <span>+ 3 месеца нови рецепти безплатно</span>
      </div>
      <CheckoutButton kind="book" className="btn" source="лента">
        Купи
      </CheckoutButton>
    </div>
  );
}
