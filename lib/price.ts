/**
 * The book's price in one place. A promo has an end time; when it passes the
 * site and the checkout go back to the regular price on their own. To run
 * another promo, change PROMO (price and end) and deploy.
 */
// Постоянните цени от 2 ноември 2026 (преди: 47 € / 74 € / 27 €).
export const REGULAR = { book: 2999, forTwo: 3999, gift: 2499 } as const;

export const PROMO: { book: number; forTwo: number; gift: number; until: string } | null = null;

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
