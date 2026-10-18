"use client";

import { useEffect, useState } from "react";
import { cookedStats, onCookedChange } from "@/lib/cooked";

/** „Тази седмица сготви 3 рецепти 🔥“ on the recipes page. */
export function CookedStreak() {
  const [s, setS] = useState<{ week: number; total: number } | null>(null);
  useEffect(() => {
    const load = () => setS(cookedStats());
    load();
    return onCookedChange(load);
  }, []);
  if (!s || s.total === 0) return null;
  return (
    <p className="cooked-streak">
      {s.week > 0 ? (
        <>
          🔥 Тази седмица си сготвил <b>{s.week}</b> {s.week === 1 ? "рецепта" : "рецепти"}. Продължавай така!
        </>
      ) : (
        <>Нова седмица, нова рецепта. Досега си сготвил {s.total} от книгата.</>
      )}
    </p>
  );
}
