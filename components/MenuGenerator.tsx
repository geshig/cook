"use client";

import { useMemo, useState } from "react";
import { generateDay, swapRow, totals, type MenuRow, type MiniRecipe } from "@/lib/menuMath";
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
export function MenuGenerator({
  recipes,
  initial = 1400,
  initialProtein = null,
}: {
  recipes: MiniRecipe[];
  initial?: number;
  initialProtein?: number | null;
}) {
  const [target, setTarget] = useState(initial);
  const [draft, setDraft] = useState(String(initial));
  const [protein, setProtein] = useState<number | null>(initialProtein);
  const [pDraft, setPDraft] = useState(initialProtein ? String(initialProtein) : "");
  const [round, setRound] = useState(1);
  const [meals, setMeals] = useState(5);

  const base = useMemo(
    () => generateDay(recipes, target, seeded(target * 7919 + (protein ?? 0) * 31 + meals * 7 + round), protein, meals),
    [recipes, target, protein, meals, round]
  );
  // 🔄 on one dish changes only that line; a new menu starts fresh.
  const key = `${target}-${protein}-${meals}-${round}`;
  const [edit, setEdit] = useState<{ key: string; rows: MenuRow[] } | null>(null);
  const rows = edit?.key === key ? edit.rows : base;
  function swap(i: number) {
    setEdit({ key, rows: swapRow(recipes, rows, i, target) });
    track("Меню: смени ястие");
  }
  const t = totals(rows);

  function apply(v: number, pRaw: string = pDraft) {
    const n = Math.min(3500, Math.max(1100, Math.round(v / 50) * 50));
    const pn = Number(pRaw);
    const p = Number.isFinite(pn) && pn >= 40 ? Math.min(300, Math.round(pn)) : null;
    setTarget(n);
    setDraft(String(n));
    setProtein(p);
    setPDraft(p ? String(p) : "");
    setRound(1);
    track("Меню по калории", { kcal: n, protein: p ?? 0 });
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
        </div>
        <label htmlFor="gen-protein" className="gen-p-label">
          Протеин поне <small>(по желание)</small>
        </label>
        <div className="gen-input">
          <input
            id="gen-protein"
            type="number"
            inputMode="numeric"
            min={40}
            max={300}
            step={5}
            placeholder="напр. 120"
            value={pDraft}
            onChange={(e) => setPDraft(e.target.value)}
          />
          <span>g</span>
          <button type="submit" className="btn">
            Направи меню
          </button>
        </div>
        <div className="gen-meals" role="group" aria-label="Хранения на ден">
          <span>Хранения на ден:</span>
          {[3, 4, 5, 6].map((m) => (
            <button
              type="button"
              key={m}
              className={"tag" + (m === meals ? " active" : "")}
              aria-pressed={m === meals}
              onClick={() => {
                setMeals(m);
                setRound(1);
              }}
            >
              {m}
            </button>
          ))}
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
            {protein != null && t.protein < protein && (
              <p className="gen-note">
                Най-близо до {protein} g протеин за тези калории. За повече вдигни калориите.
              </p>
            )}
            <button type="button" className="link-btn" onClick={() => setRound((r) => r + 1)}>
              🔄 Друго меню
            </button>
          </div>
          <MenuRows rows={rows} onSwap={swap} />
        </div>
      )}
    </div>
  );
}
