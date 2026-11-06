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
  // Friday 6 November 2026, until 23:59 Sofia time (a one-day test)
  until: "2026-11-06T23:59:59+02:00",
  // Shown in the black bar at the top of the landing page.
  name: "Черен петък",
};

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
