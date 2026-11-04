import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { Access } from "./types";

/** The book went on sale on 19 Oct 2026; everything added after is "new". */
export const LAUNCH = "2026-10-20T00:00:00+03:00";

export type NewRecipe = {
  id: number;
  title: string;
  photoUrl: string | null;
  kcal: number | null;
  proteinG: number | null;
  createdAt: string;
  open: boolean;
};

export type Week = { key: string; label: string; recipes: NewRecipe[] };

const DAY = 86400000;

/** Monday 00:00 (Sofia) of the week a date falls in, as yyyy-mm-dd. */
function mondayOf(iso: string): Date {
  const d = new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Europe/Sofia" }));
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  return new Date(d.getTime() - dow * DAY);
}

const fmt = (d: Date, withMonth: boolean) =>
  d.toLocaleDateString("bg-BG", withMonth ? { day: "numeric", month: "long" } : { day: "numeric" });

function weekLabel(mon: Date): string {
  const sun = new Date(mon.getTime() + 6 * DAY);
  const same = mon.getMonth() === sun.getMonth();
  return `${fmt(mon, !same)} – ${fmt(sun, true)}`;
}

/**
 * New recipes (bonus ones and anything added after the launch), newest week
 * first. "open" says whether this viewer can cook it (same rule as the book).
 */
export async function getNewRecipes(access: Access): Promise<Week[]> {
  const { data, error } = await createAdminClient()
    .from("recipes")
    .select("id, title, photo_url, kcal, protein_g, is_locked, created_at")
    .or(`is_locked.eq.true,created_at.gte.${LAUNCH}`)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  const bought = access.bookPurchasedAt ? new Date(access.bookPurchasedAt).getTime() : null;
  const weeks = new Map<string, Week>();
  for (const r of data) {
    const created = (r.created_at as string | null) ?? LAUNCH;
    const open =
      access.subscriptionActive ||
      (access.purchasedBook && !r.is_locked && (bought === null || new Date(created).getTime() <= bought));
    const mon = mondayOf(created);
    const key = mon.toISOString().slice(0, 10);
    if (!weeks.has(key)) weeks.set(key, { key, label: weekLabel(mon), recipes: [] });
    weeks.get(key)!.recipes.push({
      id: r.id as number,
      title: r.title as string,
      photoUrl: (r.photo_url as string | null) ?? null,
      kcal: (r.kcal as number | null) ?? null,
      proteinG: (r.protein_g as number | null) ?? null,
      createdAt: created,
      open,
    });
  }
  return [...weeks.values()];
}
