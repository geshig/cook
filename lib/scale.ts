/**
 * Преизчисляване на съставките спрямо избрания брой порции.
 *
 * Редовете идват от recipes.ingredients (разделени с "; ", виж recipeText.ts):
 *   "500 g картофи, на резени"   -> количество + мерна единица + текст
 *   "1-2 с.л. зехтин"            -> диапазон
 *   "½ ч.л. кимион"              -> дроб
 *   "Сос:"                       -> подзаглавие на група
 *   "сол и черен пипер"          -> "на вкус", не се пипа
 */

const GLYPHS: Record<string, number> = { "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };
const NUM = "(\\d+(?:[.,]\\d+)?)?([¼½¾⅓⅔⅛])?";
const LEAD = new RegExp(`^${NUM}(?:\\s*-\\s*${NUM})?(?=\\s|$)`);
const METRIC = new Set(["g", "ml", "кг", "л"]);

export type IngredientLine =
  | { kind: "header"; text: string }
  | { kind: "item"; amount: string; text: string };

function toNumber(whole?: string, glyph?: string): number | null {
  if (!whole && !glyph) return null;
  let n = whole ? parseFloat(whole.replace(",", ".")) : 0;
  if (glyph) n += GLYPHS[glyph];
  return n;
}

function decimal(x: number, digits: number): string {
  const p = Math.pow(10, digits);
  return String(Math.round(x * p) / p).replace(".", ",");
}

function quarter(x: number): string {
  const q = Math.round(x * 4) / 4;
  if (q <= 0) return "малко";
  const whole = Math.floor(q);
  const frac = q - whole;
  const glyph = frac === 0.25 ? "¼" : frac === 0.5 ? "½" : frac === 0.75 ? "¾" : "";
  return (whole ? String(whole) : "") + glyph;
}

function formatAmount(x: number, unit: string): { value: string; unit: string } {
  if (unit === "g" || unit === "ml") {
    if (x >= 1000) return { value: decimal(x / 1000, 1), unit: unit === "g" ? "кг" : "л" };
    if (x < 10) return { value: decimal(x, 1), unit };
    if (x < 60) return { value: String(Math.round(x)), unit };
    return { value: String(Math.round(x / 5) * 5), unit };
  }
  if (unit === "кг" || unit === "л") {
    if (x < 1) return { value: String(Math.round((x * 1000) / 5) * 5), unit: unit === "кг" ? "g" : "ml" };
    return { value: decimal(x, 2), unit };
  }
  const value = quarter(x);
  if (value === "1" && /^скилидк/.test(unit)) return { value, unit: "скилидка" };
  if (value === "1" && unit === "стръка") return { value, unit: "стрък" };
  return { value, unit };
}

/** Разделя реда и го преизчислява с коефициент factor (избрани порции / порции на рецептата). */
export function scaleLine(line: string, factor: number): IngredientLine {
  const raw = line.trim();
  if (raw.endsWith(":")) return { kind: "header", text: raw.slice(0, -1) };

  const m = raw.match(LEAD);
  const a = m ? toNumber(m[1], m[2]) : null;
  if (!m || a === null) return { kind: "item", amount: "", text: raw };

  const b = toNumber(m[3], m[4]);
  let rest = raw.slice(m[0].length).trim();
  const unitMatch = rest.match(/^(\S+)\s+/);
  const unit = unitMatch && (METRIC.has(unitMatch[1]) || /\.$/.test(unitMatch[1]) || /^(скилидк|стрък|стръка|фили|шеп|консерв|резен|връзк|глав)/.test(unitMatch[1]))
    ? unitMatch[1]
    : "";
  if (unit) rest = rest.slice(unitMatch![0].length);

  if (factor === 1) {
    return { kind: "item", amount: m[0] + (unit ? " " + unit : ""), text: rest };
  }
  const fa = formatAmount(a * factor, unit);
  let amount = fa.value;
  if (b !== null) {
    const fb = formatAmount(b * factor, unit);
    amount = fa.unit === fb.unit ? `${fa.value}-${fb.value}` : `${fa.value} ${fa.unit} - ${fb.value}`;
    return { kind: "item", amount: `${amount} ${fb.unit}`.trim(), text: rest };
  }
  return { kind: "item", amount: `${amount} ${fa.unit}`.trim(), text: rest };
}

const MEAL_TAGS = ["обяд", "вечеря", "закуска", "снак"];

/** Колко порции да показва рецептата при отваряне. */
export function defaultServings(servings: number | null, tags: string[]): number {
  const s = servings && servings > 0 ? servings : 1;
  const isMeal = tags.some((t) => MEAL_TAGS.includes(t));
  if (tags.includes("десерт") || !isMeal) return s; // десерти, сосове, мариновки: цялата партида
  if (s >= 6) return 2; // мъфини, бурито, калцоне и др. за фризера
  return 1;
}

/** Отделя стъпките от съветите ("Съвет: ..."). */
export function splitTips(steps: string[]): { steps: string[]; tips: string[] } {
  const out: string[] = [];
  const tips: string[] = [];
  for (const s of steps) {
    if (/^Съвет:\s*/.test(s)) tips.push(s.replace(/^Съвет:\s*/, ""));
    else out.push(s);
  }
  return { steps: out, tips };
}
