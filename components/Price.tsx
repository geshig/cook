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
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  if (!PROMO || left === null || left <= 0) return null;
  const s = Math.floor(left / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const days = (n: number) => `${n} ${n === 1 ? "ден" : "дни"}`;
  const hours = (n: number) => `${n} ${n === 1 ? "час" : "часа"}`;
  const text = d > 0 ? `${days(d)} и ${hours(h)}` : h > 0 ? `${hours(h)} и ${m} мин` : `${Math.max(1, m)} мин`;
  return (
    <p className="promo-timer">
      <span>⏳ {label}</span>
      <b>{text}</b>
    </p>
  );
}
