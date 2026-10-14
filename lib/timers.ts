/**
 * Finds cooking times inside a step ("вари 10 мин", "печи 25-27 мин",
 * "1 час", "1½ ч") so the step can offer a one-tap timer.
 */

export type StepPart = { text: string } | { text: string; seconds: number };

const GLYPH: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75 };
const RE = /(\d+(?:[.,]\d+)?)?([½¼¾])?(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?\s*(мин(?:ути|ута)?|сек(?:унди)?|ч(?:аса|ас)?)(?![а-яa-z]|\.\s?л)/gi;

function num(whole?: string, glyph?: string): number | null {
  if (!whole && !glyph) return null;
  return (whole ? parseFloat(whole.replace(",", ".")) : 0) + (glyph ? GLYPH[glyph] : 0);
}

export function splitTimers(step: string): StepPart[] {
  const parts: StepPart[] = [];
  let last = 0;
  for (const m of step.matchAll(RE)) {
    const a = num(m[1], m[2]);
    if (a === null || a <= 0) continue;
    const unit = m[4].toLowerCase();
    const mult = unit.startsWith("сек") ? 1 : unit.startsWith("ч") ? 3600 : 60;
    // A range ("25-27 мин") starts the timer at the lower bound: check, then add.
    const seconds = Math.round(a * mult);
    if (seconds < 30 || seconds > 12 * 3600) continue;
    const start = m.index ?? 0;
    if (start > last) parts.push({ text: step.slice(last, start) });
    parts.push({ text: m[0], seconds });
    last = start + m[0].length;
  }
  if (last < step.length) parts.push({ text: step.slice(last) });
  return parts;
}

export function formatClock(total: number): string {
  const s = Math.max(0, Math.round(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  return (h ? `${h}:` : "") + `${mm}:${String(sec).padStart(2, "0")}`;
}
