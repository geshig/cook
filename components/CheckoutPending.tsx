"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Stripe redirects the buyer back a second or two before its webhook marks
 * the purchase in `subscribers`. While that happens, re-render the page from
 * the server every 2 s; as soon as access exists, /recipes renders the catalog
 * instead of this component.
 */
export function CheckoutPending() {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  const MAX = 15; // ~30 s

  useEffect(() => {
    if (tries >= MAX) return;
    const t = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, 2000);
    return () => clearTimeout(t);
  }, [tries, router]);

  if (tries >= MAX) {
    return (
      <p>
        Плащането отнема повече от обичайното. Презареди страницата след минута.
        Ако рецептите още са заключени, пиши ни на hello@geshapov.com и ще ги
        отключим веднага.
      </p>
    );
  }

  return (
    <p aria-live="polite">
      Плащането мина. Потвърждаваме го и отключваме рецептите. Обикновено отнема
      няколко секунди.
    </p>
  );
}
