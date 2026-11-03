/**
 * "Замени с едно натискане": common, healthier or easier swaps for a recipe
 * ingredient. The recipe stores macros only for the whole dish, so each swap
 * carries both foods' values per 100 g and the change is
 *   (new − old) × grams / servings
 * added to the per-portion macros. Values are typical label values (Lidl,
 * Kaufland, Billa); the result is shown as "≈".
 */

export type Food = { kcal: number; p: number; c: number; f: number };
export type Macros = Food;

export type Swap = {
  id: string;
  /** Matches the ingredient name (the line without its amount). */
  from: RegExp;
  /** Old food values; a function when the match decides (e.g. which mince). */
  fromFood: Food | ((matched: string) => Food);
  /** Chip text: "⇄ пуешко". */
  label: string;
  /** Replaces the matched words in the line. */
  to: string;
  toFood: Food;
  /** New grams = old grams × ratio (rice → cauliflower rice is ×3). */
  ratio?: number;
  /** The whole line becomes this text, without an amount (oil → spray). */
  wholeLine?: string;
  /** Grams in a spoon / one piece, for lines measured that way. */
  tbsp?: number;
  tsp?: number;
  piece?: number;
  /** One short line on what changes in the cooking. */
  note?: string;
};

const F = (kcal: number, p: number, c: number, f: number): Food => ({ kcal, p, c, f });

