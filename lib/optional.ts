/**
 * Spices and extras that are hard to find in Bulgaria or truly optional.
 * Shown next to the ingredient as "по желание" or with an easy swap.
 */
type Note = { tag: "optional" } | { tag: "swap"; hint: string };

const RULES: [RegExp, Note][] = [
  [/сумак/i, { tag: "swap", hint: "или настъргана лимонова кора" }],
  [/гарам масала/i, { tag: "swap", hint: "или къри на прах" }],
  [/кейджън|blackened/i, { tag: "swap", hint: "или пушен червен пипер, чеснов прах и щипка кайен" }],
  [/everything bagel/i, { tag: "swap", hint: "или сусам, сол, чеснов и лучен прах" }],
  [/чили масло/i, { tag: "swap", hint: "или зехтин с люти люспи" }],
  [/пресен кориандър|^кориандър$/i, { tag: "swap", hint: "или пресен магданоз" }],
  [/подправка за тако/i, { tag: "swap", hint: "или кимион, пушен червен пипер, чеснов прах и риган" }],
  [/трюфелов прах|манатарки на прах|целинов прах/i, { tag: "optional" }],
  [/кайен|люти люспи|лют сос|сирача|халапеньо|люта чушка|люти чушки|прясна люта/i, { tag: "optional" }],
  [/черен сусам|пресна мента|сушена мента|вустершир|уорчестър/i, { tag: "optional" }],
];

export function ingredientNote(text: string): Note | null {
  if (/по желание|по избор/i.test(text)) return null;
  // Match the ingredient itself, not its note in brackets.
  const name = text.replace(/\(.*?\)/g, "").trim();
  for (const [re, note] of RULES) {
    if (!re.test(name)) continue;
    // "сол, черен пипер, люти люспи": only part of the line is optional.
    if (note.tag === "optional" && (/,/.test(name) || /^(щипка )?сол\b/i.test(name) || /магданоз/i.test(name))) return null;
    return note;
  }
  return null;
}
