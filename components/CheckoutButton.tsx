"use client";

import { useState } from "react";

export function CheckoutButton({
  kind,
  className,
  children,
}: {
  kind: "book" | "subscription";
  className?: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/checkout/${kind}`, { method: "POST" });
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
    <button className={className ?? "btn"} onClick={handleClick} disabled={loading}>
      {loading ? "Пренасочване…" : children}
    </button>
  );
}