export const SWAPS: Swap[] = [
  {
    id: "thighs-breast",
    from: /пилешки бутчета( без кост и кожа)?(,? или пилешки гърди)?/i,
    fromFood: F(121, 19.5, 0, 4.8),
    label: "по-постно: гърди",
    to: "пилешки гърди",
    toFood: F(110, 23, 0, 1.5),
    note: "Гърдите изсъхват по-бързо: печи ги 2–3 мин по-малко.",
  },
  {
    id: "chicken-turkey",
    from: /пилешк(и гърди|о филе)/i,
    fromFood: F(110, 23, 0, 1.5),
    label: "пуешко",
    to: "пуешко филе",
    toFood: F(105, 24, 0, 1),
    note: "Пуйката се готви като пилето, само не я препичай.",
  },
  {
    id: "mince-turkey",
    from: /(?<!(пуешка|пилешка) )(постна |телешка |свинска |смесена )*кайма(?![а-я])/i,
    fromFood: (m) =>
      /свинска/i.test(m) ? F(263, 17, 0, 21) : /постна/i.test(m) ? F(176, 20, 0, 10) : F(215, 18.5, 0, 15.5),
    label: "пуешка кайма",
    to: "пуешка кайма",
    toFood: F(150, 19, 0, 8),
  },
  {
    id: "bacon-ham",
    from: /бекон/i,
    fromFood: F(540, 37, 1.4, 42),
    label: "пуешка шунка",
    to: "пуешка шунка",
    toFood: F(105, 17, 2, 3),
  },
  {
    id: "salmon-cod",
    from: /сьомга/i,
    fromFood: F(208, 20, 0, 13),
    label: "по-лека риба",
    to: "бяла риба (треска или хек)",
    toFood: F(82, 18, 0, 0.7),
    note: "Бялата риба е по-нежна: печи я 3–4 мин по-малко.",
  },
  {
    id: "mayo-light",
    from: /(?<!(лека|light) )майонеза/i,
    fromFood: F(680, 1, 1, 75),
    label: "лека майонеза",
    to: "лека майонеза",
    toFood: F(300, 1, 8, 30),
  },
  {
    id: "lightmayo-yogurt",
    from: /(лека|light) майонеза/i,
    fromFood: F(300, 1, 8, 30),
    label: "гръцко кисело мляко",
    to: "гръцко кисело мляко 0%",
    toFood: F(57, 10, 3.6, 0.4),
    note: "Сосът става по-кисел: добави щипка сол и капка мед или подсладител.",
  },
  {
    id: "yogurt-skyr",
    from: /(гръцко )?кисело мляко( \d+([.,]\d+)?%)?(?! 0%)/i,
    fromFood: (m) => (/гръцко/i.test(m) ? F(75, 9, 4, 2) : F(62, 3.4, 4.6, 3)),
    label: "скир",
    to: "скир",
    toFood: F(63, 11, 4, 0.2),
  },
  {
    id: "cream-cheese-light",
    from: /(?<!(light|лека|леко) )крема сирене/i,
    fromFood: F(250, 6, 4, 24),
    label: "light крема сирене",
    to: "light крема сирене",
    toFood: F(150, 8, 5, 11),
  },
  {
    id: "feta-light",
    from: /(?<!(крема|light|безмаслено|обезмаслено|котидж) )(краве |бяло |саламурено )?сирене(?![а-я])(?! (котидж|чийз))/i,
    fromFood: F(260, 17, 1, 21),
    label: "обезмаслено сирене",
    to: "обезмаслено сирене",
    toFood: F(150, 20, 2, 7),
  },
  {
    id: "kashkaval-light",
    from: /(?<!light )кашкавал/i,
    fromFood: F(350, 25, 1, 27),
    label: "light кашкавал",
    to: "light кашкавал",
    toFood: F(260, 30, 1, 15),
  },
  {
    id: "mozzarella-light",
    from: /(?<!light )моцарела/i,
    fromFood: F(250, 18, 2, 19),
    label: "light моцарела",
    to: "light моцарела",
    toFood: F(165, 20, 2, 9),
  },
  {
    id: "cream-10",
    from: /готварска сметана( 20%)?(?! 10%)/i,
    fromFood: F(200, 2.5, 3.5, 20),
    label: "сметана 10%",
    to: "готварска сметана 10%",
    toFood: F(120, 3, 4, 10),
  },
  {
    id: "milk-15",
    from: /прясно мляко( 3([.,]\d)?%)?(?! 1[.,]5%)(?! 0[.,]1%)/i,
    fromFood: F(64, 3.3, 4.7, 3.6),
    label: "мляко 1,5%",
    to: "прясно мляко 1,5%",
    toFood: F(47, 3.4, 4.8, 1.5),
  },
  {
    id: "milk-almond",
    from: /прясно мляко 1[.,]5%/i,
    fromFood: F(47, 3.4, 4.8, 1.5),
    label: "бадемово мляко",
    to: "бадемово мляко без захар",
    toFood: F(13, 0.4, 0.3, 1.1),
  },
  {
    id: "rice-cauli",
    from: /(?<!карфиолов )(бял |басмати |жасминов |кафяв )?ориз(?![а-я])( (басмати|жасмин|за суши))?/i,
    fromFood: F(355, 7, 78, 0.7),
    label: "карфиолов ориз",
    to: "карфиолов ориз",
    toFood: F(25, 1.9, 4, 0.3),
    ratio: 3,
    note: "Карфиоловият ориз не се вари: запържи го 5–6 мин в тиган.",
  },
  {
    id: "pasta-lentil",
    from: /(пълнозърнести |сухи )?(спагети|лингуини|талиатели|фузили|пене|макарони)( или (спагети|лингуини|талиатели|фузили|пене|макарони))?|(?<!(доматена|чипотле|къри|сусамова|чили|лютива) )паста(?![а-я])(?! (от|за))/i,
    fromFood: F(355, 12.5, 72, 1.5),
    label: "паста от леща",
    to: "паста от червена леща",
    toFood: F(345, 25, 47, 2),
    note: "Пастата от леща вари 2–3 мин по-кратко, иначе се разпада.",
  },
  {
    id: "tortilla-protein",
    from: /(?<!(протеинов|нисковъглехидратн)[аи] )(пшенични |царевични )?тортил(я|и)/i,
    fromFood: F(300, 8, 50, 7),
    label: "протеинова тортиля",
    to: "протеинови тортили",
    toFood: F(230, 14, 22, 8),
    piece: 60,
  },
  {
    id: "potato-sweet",
    from: /(?<!сладки )картоф(и|а)(?![а-я])/i,
    fromFood: F(77, 2, 17, 0.1),
    label: "сладки картофи",
    to: "сладки картофи",
    toFood: F(86, 1.6, 20, 0.1),
    piece: 170,
    note: "Сладките картофи се пекат по-бързо: провери ги 5 мин по-рано.",
  },
  {
    id: "sugar-sweetener",
    from: /(?<!без )(бяла |кафява |пудра |кокосова )?захар(?![а-я])/i,
    fromFood: F(400, 0, 100, 0),
    label: "подсладител",
    to: "подсладител (еритритол)",
    toFood: F(0, 0, 0, 0),
    tbsp: 12.5,
    tsp: 4,
  },
  {
    id: "honey-sweetener",
    from: /(?<![а-я])мед(?![а-я])|кленов сироп/i,
    fromFood: F(304, 0.3, 82, 0),
    label: "подсладител",
    to: "течен подсладител",
    toFood: F(0, 0, 0, 0),
    tbsp: 21,
    tsp: 7,
    note: "По-малко сладко и без карамелизиране: добави на вкус.",
  },
  {
    id: "oil-spray",
    from: /^(зехтин|олио)$/i,
    fromFood: F(884, 0, 0, 100),
    label: "на спрей",
    to: "зехтин на спрей",
    toFood: F(884, 0, 0, 100),
    ratio: 0.2,
    wholeLine: "зехтин на спрей (няколко пръскания)",
    tbsp: 13.5,
    tsp: 4.5,
  },
];

