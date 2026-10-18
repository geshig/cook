"use client";

import { useState } from "react";
import { track } from "@/lib/track";

export function CheckoutButton({
  kind,
  className,
  children,
  source,
  forTwo,
  id,
  query,
}: {
  kind: "book" | "subscription" | "gift";
  className?: string;
  /** Where the button is, for analytics ("цена", "лента"…). */
  source?: string;
  /** Book + a second access for a friend in one payment. */
  forTwo?: boolean;
  id?: string;
  /** Extra query string, e.g. "qty=2". */
  query?: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    track(kind === "book" ? "Плащане: старт" : kind === "gift" ? "Подарък: старт" : "Абонамент: старт", { от: source ?? "друго" });
    try {
      const qs = [forTwo ? "for=2" : "", query ?? ""].filter(Boolean).join("&");
      const res = await fetch(`/api/checkout/${kind}${qs ? `?${qs}` : ""}`, { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
        alert(data.error ?? "Нещо се обърка, опитай пак.");
      }
    } catch {
      setLoading(false);
      alert("Нещо се обърка, опитай пак.");
    }
  }

  return (
    <button id={id} className={className ?? "btn"} onClick={handleClick} disabled={loading}>
      {loading ? "Пренасочване…" : children}
    </button>
  );
}
