"use client";

import { useEffect, useState } from "react";
import { CheckoutButton } from "@/components/CheckoutButton";

/**
 * Phone-only buy bar: appears once the hero button has scrolled away and
 * hides again while the pricing card itself is on screen.
 */
export function StickyBuy() {
  const [heroGone, setHeroGone] = useState(false);
  const [pricingOn, setPricingOn] = useState(false);

  useEffect(() => {
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
  }, []);

  if (!heroGone || pricingOn) return null;
  return (
    <div className="sticky-buy">
      <div className="sticky-buy-text">
        <b>101 рецепти · 47 €</b>
        <span>+ 3 месеца нови рецепти безплатно</span>
      </div>
      <CheckoutButton kind="book" className="btn">
        Купи
      </CheckoutButton>
    </div>
  );
}
