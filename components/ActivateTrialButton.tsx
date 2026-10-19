"use client";

import { useState } from "react";
import { track } from "@/lib/track";

/**
 * Claims the book's free bonus: opens a Stripe page that shows 0 € today, the
 * free period and the 5,99 €/month after it, and saves the card there.
 */
export function ActivateTrialButton({ className = "btn", children }: { className?: string; children: React.ReactNode }) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function go() {
    setState("busy");
    track("Бонус: старт");
    try {
      const res = await fetch("/api/checkout/subscription", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setMsg(data.error ?? "Нещо се обърка. Опитай пак.");
      setState("error");
    } catch {
      setMsg("Нещо се обърка. Опитай пак.");
      setState("error");
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={go} disabled={state === "busy"}>
        {state === "busy" ? "Отваряне…" : children}
      </button>
      {state === "error" && <p className="paywall-note" role="alert">{msg}</p>}
    </>
  );
}
