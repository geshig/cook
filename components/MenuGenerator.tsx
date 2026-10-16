"use client";

import { useMemo, useState } from "react";
import { generateDay, totals, type MiniRecipe } from "@/lib/menuMath";
import { MenuRows } from "./MenuRows";
import { track } from "@/lib/track";

const PRESETS = [1200, 1400, 1600, 1800, 2000, 2500];

/** Small seeded random, so the server and the phone draw the same first menu. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** „Колко калории искаш?“ → a whole day from the book's recipes. */
export function MenuGenerator({ recipes, initial = 1400 }: { recipes: MiniRecipe[]; initial?: number }) {
  const [target, setTarget] = useState(initial);
  const [draft, setDraft] = useState(String(initial));
  const [round, setRound] = useState(1);

  const rows = useMemo(() => generateDay(recipes, target, seeded(target * 7919 + round)), [recipes, target, round]);
  const t = totals(rows);

  function apply(v: number) {
    const n = Math.min(3500, Math.max(1100, Math.round(v / 50) * 50));
    setTarget(n);
    setDraft(String(n));
    setRound(1);
    track("Меню по калории", { kcal: n });
  }

  return (
    <div className="gen">
      <form
        className="gen-form"
        onSubmit={(e) => {
          e.preventDefault();
          apply(Number(draft) || initial);
        }}
      >
        <label htmlFor="gen-kcal">Колко калории на ден искаш?</label>
        <div className="gen-input">
          <input
            id="gen-kcal"
            type="number"
            inputMode="numeric"
            min={1100}
            max={3500}
            step={50}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <span>kcal</span>
          <button type="submit" className="btn">
            Направи меню
          </button>
        </div>
        <div className="gen-presets">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p}
              className={"tag" + (p === target ? " active" : "")}
              aria-pressed={p === target}
              onClick={() => apply(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </form>

      {rows.length > 0 && (
        <div className="gen-result" aria-live="polite">
          <div className="gen-head">
            <div className="menu-total">
              <span>{t.kcal} kcal</span>
              <span>{t.protein} g протеин</span>
            </div>
            <button type="button" className="link-btn" onClick={() => setRound((r) => r + 1)}>
              🔄 Друго меню
            </button>
          </div>
          <MenuRows rows={rows} />
        </div>
      )}
    </div>
  );
}
