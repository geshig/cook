import { scaleLine, toOlive, type IngredientLine } from "./scale";

/**
 * Количества в стъпките.
 *
 * В текста на стъпките знакът `{пилешки гърди}` стои веднага след думата
 * („Запичаш пилешкото {пилешки гърди} за 6 мин“). При показване той става
 * количеството от съставките за избраните порции: „пилешкото (500 g)“.
 * Ключът е част от името на продукта в съставките.
 */

const MARK = /\s?\{([^{}]+)\}/g;

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").trim();

/** Името на продукта без количеството и без бележката след запетая/скоба. */
function nameOf(line: string): string {
  const l = scaleLine(line, 1);
  const text = l.kind === "item" ? l.text : l.text;
  return text.split(/[,(]/)[0].trim();
}

/**
 * Заменя знаците в една стъпка с количествата.
 * rawLines: оригиналните редове на съставките (за търсене по име);
 * scaled: същите редове след замените и порциите (по същия индекс).
 */
export function fillStepAmounts(step: string, rawLines: string[], scaled: IngredientLine[]): string {
  if (!step.includes("{")) return step;
  // Стъпките минават през toOlive („олио“ → „зехтин“), затова и имената.
  const names = rawLines.map((l) => (l.trim().endsWith(":") ? "" : norm(toOlive(nameOf(l)))));
  return step.replace(MARK, (_m, key: string) => {
    const k = norm(toOlive(key));
    const i = names.findIndex((n) => n && (n.includes(k) || k.includes(n)));
    const line = i >= 0 ? scaled[i] : undefined;
    if (!line || line.kind !== "item" || !line.amount || /щипка|малко/.test(line.amount)) return "";
    return ` (${line.amount})`;
  });
}

/** Маха знаците (за места, където не показваме количества). */
export function stripStepMarks(text: string): string {
  return text.replace(MARK, "");
}

// ---------------------------------------------------------------------------
// Автоматично слагане на знаците (нови рецепти от Admin и първоначалното
// попълване на старите). Слага знак само при първото споменаване на продукта.

const SKIP_UNITS = /^(щипка|ч\.л\.)$/;
const SPICES =
  /^(сол|пипер|черен пипер|риган|кимион|куркума|канела|ванилия|чеснов прах|лучен прах|подправк|сух магданоз|босилек|мащерка|розмарин|джоджен|чили|кайен|паприка|пушена паприка|люти люспи|бакпулвер|сода)/;
const STOP = new Set(["или", "без", "със", "малко", "пресни", "прясна", "пресен", "нарязан", "нарязани", "нарязана", "ситно", "едро", "голям", "голяма", "големи", "малък", "малка", "малки", "средно", "среден", "средна", "по", "вкус", "желание", "избор", "light", "лайт", "обезмаслено", "обезмаслен", "нискомаслено", "нискомаслен", "лек", "лека", "леко", "леки", "гръцко", "гръцки", "хрупкав", "хрупкави", "сладък", "домашен", "домашно", "прах", "зелен", "зелена", "зелено", "зелени", "червен", "червена", "червено", "червени", "жълт", "жълта", "жълти", "бял", "бяла", "бяло", "бели", "черен", "черна", "черни"]);

function stem(word: string): string {
  const w = word.length <= 5 ? word.slice(0, word.length - 1) : word.slice(0, word.length - 2);
  return w.length >= 3 ? w : word;
}

const WORD = /[A-Za-zА-Яа-яЁё]+/g;

/** Значимите думи от името на продукта, като стебла. */
function stemsOf(name: string): string[] {
  if (/^вода от/.test(norm(name))) return ["вод"];
  return (norm(name).match(WORD) ?? []).filter((w) => w.length >= 4 && !STOP.has(w)).map(stem);
}

/** Думата в стъпката е форма на продукта („пилешкото“ от „пилешки“), а не друга дума („зеленчуците“ от „зеле“). */
const fits = (w: string, st: string) => w.startsWith(st) && w.length <= st.length + 6;

/**
 * Общи думи в стъпките, които сочат продукт с друго име:
 * „месото“/„пилето“ → пилешки гърди/бутчета/кайма, „пастата“ → спагети…
 */
const GENERIC: { word: RegExp; name: RegExp }[] = [
  { word: /^(месо|пилет|пилешкот|пилешкия|пуйкат|пуешкот)/, name: /пилеш|пиле\b|пуешк|пуйк|телеш|свинск|кайм|бутч|филе|месо/ },
  { word: /^(рибат|рибен|филет)/, name: /риба|сьомг|бяла риба|треск|хек|тон|филе/ },
  { word: /^(пастат|макарони|спагети|нудъл|фиде)/, name: /паста|спагети|макарони|фиде|нудъл|талиатели|пене|фусили|лингуини/ },
  { word: /^(каймат)/, name: /кайма/ },
];

export type AutoMarkResult = { steps: string; marked: { step: number; word: string; key: string }[] };

/**
 * Слага `{име}` след първото споменаване на всеки основен продукт в стъпките.
 * Не пипа стъпки, които вече имат знаци. Пропуска подправки, „щипка“, „ч.л.“
 * и места, където до думата вече има число.
 */
export function autoMarkSteps(ingredientsText: string | null, stepsText: string | null): AutoMarkResult {
  const steps = (stepsText ?? "").split("\n");
  if (!stepsText || stepsText.includes("{")) return { steps: stepsText ?? "", marked: [] };

  const items = (ingredientsText ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.endsWith(":"))
    .map((raw) => {
      const l = scaleLine(raw, 1);
      if (l.kind !== "item" || !l.amount) return null;
      const unit = l.amount.split(" ").slice(1).join(" ");
      const name = nameOf(raw);
      if (SKIP_UNITS.test(unit) || SPICES.test(norm(name))) return null;
      const stems = stemsOf(name);
      const words = (norm(name).match(WORD) ?? []).filter((w) => w.length >= 3).map(stem);
      return stems.length ? { name, stems, words, unit } : null;
    })
    .filter((x): x is { name: string; stems: string[]; words: string[]; unit: string } => x !== null);

  const taken = new Set<string>(); // "стъпка:позиция" на вече маркирани думи
  const marked: AutoMarkResult["marked"] = [];
  const out = [...steps];

  for (const it of items) {
    let done = false;
    for (let s = 0; s < out.length && !done; s++) {
      const line = out[s];
      if (/^\s*(\d+\.\s*)?Съвет/i.test(line)) continue;
      WORD.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = WORD.exec(line))) {
        const w = norm(m[0]);
        if (w.length < 3) continue;
        if (SPICES.test(w)) continue;
        const direct = it.stems.some((st) => fits(w, st));
        const generic = !direct && GENERIC.some((g) => g.word.test(w) && g.name.test(norm(it.name)));
        if (!direct && !generic) continue;
        // Ако думата пасва на няколко продукта („лука“ при червен и бял лук),
        // маркираме само ако думата преди нея ги различава („червения лук“).
        const rivals = items.filter(
          (o) =>
            o !== it &&
            (o.stems.some((st) => fits(w, st)) || (generic && GENERIC.some((g) => g.word.test(w) && g.name.test(norm(o.name)))))
        );
        if (rivals.length) {
          const prev = norm(line.slice(0, m.index).match(/([A-Za-zА-Яа-яЁё]+)\s*$/)?.[1] ?? "");
          const mine = it.stems.some((st) => prev.startsWith(st));
          const theirs = rivals.some((o) => o.stems.some((st) => prev.startsWith(st)));
          if (!mine || theirs) continue;
        }
        const end = m.index + m[0].length;
        const key = `${s}:${end}`;
        if (taken.has(key)) continue;
        // Вече има число до думата („200 g ориз“, „ориз 200 g“) → не слагаме.
        const before = line.slice(Math.max(0, m.index - 12), m.index);
        const after = line.slice(end, end + 10);
        // „още малко портокалов сок“, „половината сос“: само част → не слагаме.
        const near = norm(line.slice(Math.max(0, m.index - 22), m.index));
        if (/(малко|още|част|половин|остат|останал)\S*\s*\S*\s*$/.test(near)) continue;
        // Мярката вече е в текста („главата чесън“ при „1 глава чесън“).
        const unitStem = norm(it.unit).slice(0, 4);
        if (unitStem.length >= 4 && /[а-я]/.test(unitStem) && near.includes(unitStem)) continue;
        if (/\d\s*(g|гр|кг|ml|мл|л|бр\.?|с\.л\.|ч\.л\.)?\s*$/i.test(before) || /^\s*\(?\d/.test(after)) {
          done = true; // споменат е с количество: не го маркираме по-нататък
          break;
        }
        // Ако името има и друга значима дума („кисело мляко“), а следващата
        // дума в текста я продължава, слагаме знака след нея.
        let insertAt = end;
        const next = line.slice(end).match(/^\s+([A-Za-zА-Яа-яЁё]+)/);
        if (next && it.words.some((st) => norm(next[1]).startsWith(st))) insertAt = end + next[0].length;
        out[s] = `${line.slice(0, insertAt)} {${it.name}}${line.slice(insertAt)}`;
        taken.add(`${s}:${insertAt}`);
        marked.push({ step: s + 1, word: line.slice(m.index, insertAt).trim(), key: it.name });
        done = true;
        break;
      }
    }
  }
  return { steps: out.join("\n"), marked };
}
