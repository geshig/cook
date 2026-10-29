"use client";

import { useEffect, useState } from "react";
import { PROMO, REGULAR, eur, prices, promoActive } from "@/lib/price";

/** The book price as text ("24,99 €"), correct even on cached pages. */
export function Price({ kind = "book" }: { kind?: "book" | "forTwo" | "gift" }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  return <span suppressHydrationWarning>{eur(prices(now ?? undefined)[kind])}</span>;
}

/** "47 €" struck through, only while the promo runs. */
export function OldPrice({ kind = "book", className }: { kind?: "book" | "forTwo" | "gift"; className?: string }) {
  const [on, setOn] = useState(promoActive());
  useEffect(() => setOn(promoActive()), []);
  if (!on || !PROMO) return null;
  return (
    <s className={className} suppressHydrationWarning>
      {eur(REGULAR[kind])}
    </s>
  );
}

/** Live countdown to the end of the promo: "2 д 06:12:33". */
export function PromoTimer({ label = "Офертата изтича след" }: { label?: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!PROMO) return;
    const end = new Date(PROMO.until).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  if (!PROMO || left === null || left <= 0) return null;
  const s = Math.floor(left / 1000);
  const d = Math.floor(s / 86400);
  const hh = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return (
    <p className="promo-timer">
      <span>⏳ {label}</span>
      <b>
        {d > 0 ? `${d} д ` : ""}
        {hh}:{mm}:{ss}
      </b>
    </p>
  );
}
