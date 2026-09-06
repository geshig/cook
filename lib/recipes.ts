import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { Access } from "./types";
import type { RecipeCard, Tag } from "./types";

type RecipeRow = {
  id: number;
  title: string;
  time_minutes: number | null;
  servings: number | null;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  ingredients: string | null;
  steps: string | null;
  video_url: string | null;
  photo_url: string | null;
  is_locked: boolean;
  batch_number: number | null;
  recipe_tags: { tags: { name: string } | null }[];
};

/**
 * Reads the full recipe table (service role — bypasses RLS) and strips the
 * exclusive fields (ingredients, steps, video link) off any locked recipe
 * the caller hasn't unlocked. This function is the only place recipe rows
 * leave the server, so the redaction happens once, here, before anything is
 * serialized into a Server Component's client payload.
 */
export async function getRecipesForViewer(access: Access): Promise<RecipeCard[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("recipes")
    .select(
      `id, title, time_minutes, servings, kcal, protein_g, carbs_g, fat_g,
       ingredients, steps, video_url, photo_url, is_locked, batch_number,
       recipe_tags ( tags ( name ) )`
    )
    .order("id", { ascending: true })
    .returns<RecipeRow[]>();

  if (error) throw error;

  return (data ?? []).map((r) => {
    const unlocked = !r.is_locked || access.subscriptionActive;
    return {
      id: r.id,
      title: r.title,
      timeMinutes: r.time_minutes,
      servings: r.servings,
      kcal: r.kcal,
      proteinG: r.protein_g,
      carbsG: r.carbs_g,
      fatG: r.fat_g,
      photoUrl: r.photo_url,
      isLocked: r.is_locked,
      batchNumber: r.batch_number,
      tags: r.recipe_tags.map((rt) => rt.tags?.name).filter((n): n is string => !!n),
      ingredients: unlocked ? r.ingredients : null,
      steps: unlocked ? r.steps : null,
      videoUrl: unlocked ? r.video_url : null,
    };
  });
}

export async function getAllTags(): Promise<Tag[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tags")
    .select("id, name, category")
    .order("id", { ascending: true })
    .returns<Tag[]>();

  if (error) throw error;
  return data ?? [];
}
