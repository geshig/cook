"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/track";

type CalFn = ((...args: unknown[]) => void) & { loaded?: boolean; ns?: Record<string, unknown>; q?: unknown[] };

/**
 * Cal.com calendar inside the page, right after the coaching form, with the
 * name and email already filled in. If the embed can't load (blocked script,
 * odd in-app browser), the button below opens the same calendar on cal.com.
 */
export function CalBooking({ calLink, name, email }: { calLink: string; name: string; email: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [booked, setBooked] = useState(false);
  // The inline calendar shows only once Cal.com says it has loaded; until
  // then (or if it never does) the big button is the way to book.
  const [ready, setReady] = useState(false);
  const direct = `https://cal.com/${calLink}?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;

  useEffect(() => {
    if (!box.current) return;
    const w = window as unknown as { Cal?: CalFn };
    // Cal.com's official loader snippet (queues calls until embed.js loads).
    if (!w.Cal) {
      const cal: CalFn = function (...args: unknown[]) {
        const c = w.Cal!;
        if (!c.loaded) {
          c.ns = {};
          c.q = c.q || [];
          document.head.appendChild(document.createElement("script")).src = "https://app.cal.com/embed/embed.js";
          c.loaded = true;
        }
        if (args[0] === "init") {
          const api: CalFn = function (...a: unknown[]) {
            api.q!.push(a);
          };
          api.q = [];
          const namespace = args[1];
          if (typeof namespace === "string") {
            c.ns![namespace] = c.ns![namespace] || api;
            (c.ns![namespace] as CalFn).q!.push(args);
            c.q!.push(["initNamespace", namespace]);
          } else c.q!.push(args);
          return;
        }
        c.q!.push(args);
      };
      w.Cal = cal;
    }
    const Cal = w.Cal!;
    Cal("init", { origin: "https://cal.com" });
    Cal("inline", {
      elementOrSelector: "#cal-inline",
      calLink,
      layout: "month_view",
      config: { name, email, layout: "month_view", theme: "light" },
    });
    Cal("ui", { theme: "light", hideEventTypeDetails: true, layout: "month_view", styles: { branding: { brandColor: "#6b7f3a" } } });
    Cal("on", { action: "linkReady", callback: () => setReady(true) });
    Cal("on", {
      action: "bookingSuccessful",
      callback: () => {
        setBooked(true);
        track("Коучинг: записан разговор");
      },
    });
  }, [calLink, name, email]);

  return (
    <div className="cal-wrap">
      {booked && <p className="cal-booked">✅ Часът е записан! Поканата е в имейла ти. Ще се чуем 💪</p>}
      {!booked && (
        <a className="btn cal-btn" href={direct} target="_blank" rel="noopener" onClick={() => track("Коучинг: календар линк")}>
          📅 Избери час за разговора
        </a>
      )}
      <div ref={box} id="cal-inline" className={"cal-box" + (ready ? " on" : "")} />
    </div>
  );
}
