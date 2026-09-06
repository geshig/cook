"use client";

import { useState } from "react";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
        alert(data.error ?? "Нещо се обърка.");
      }
    } catch {
      setLoading(false);
      alert("Нещо се обърка.");
    }
  }

  return (
    <button className="btn btn-ghost" onClick={handleClick} disabled={loading}>
      {loading ? "Зареждане…" : "Управление на плащания"}
    </button>
  );
}
