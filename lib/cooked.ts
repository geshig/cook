/**
 * „Сготвих го“: which recipes were cooked and when, on this device.
 * Shows a small weekly count on the recipes page to keep the habit going.
 */
const KEY = "kuhnyata-cooked-v1";
const EVENT = "kuhnyata-cooked";

type Entry = { id: number; at: number };

function read(): Entry[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(list: Entry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-500)));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

const dayStart = (t: number) => new Date(new Date(t).toDateString()).getTime();

export function cookedToday(id: number): boolean {
  const today = dayStart(Date.now());
  return read().some((e) => e.id === id && dayStart(e.at) === today);
}

export function toggleCookedToday(id: number): boolean {
  const today = dayStart(Date.now());
  const list = read();
  const had = list.some((e) => e.id === id && dayStart(e.at) === today);
  write(had ? list.filter((e) => !(e.id === id && dayStart(e.at) === today)) : [...list, { id, at: Date.now() }]);
  return !had;
}

/** Recipes cooked since Monday, and how many times in total. */
export function cookedStats(): { week: number; total: number } {
  const now = new Date();
  const monday = new Date(now.toDateString());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const list = read();
  return { week: list.filter((e) => e.at >= monday.getTime()).length, total: list.length };
}

export function onCookedChange(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}
