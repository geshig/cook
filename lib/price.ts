/**
 * The book's price in one place. A promo has an end time; when it passes the
 * site and the checkout go back to the regular price on their own. To run
 * another promo, change PROMO (price and end) and deploy.
 */
export const REGULAR = { book: 4700, forTwo: 7400, gift: 1999 } as const;

export const PROMO: { book: number; forTwo: number; gift: number; until: string; name?: string } | null = {
  book: 2999,
  forTwo: 4499,
  gift: 1999,
  // Renews itself every day: the timer counts to 23:59 and resets at
  // midnight. The promo itself runs until this date (move it to stop).
  until: "2026-12-31T23:59:59+02:00",
  // Shown in the black bar at the top of the landing page.
  name: "Черен петък",
};

/** What the timer counts to: the end of today in Sofia, or the promo end if sooner. */
export function promoDeadline(now = Date.now()): number {
  if (!PROMO) return 0;
  const end = new Date(PROMO.until).getTime();
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const tz =
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Sofia", timeZoneName: "shortOffset" })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value ?? "GMT+2";
  const m = tz.match(/GMT([+-])(\d+)(?::(\d+))?/);
  const off = m ? `${m[1]}${m[2].padStart(2, "0")}:${(m[3] ?? "00").padStart(2, "0")}` : "+02:00";
  const dayEnd = new Date(`${day}T23:59:59${off}`).getTime();
  return Math.min(end, dayEnd);
}

export function promoActive(now = Date.now()): boolean {
  return !!PROMO && now < new Date(PROMO.until).getTime();
}

/** Cents for the book, the book for two, and a gift access, right now. */
export function prices(now = Date.now()) {
  return promoActive(now) && PROMO ? { book: PROMO.book, forTwo: PROMO.forTwo, gift: PROMO.gift } : { ...REGULAR };
}

/** 2499 → "24,99 €", 4700 → "47 €" */
export function eur(cents: number): string {
  const whole = cents % 100 === 0;
  return `${whole ? cents / 100 : (cents / 100).toFixed(2).replace(".", ",")} €`;
}
