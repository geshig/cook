/**
 * The calorie & protein targets from the calculator, remembered on this
 * device (localStorage). Used to show "% of your day" on recipes and to open
 * the menu generator with the person's own numbers. A convenience only.
 */
const KEY = "kuhnyata-targets-v1";

export type Targets = { kcal: number; protein: number };

export function readTargets(): Targets | null {
  try {
    const t = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return t && t.kcal > 0 && t.protein > 0 ? t : null;
  } catch {
    return null;
  }
}

export function saveTargets(t: Targets) {
  try {
    localStorage.setItem(KEY, JSON.stringify(t));
  } catch {}
}
