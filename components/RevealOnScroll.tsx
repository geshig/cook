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

    // Tracked per run, not on the element: when the router restores a cached
    // page on Back/Home, its nodes come back and must be armed again.
    const armed = new WeakSet<Element>();
    const arm = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(".reveal:not(.in)").forEach((el) => {
        if (armed.has(el)) return;
        armed.add(el);
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
      // Leaving the page: show everything, so a cached copy is never blank.
      document.querySelectorAll(".reveal:not(.in)").forEach((el) => el.classList.add("in"));
    };
  }, [pathname]);

  return null;
}
