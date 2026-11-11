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

/** Spoons and pieces: whole or half only ("¾" → "1", "1¼" → "1½"). */
function half(x: number): string {
  const q = Math.round(x * 2) / 2;
  if (q <= 0) return "малко";
  const whole = Math.floor(q);
  return (whole ? String(whole) : "") + (q - whole ? "½" : "");
}

/** Round up to a step, ignoring float noise (13 → 15, 37 → 40). */
const up = (x: number, step: number) => Math.ceil(x / step - 1e-9) * step;

/**
 * Simple, cookable amounts everywhere (also at the recipe's own portions):
 * grams and ml rounded UP to a clean number, spoons in halves, garlic in
 * whole cloves, tiny spoon amounts as "щипка".
 */
function formatAmount(x: number, unit: string): { value: string; unit: string } {
  if (unit === "g" || unit === "ml") {
    if (x >= 1000) return { value: decimal(x / 1000, 1), unit: unit === "g" ? "кг" : "л" };
    if (x < 250) return { value: String(Math.max(5, up(x, 5))), unit }; // 3 → 5, 7 → 10, 13 → 15
    return { value: String(up(x, 10)), unit };
  }
  if (unit === "кг" || unit === "л") {
    if (x < 1) return formatAmount(x * 1000, unit === "кг" ? "g" : "ml");
    return { value: decimal(x, 2), unit };
  }
  // Spoons: no "¼ ч.л." — a pinch, or tablespoons turned into teaspoons.
  if (unit === "с.л." && x < 1) return formatAmount(x * 3, "ч.л.");
  if (unit === "ч.л." && x < 0.3) return { value: "щипка", unit: "" };
  if (unit === "ч.л." && x >= 3 && Math.abs(x / 3 - Math.round(x / 3)) < 0.01) return { value: half(x / 3), unit: "с.л." };
  if (/^скилидк/.test(unit)) {
    const n = Math.max(1, up(x, 1));
    return { value: String(n), unit: n === 1 ? "скилидка" : "скилидки" };
  }
  const value = half(x);
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

  // A range ("45-50 g", "1½ ч.л. - 1 с.л.") becomes one amount: the upper one.
  // Its unit may sit after the second number ("1½ ч.л. - 1 с.л. магданоз").
  let x = b ?? a;
  let u = unit;
  if (b !== null && !unit) {
    const m2 = rest.match(/^(\S+)\s+-\s*\S+\s+(\S+)\s+/);
    if (m2 && /\.$/.test(m2[2])) {
      u = m2[2];
      rest = rest.slice(m2[0].length);
    }
  }
  if (unit && /^-/.test(rest)) {
    const m3 = rest.match(/^-\s*(\d+(?:[.,]\d+)?)?([¼½¾⅓⅔⅛])?\s+(\S+\.)\s+/);
    if (m3) {
      const n = toNumber(m3[1], m3[2]);
      if (n !== null) {
        x = n;
        u = m3[3];
        rest = rest.slice(m3[0].length);
      }
    }
  }
  const f = formatAmount(x * factor, u);
  return { kind: "item", amount: `${f.value} ${f.unit}`.trim(), text: rest };
}

/** "олио" → "зехтин" (also in steps: "олиото" → "зехтина"). */
export function toOlive(text: string): string {
  // (?<![а-я]) пази „фолио“, „портфолио“ от „фзехтин“.
  return text
    .replace(/олио или зехтин|зехтин или олио/gi, "зехтин")
    .replace(/(?<![а-яА-Я])олиото/g, "зехтина")
    .replace(/(?<![а-яА-Я])Олиото/g, "Зехтина")
    .replace(/(?<![а-яА-Я])олио/g, "зехтин")
    .replace(/(?<![а-яА-Я])Олио/g, "Зехтин");
}

const LIQUID = /зехтин|сок|сос|оцет|вода|мляко|мед|масло|бульон/i;
const isOptional = (t: string) => /по желание|по избор/i.test(t) || /кайен|люти люспи|лют сос|сирача/i.test(t);

/**
 * Makes a scaled ingredient list easy to read:
 * - "олио" is always "зехтин";
 * - a pinch of a liquid ("щипка зехтин", "щипка лимонов сок") becomes "малко";
 * - several "щипка" spices in one group become one line:
 *   "щипка: сол, черен пипер, чеснов прах, риган".
 */
export function simplifyLines(lines: IngredientLine[]): IngredientLine[] {
  const norm = lines.map((l): IngredientLine => {
    if (l.kind === "header") return l;
    let { amount, text } = l;
    text = toOlive(text);
    if (!amount && /^щипка\s+/i.test(text)) {
      amount = "щипка";
      text = text.replace(/^щипка\s+/i, "");
    }
    if (amount === "щипка" && LIQUID.test(text)) amount = "малко";
    return { kind: "item", amount, text };
  });

  const out: IngredientLine[] = [];
  let group: IngredientLine[] = [];
  const flush = () => {
    const pinch = group.filter((l) => l.kind === "item" && l.amount === "щипка" && !isOptional(l.text));
    if (pinch.length < 2) {
      out.push(...group);
    } else {
      const names = pinch.map((l) => (l.kind === "item" ? l.text : ""));
      let placed = false;
      for (const l of group) {
        if (pinch.includes(l)) {
          if (!placed) out.push({ kind: "item", amount: "щипка", text: names.join(", ") });
          placed = true;
        } else out.push(l);
      }
    }
    group = [];
  };
  for (const l of norm) {
    if (l.kind === "header") {
      flush();
      out.push(l);
    } else group.push(l);
  }
  flush();
  return out;
}

const MEAL_TAGS = ["обяд", "вечеря", "закуска", "снак"];

/** Countable lines (eggs, onions, garlic…) that would become ¼ or ⅓ at p portions. */
function awkward(lines: string[], factor: number): boolean {
  for (const raw of lines) {
    const m = raw.trim().match(LEAD);
    const a = m ? toNumber(m[1], m[2]) : null;
    if (!m || a === null) continue;
    const rest = raw.trim().slice(m[0].length).trim();
    const u = rest.split(/\s+/)[0] ?? "";
    const countable = u === "бр." || /^скилидк/.test(u) || !(METRIC.has(u) || /\.$/.test(u));
    if (!countable) continue;
    const x = a * factor;
    const frac = x - Math.floor(x);
    if (x < 0.5 || (frac > 0.01 && Math.abs(frac - 0.5) > 0.01)) return true;
  }
  return false;
}

/** Колко порции да показва рецептата при отваряне. */
export function defaultServings(servings: number | null, tags: string[], ingredientLines: string[] = []): number {
  const s = servings && servings > 0 ? servings : 1;
  const isMeal = tags.some((t) => MEAL_TAGS.includes(t));
  if (tags.includes("десерт") || !isMeal) return s; // десерти, сосове, мариновки: цялата партида
  const start = s >= 6 ? 2 : 1; // мъфини, бурито, калцоне и др. за фризера
  // Супи, запеканки и др.: толкова порции, че яйцата и лукът да са цели.
  for (let p = start; p < s; p++) if (!awkward(ingredientLines, p / s)) return p;
  return s;
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
