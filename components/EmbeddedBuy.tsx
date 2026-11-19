"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { track } from "@/lib/track";

/**
 * Stripe Embedded Checkout for the book. If it can't load (no key, blocked,
 * slow), the "open in browser" help below it is the way out.
 */
export function EmbeddedBuy({ forTwo, publishableKey }: { forTwo: boolean; publishableKey: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">(publishableKey ? "loading" : "failed");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!publishableKey || !box.current) return;
    let destroyed = false;
    let checkout: { destroy(): void } | null = null;
    (async () => {
      try {
        const stripe = await loadStripe(publishableKey);
        if (!stripe) throw new Error("Stripe.js not loaded");
        const instance = await stripe.createEmbeddedCheckoutPage({
          fetchClientSecret: async () => {
            const res = await fetch(`/api/checkout/book?embedded=1${forTwo ? "&for=2" : ""}`, { method: "POST" });
            const data = (await res.json()) as { clientSecret?: string; error?: string };
            if (!data.clientSecret) throw new Error(data.error ?? "no client secret");
            return data.clientSecret;
          },
        });
        if (destroyed) return instance.destroy();
        checkout = instance;
        instance.mount(box.current!);
        setState("ready");
        track("Плащане: вградено", { за: forTwo ? "двама" : "един" });
      } catch (e) {
        console.error("embedded checkout failed:", e);
        if (!destroyed) setState("failed");
      }
    })();
    return () => {
      destroyed = true;
      checkout?.destroy();
    };
  }, [forTwo, publishableKey]);

  async function copy() {
    const url = `${window.location.origin}/kupi${forTwo ? "?for=2" : ""}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Копирай линка:", url);
    }
  }

  return (
    <div className="kupi-wrap">
      {state === "loading" && <p className="kupi-loading">Зареждам плащането…</p>}
      <div ref={box} className="kupi-box" />
      <div className={"kupi-help" + (state === "failed" ? " show" : "")}>
        <b>{state === "failed" ? "Плащането не се отвори тук." : "Не се отваря?"}</b>
        <p>
          Натисни <b>⋯</b> горе вдясно и избери <b>„Отвори в браузъра“</b>. Или копирай линка и го отвори в
          Chrome или Safari.
        </p>
        <button type="button" className="btn btn-ghost" onClick={copy}>
          {copied ? "✓ Копирано" : "Копирай линка"}
        </button>
      </div>
    </div>
  );
}
