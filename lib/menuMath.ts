import type { MenuItem } from "./menus";
import { EXTRAS } from "./menus";

/** Minimal recipe info the menus need (works on server and in the browser). */
export type MiniRecipe = {
  id: number;
  title: string;
  photoUrl: string | null;
  kcal: number | null;
  proteinG: number | null;
  tags: string[];
};

/** One line of a day's menu, ready to render. */
export type MenuRow = {
  meal: string;
  label: string;
  note: string | null;
  kcal: number;
  protein: number;
  photoUrl: string | null;
  href: string | null;
};

const norm = (s: string) => s.toLowerCase().replace(/кътидж/g, "котидж").replace(/\s+/g, " ").trim();

export function findRecipe(recipes: MiniRecipe[], title: string): MiniRecipe | undefined {
  const t = norm(title);
  return recipes.find((r) => norm(r.title) === t) ?? recipes.find((r) => norm(r.title).startsWith(t.slice(0, 24)));
}

export function recipeRow(meal: string, r: MiniRecipe, qty: number, per = "порция"): MenuRow {
  return {
    meal,
    label: r.title,
    note: qty === 1 ? null : per === "порция" ? `${qty} порции` : `${qty} бр.`,
    kcal: Math.round((r.kcal ?? 0) * qty),
    protein: Math.round((r.proteinG ?? 0) * qty),
    photoUrl: r.photoUrl,
    href: `/recipes?r=${r.id}`,
  };
}

export function extraRow(meal: string, name: string, kcal: number, protein: number, qty = 1): MenuRow {
  return { meal, label: name, note: qty === 1 ? null : `×${qty}`, kcal: kcal * qty, protein: protein * qty, photoUrl: null, href: null };
}

export function rowsFor(items: MenuItem[], recipes: MiniRecipe[]): MenuRow[] {
  return items.flatMap((it) => {
    if ("extra" in it) return [extraRow(it.meal, it.extra, it.kcal, it.protein, it.qty)];
    const r = findRecipe(recipes, it.title);
    return r ? [recipeRow(it.meal, r, it.qty, it.per)] : [];
  });
}

export function totals(rows: MenuRow[]) {
  const kcal = rows.reduce((a, r) => a + r.kcal, 0);
  const protein = rows.reduce((a, r) => a + r.protein, 0);
  return { kcal: Math.round(kcal / 10) * 10, protein: Math.round(protein) };
}

// ---------------------------------------------------------------- generator

const has = (r: MiniRecipe, ...t: string[]) => t.some((x) => r.tags.includes(x));

/**
 * A whole day for a calorie target: breakfast, lunch, dinner and something
 * small, picked from the book's recipes. Protein is kept around 20–30% of the
 * calories (not as high as possible), and the gap is topped up with fruit,
 * nuts, bread or rice.
 */
export function generateDay(recipes: MiniRecipe[], target: number, rnd: () => number = Math.random): MenuRow[] {
  const ok = recipes.filter((r) => r.kcal != null && r.kcal > 0 && r.proteinG != null && !has(r, "сос", "мариновка"));
  const breakfast = ok.filter((r) => has(r, "закуска") && r.kcal! >= 180);
  const small = ok.filter((r) => has(r, "десерт", "снакс", "гарнитура") && !has(r, "закуска") && r.kcal! <= 320);
  const mains = ok.filter((r) => !has(r, "закуска", "десерт", "снакс", "гарнитура") && r.kcal! >= 250);
  if (!breakfast.length || mains.length < 2) return [];

  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const pMin = (target * 0.2) / 4;
  const pMax = (target * 0.3) / 4;
  type Pick = { b: MiniRecipe; l: MiniRecipe; d: MiniRecipe; s: MiniRecipe | null; ql: number; qd: number };
  let best: { p: Pick; score: number } | null = null;

  for (let i = 0; i < 700; i++) {
    const b = pick(breakfast);
    const l = pick(mains);
    let d = pick(mains);
    if (d.id === l.id) d = pick(mains);
    const s = small.length && rnd() < 0.8 ? pick(small) : null;
    const big = target > 2300;
    const ql = big && rnd() < 0.5 ? 1.5 : 1;
    const qd = big && rnd() < 0.5 ? 1.5 : 1;
    const kcal = b.kcal! + l.kcal! * ql + d.kcal! * qd + (s?.kcal ?? 0);
    const prot = b.proteinG! + l.proteinG! * ql + d.proteinG! * qd + (s?.proteinG ?? 0);
    if (kcal > target + 60) continue;
    const gap = target - kcal; // extras can fill up to ~350 kcal
    const score =
      (gap > 350 ? gap - 350 : 0) * 2 + gap * 0.15 + Math.max(0, prot - pMax) * 6 + Math.max(0, pMin - prot) * 4;
    if (!best || score < best.score) best = { p: { b, l, d, s, ql, qd }, score };
  }
  if (!best) return [];

  const { b, l, d, s, ql, qd } = best.p;
  const rows: MenuRow[] = [recipeRow("Закуска", b, 1), recipeRow("Обяд", l, ql), recipeRow("Вечеря", d, qd)];
  if (s) rows.push(recipeRow(has(s, "десерт") ? "Десерт" : "Снакс", s, 1));

  // Top up with simple foods, low-protein first, until close to the target.
  let sum = rows.reduce((a, r) => a + r.kcal, 0);
  const pool = [...EXTRAS].sort(() => rnd() - 0.5);
  for (const x of pool) {
    if (target - sum < 70) break;
    if (sum + x.kcal <= target + 40) {
      rows.push(extraRow("Снакс", x.name, x.kcal, x.protein));
      sum += x.kcal;
    }
  }
  return rows;
}
