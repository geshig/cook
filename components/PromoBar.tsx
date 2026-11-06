"use client";

import { useEffect, useState } from "react";
import { PROMO, REGULAR, eur, promoDeadline } from "@/lib/price";

/**
 * Named promo strip ("ЧЕРЕН ПЕТЪК · 47 € 29,99 € само днес · 08:12:33"),
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
  const today = s < 24 * 3600;
  return (
    <div className={"promo-bar" + (compact ? " compact" : "")}>
      {PROMO.name && <b className="promo-bar-name">🖤 {PROMO.name.toUpperCase()}</b>}
      {!compact && (
        <span className="promo-bar-price">
          <s>{eur(REGULAR.book)}</s> <b>{eur(PROMO.book)}</b>
          {today ? " само днес" : ""}
        </span>
      )}
      <span className="promo-bar-time">⏳ {time}</span>
    </div>
  );
}
