"use client";

import { useEffect, useState } from "react";
import { PROMO, REGULAR, eur } from "@/lib/price";

/**
 * Black bar on top of the landing page while a named promo runs:
 * "ЧЕРЕН ПЕТЪК · 47 € → 29,99 € · само днес · 08:12:33". Tapping it scrolls
 * to the buy card. Disappears by itself when the promo ends.
 */
export function PromoBar() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!PROMO?.name) return;
    const end = new Date(PROMO.until).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  if (!PROMO?.name || left === null || left <= 0) return null;
  const s = Math.floor(left / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  const today = s < 24 * 3600;
  return (
    <a href="#pricing" className="promo-bar">
      <b className="promo-bar-name">🖤 {PROMO.name.toUpperCase()}</b>
      <span className="promo-bar-price">
        <s>{eur(REGULAR.book)}</s> <b>{eur(PROMO.book)}</b>
        {today ? " само днес" : ""}
      </span>
      <span className="promo-bar-time">⏳ {time}</span>
    </a>
  );
}
