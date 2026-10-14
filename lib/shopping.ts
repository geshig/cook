/**
 * Shopping list kept in the browser (localStorage). One entry per recipe,
 * with the ingredient lines already scaled to the portions the user chose.
 * Personal and device-local on purpose: no account needed, works offline.
 */

export type ShoppingLine = { amount: string; text: string; group?: boolean };
export type ShoppingEntry = {
  recipeId: number;
  title: string;
  portions: number;
  lines: ShoppingLine[];
  checked: number[];
  addedAt: number;
};

const KEY = "kuhnyata-shopping-v1";
const EVENT = "kuhnyata-shopping";

export function readShopping(): ShoppingEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as ShoppingEntry[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function writeShopping(list: ShoppingEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Private mode or full storage: the list just won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Adds the recipe, or replaces it if it is already on the list (new portions). */
export function addToShopping(entry: Omit<ShoppingEntry, "checked" | "addedAt">) {
  const list = readShopping().filter((e) => e.recipeId !== entry.recipeId);
  list.unshift({ ...entry, checked: [], addedAt: Date.now() });
  writeShopping(list);
}

export function onShoppingChange(fn: () => void): () => void {
  const handler = () => fn();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function shoppingAsText(list: ShoppingEntry[]): string {
  return list
    .map((e) => {
      const rows = e.lines
        .map((l, i) => {
          if (l.group) return `\n${l.text}:`;
          const done = e.checked.includes(i) ? "✓ " : "• ";
          return `${done}${l.amount ? l.amount + " " : ""}${l.text}`;
        })
        .join("\n");
      return `${e.title} (${e.portions} ${e.portions === 1 ? "порция" : "порции"})\n${rows}`;
    })
    .join("\n\n");
}

const GLYPHS: Record<string, number> = { "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };

function parseAmount(a: string): { n: number; unit: string } | null {
  const m = a.trim().match(/^(\d+(?:[.,]\d+)?)?([¼½¾⅓⅔])?\s*(.*)$/);
  if (!m || (!m[1] && !m[2]) || /[-–]/.test(a)) return null;
  const n = (m[1] ? parseFloat(m[1].replace(",", ".")) : 0) + (m[2] ? GLYPHS[m[2]] : 0);
  return { n, unit: m[3].trim() };
}

function fmt(n: number, rawUnit: string): string {
  const unit = rawUnit === "скилидк" ? (n > 1 ? "скилидки" : "скилидка") : rawUnit === "стрък" ? (n > 1 ? "стръка" : "стрък") : rawUnit;
  const big = unit === "g" || unit === "ml";
  if (big && n >= 1000) return `${String(Math.round(n / 100) / 10).replace(".", ",")} ${unit === "g" ? "кг" : "л"}`;
  const v = big ? (n < 10 ? Math.round(n * 10) / 10 : Math.round(n)) : Math.round(n * 4) / 4;
  const whole = Math.floor(v);
  const frac = v - whole;
  const glyph = !big && frac === 0.25 ? "¼" : !big && frac === 0.5 ? "½" : !big && frac === 0.75 ? "¾" : "";
  const num = glyph ? `${whole || ""}${glyph}` : String(v).replace(".", ",");
  return `${num} ${unit}`.trim();
}

export type MergedLine = { key: string; name: string; amount: string; from: string[] };

/** Same product across recipes in one row: amounts with the same unit are added up. */
export function mergeShopping(list: ShoppingEntry[]): MergedLine[] {
  const map = new Map<string, { name: string; sums: Map<string, number>; raw: string[]; from: Set<string> }>();
  for (const e of list) {
    for (const l of e.lines) {
      if (l.group) continue;
      const name = l.text.split(",")[0].trim();
      const key = name.toLowerCase();
      const slot = map.get(key) ?? { name, sums: new Map<string, number>(), raw: [] as string[], from: new Set<string>() };
      slot.from.add(e.title);
      const p = l.amount ? parseAmount(l.amount) : null;
      if (p) {
        const unit = /^скилидк/.test(p.unit) ? "скилидк" : /^стръ/.test(p.unit) ? "стрък" : p.unit;
        slot.sums.set(unit, (slot.sums.get(unit) ?? 0) + p.n);
      }
      else if (l.amount) slot.raw.push(l.amount);
      map.set(key, slot);
    }
  }
  return [...map.entries()]
    .map(([key, s]) => ({
      key,
      name: s.name,
      amount: [...[...s.sums.entries()].map(([u, n]) => fmt(n, u)), ...s.raw].join(" + "),
      from: [...s.from],
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "bg"));
}

const MERGED_KEY = "kuhnyata-shopping-merged-checked-v1";
export function readMergedChecked(): string[] {
  try {
    return JSON.parse(localStorage.getItem(MERGED_KEY) ?? "[]");
  } catch {
    return [];
  }
}
export function writeMergedChecked(keys: string[]) {
  try {
    localStorage.setItem(MERGED_KEY, JSON.stringify(keys));
  } catch {}
}
