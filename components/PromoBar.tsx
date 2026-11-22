"use client";

import { useEffect, useState } from "react";
import { PROMO, REGULAR, promoDeadline } from "@/lib/price";

/**
 * Named promo strip ("ЧЕРЕН ПЕТЪК −50% · свършва след 08:12:33"): the
 * discount said once, the prices stay in the price line above it.
 * shown next to the buy buttons while the promo runs; gone when it ends.
 */
export function PromoBar({ compact = false }: { compact?: boolean }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!PROMO) return;
    const tick = () => setLeft(Math.max(0, promoDeadline() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  if (!PROMO || left === null || left <= 0) return null;
  const s = Math.floor(left / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  const off = Math.round((1 - PROMO.book / REGULAR.book) * 100);
  return (
    <div className={"promo-bar" + (compact ? " compact" : "")}>
      <b className="promo-bar-name">
        🖤 {(PROMO.name || "Промоция").toUpperCase()} −{off}%
      </b>
      <span className="promo-bar-time">
        {compact ? "⏳ " : "свършва след ⏳ "}
        {time}
      </span>
    </div>
  );
}
