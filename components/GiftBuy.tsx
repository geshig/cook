"use client";

import { useState } from "react";
import { CheckoutButton } from "./CheckoutButton";

/** Choose how many gift accesses (1–5) before going to Stripe. */
export function GiftBuy() {
  const [qty, setQty] = useState(1);
  return (
    <div className="gift-buy">
      <label>
        <span>Брой подаръци</span>
        <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} × 27 € = {n * 27} €
            </option>
          ))}
        </select>
      </label>
      <CheckoutButton kind="gift" className="btn" source="профил" query={`qty=${qty}`}>
        {qty === 1 ? "Подари втори достъп" : `Подари ${qty} достъпа`}
      </CheckoutButton>
    </div>
  );
}