const GLYPHS: Record<string, number> = { "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };
const NUM = "(\\d+(?:[.,]\\d+)?)?([¼½¾⅓⅔⅛])?";
const LEAD = new RegExp(`^${NUM}(?:\\s*-\\s*${NUM})?(?=\\s|$)`);

const num = (w?: string, g?: string): number | null =>
  !w && !g ? null : (w ? parseFloat(w.replace(",", ".")) : 0) + (g ? GLYPHS[g] : 0);

/** Splits "200 g пилешки гърди, на кубчета" into amount, unit and the rest. */
export function splitLine(raw: string): { n: number | null; unit: string; lead: string; rest: string } {
  const line = raw.trim();
  const m = line.match(LEAD);
  const a = m ? num(m[1], m[2]) : null;
  if (!m || a === null) return { n: null, unit: "", lead: "", rest: line };
  const b = num(m[3], m[4]);
  let rest = line.slice(m[0].length).trim();
  const u = rest.match(/^(g|ml|кг|л|с\.л\.|ч\.л\.|бр\.)\s+/);
  const unit = u ? u[1] : "";
  if (u) rest = rest.slice(u[0].length);
  return { n: b ?? a, unit, lead: line.slice(0, line.length - rest.length), rest };
}

/** The swap for an ingredient line, if any (by its name, not its amount). */
export function findSwap(raw: string): Swap | null {
  const { rest } = splitLine(raw);
  const name = rest.split(",")[0].replace(/\(.*?\)/g, "").trim();
  for (const s of SWAPS) {
    if (s.id === "oil-spray") {
      if (s.from.test(name) && /(с\.л\.|ч\.л\.)/.test(raw)) return s;
      continue;
    }
    if (s.from.test(name)) return s;
  }
  return null;
}

function grams(raw: string, s: Swap): number | null {
  const { n, unit } = splitLine(raw);
  if (n === null) return null;
  if (unit === "g" || unit === "ml") return n;
  if (unit === "кг" || unit === "л") return n * 1000;
  if (unit === "с.л.") return n * (s.tbsp ?? 15);
  if (unit === "ч.л.") return n * (s.tsp ?? 5);
  if ((unit === "бр." || unit === "") && s.piece) return n * s.piece;
  return null;
}

function fmt(x: number): string {
  if (x >= 100) return String(Math.round(x / 5) * 5);
  return String(Math.round(x));
}

/**
 * Applies the active swaps to the recipe's raw ingredient lines. Returns the
 * new lines, the change in per-portion macros, and the cooking notes.
 */
export function applySwaps(
  rawLines: string[],
  active: Set<string>,
  servings: number
): { lines: string[]; delta: Macros; notes: Record<string, string>; approx: boolean } {
  const delta: Macros = { kcal: 0, p: 0, c: 0, f: 0 };
  const notes: Record<string, string> = {};
  let approx = false;
  const lines = rawLines.map((raw) => {
    if (raw.trim().endsWith(":")) return raw;
    const s = findSwap(raw);
    if (!s || !active.has(s.id)) return raw;
    const { n, unit, lead, rest } = splitLine(raw);
    const nameMatch = rest.match(s.from);
    const from = typeof s.fromFood === "function" ? s.fromFood(nameMatch?.[0] ?? rest) : s.fromFood;
    const g = grams(raw, s);
    if (g === null) approx = true;
    else {
      const ratio = s.ratio ?? 1;
      const k = g / 100 / Math.max(1, servings);
      delta.kcal += (s.toFood.kcal * ratio - from.kcal) * k;
      delta.p += (s.toFood.p * ratio - from.p) * k;
      delta.c += (s.toFood.c * ratio - from.c) * k;
      delta.f += (s.toFood.f * ratio - from.f) * k;
    }
    if (s.note) notes[s.id] = s.note;
    if (s.wholeLine) return s.wholeLine;
    const newRest = rest.replace(s.from, s.to).replace(/\s*\([^)]*\)/g, "");
    if (s.ratio && n !== null && (unit === "g" || unit === "ml")) return `${fmt(n * s.ratio)} ${unit} ${newRest}`;
    return `${lead}${newRest}`;
  });
  return { lines, delta, notes, approx };
}
