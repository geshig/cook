import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase/admin";

/** What anyone may see about a recipe: no ingredients, no steps. */
export type PublicRecipe = {
  id: number;
  title: string;
  photoUrl: string | null;
  kcal: number | null;
  proteinG: number | null;
  tags: string[];
};

/**
 * Light, cached list for the landing page, menus and the menu generator:
 * one small query every 5 minutes instead of the full recipe table on every
 * visit, so phones get the page faster.
 */
export const getPublicRecipes = unstable_cache(
  async (): Promise<PublicRecipe[]> => {
    const { data, error } = await createAdminClient()
      .from("recipes")
      .select("id, title, photo_url, kcal, protein_g, recipe_tags ( tags ( name ) )")
      .order("id", { ascending: true });
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id as number,
      title: r.title as string,
      photoUrl: (r.photo_url as string | null) ?? null,
      kcal: (r.kcal as number | null) ?? null,
      proteinG: (r.protein_g as number | null) ?? null,
      tags: ((r.recipe_tags as unknown as { tags: { name: string } | null }[]) ?? [])
        .map((t) => t.tags?.name)
        .filter((n): n is string => !!n),
    }));
  },
  ["public-recipes-v1"],
  { revalidate: 300, tags: ["recipes"] }
);
