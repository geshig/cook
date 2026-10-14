"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Elements with class "reveal" ease in the first time they scroll into view.
 * Anything already on screen is marked visible in the same frame the effect
 * turns on, so nothing above the fold ever blinks. Without JS, or with
 * "reduce motion", everything is simply shown.
 */
export function RevealOnScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    const arm = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(".reveal:not(.in):not([data-armed])").forEach((el) => {
        el.dataset.armed = "1";
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
        else io.observe(el);
      });
    };

    arm(document);
    document.documentElement.classList.add("reveal-ready");

    const mo = new MutationObserver(() => arm(document));
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
