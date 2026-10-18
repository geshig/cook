"use client";

import { useMemo, useState } from "react";
import { generateDay, swapRow, totals, type MenuRow, type MiniRecipe } from "@/lib/menuMath";
import Link from "next/link";
import { MenuRows } from "./MenuRows";
import { parseIngredients } from "@/lib/recipeText";
import { scaleLine } from "@/lib/scale";
import { addToShopping } from "@/lib/shopping";
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
  canShop = false,
}: {
  recipes: MiniRecipe[];
  initial?: number;
  initialProtein?: number | null;
  /** Book owners: „Моята седмица“ can go straight to the shopping list. */
  canShop?: boolean;
}) {
  const [mode, setMode] = useState<"day" | "week">("day");
  const [shopMsg, setShopMsg] = useState<string | null>(null);
  const [shopping, setShopping] = useState(false);
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
  const week = useMemo(
    () =>
      mode === "week"
        ? Array.from({ length: 7 }, (_, d) =>
            generateDay(recipes, target, seeded(target * 7919 + (protein ?? 0) * 31 + meals * 7 + round * 977 + d * 101), protein, meals)
          )
        : [],
    [mode, recipes, target, protein, meals, round]
  );

  async function shopWeek() {
    setShopping(true);
    setShopMsg(null);
    const portions = new Map<number, { title: string; n: number }>();
    const extras = new Map<string, number>();
    for (const day of week)
      for (const r of day) {
        const id = Number(r.href?.match(/r=(\d+)/)?.[1]);
        const n = r.note?.startsWith("1.5") ? 1.5 : 1;
        if (id) portions.set(id, { title: r.label, n: (portions.get(id)?.n ?? 0) + n });
        else extras.set(r.label, (extras.get(r.label) ?? 0) + 1);
      }
    try {
      const res = await fetch(`/api/menu-ingredients?ids=${[...portions.keys()].join(",")}`);
      const data = (await res.json()) as {
        recipes?: { id: number; title: string; servings: number | null; ingredients: string | null }[];
        error?: string;
      };
      if (!res.ok || !data.recipes) throw new Error(data.error ?? "");
      for (const rec of data.recipes) {
        const n = portions.get(rec.id)?.n ?? 1;
        const factor = rec.servings ? n / rec.servings : n;
        addToShopping({
          recipeId: rec.id,
          title: rec.title,
          portions: n,
          lines: parseIngredients(rec.ingredients).map((l) => {
            const x = scaleLine(l, factor);
            return x.kind === "header" ? { amount: "", text: x.text, group: true } : { amount: x.amount, text: x.text };
          }),
        });
      }
      if (extras.size)
        addToShopping({
          recipeId: -7,
          title: "Междинни храни за седмицата",
          portions: 1,
          lines: [...extras].map(([name, k]) => ({ amount: k > 1 ? `×${k}` : "", text: name })),
        });
      setShopMsg(`Добавих ${data.recipes.length} рецепти${extras.size ? " и междинните храни" : ""} в списъка.`);
      track("Седмица: в списъка");
    } catch (e) {
      setShopMsg(e instanceof Error && e.message ? e.message : "Не успях. Опитай пак.");
    }
    setShopping(false);
  }

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

      <div className="gen-mode" role="group" aria-label="Ден или седмица">
        <button type="button" className={"tag" + (mode === "day" ? " active" : "")} onClick={() => setMode("day")}>
          Един ден
        </button>
        <button type="button" className={"tag" + (mode === "week" ? " active" : "")} onClick={() => setMode("week")}>
          📅 Моята седмица
        </button>
      </div>

      {mode === "week" && week.length > 0 && (
        <div className="gen-week">
          <div className="gen-week-head">
            {canShop ? (
              <button type="button" className="btn" onClick={shopWeek} disabled={shopping}>
                {shopping ? "Добавям…" : "🛒 Всичко за седмицата в списъка"}
              </button>
            ) : (
              <p className="gen-note">Списъкът за пазаруване за цялата седмица е за хората с книгата.</p>
            )}
            <button type="button" className="link-btn" onClick={() => setRound((r) => r + 1)}>
              🔄 Друга седмица
            </button>
          </div>
          {shopMsg && (
            <p className="gen-note">
              {shopMsg} <Link href="/spisak">Виж списъка →</Link>
            </p>
          )}
          {week.map((day, d) => {
            const dt = totals(day);
            return (
              <details key={d} className="menu-day" open={d === 0}>
                <summary>
                  <div className="menu-day-top">
                    <h3>{["Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота", "Неделя"][d]}</h3>
                    <div className="menu-total">
                      <span>{dt.kcal} kcal</span>
                      <span>{dt.protein} g протеин</span>
                    </div>
                  </div>
                </summary>
                <MenuRows rows={day} />
              </details>
            );
          })}
        </div>
      )}

      {mode === "day" && rows.length > 0 && (
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
