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
  recipe_tags: { tag_id: number; tags: { name: string } | null }[];
};

function rowToCard(r: RecipeRow, unlocked: boolean): RecipeCard {
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
}

const RECIPE_SELECT = `id, title, time_minutes, servings, kcal, protein_g, carbs_g, fat_g,
       ingredients, steps, video_url, photo_url, is_locked, batch_number,
       recipe_tags ( tag_id, tags ( name ) )`;

/**
 * Reads the full recipe table (service role — bypasses RLS) and strips the
 * exclusive fields (ingredients, steps, video link) off any locked recipe
 * the caller hasn't unlocked. This function is the only place recipe rows
 * leave the server for regular viewers, so the redaction happens once,
 * here, before anything is serialized into a Server Component's client
 * payload.
 */
export async function getRecipesForViewer(access: Access): Promise<RecipeCard[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("recipes")
    .select(RECIPE_SELECT)
    .order("id", { ascending: true })
    .returns<RecipeRow[]>();

  if (error) throw error;

  return (data ?? []).map((r) => rowToCard(r, !r.is_locked || access.subscriptionActive));
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

// ---------------------------------------------------------------------
// Admin-only reads/writes. Every caller of these MUST have already
// checked isAdmin(access) — these functions don't check it themselves,
// they're only ever reached from app/admin/** and app/api/admin/**.
// ---------------------------------------------------------------------

export type RecipeInput = {
  title: string;
  timeMinutes: number | null;
  servings: number | null;
  kcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  ingredients: string | null;
  steps: string | null;
  videoUrl: string | null;
  photoUrl: string | null;
  isLocked: boolean;
  batchNumber: number | null;
  tagIds: number[];
};

export async function getAllRecipesForAdmin(): Promise<RecipeCard[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("recipes")
    .select(RECIPE_SELECT)
    .order("id", { ascending: false })
    .returns<RecipeRow[]>();

  if (error) throw error;
  return (data ?? []).map((r) => rowToCard(r, true));
}

export async function getRecipeForAdmin(
  id: number
): Promise<(RecipeCard & { tagIds: number[] }) | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("recipes")
    .select(RECIPE_SELECT)
    .eq("id", id)
    .maybeSingle()
    .returns<RecipeRow>();

  if (error) throw error;
  if (!data) return null;

  return {
    ...rowToCard(data, true),
    tagIds: data.recipe_tags.map((rt) => rt.tag_id),
  };
}

function toRow(input: RecipeInput) {
  return {
    title: input.title,
    time_minutes: input.timeMinutes,
    servings: input.servings,
    kcal: input.kcal,
    protein_g: input.proteinG,
    carbs_g: input.carbsG,
    fat_g: input.fatG,
    ingredients: input.ingredients,
    steps: input.steps,
    video_url: input.videoUrl,
    photo_url: input.photoUrl,
    is_locked: input.isLocked,
    batch_number: input.batchNumber,
  };
}

export async function createRecipe(input: RecipeInput): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("recipes")
    .insert(toRow(input))
    .select("id")
    .single();

  if (error) throw error;

  if (input.tagIds.length > 0) {
    const { error: tagError } = await admin
      .from("recipe_tags")
      .insert(input.tagIds.map((tagId) => ({ recipe_id: data.id, tag_id: tagId })));
    if (tagError) throw tagError;
  }

  return data.id;
}

export async function updateRecipe(id: number, input: RecipeInput): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("recipes").update(toRow(input)).eq("id", id);
  if (error) throw error;

  const { error: deleteError } = await admin
    .from("recipe_tags")
    .delete()
    .eq("recipe_id", id);
  if (deleteError) throw deleteError;

  if (input.tagIds.length > 0) {
    const { error: tagError } = await admin
      .from("recipe_tags")
      .insert(input.tagIds.map((tagId) => ({ recipe_id: id, tag_id: tagId })));
    if (tagError) throw tagError;
  }
}

export async function deleteRecipe(id: number): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("recipes").delete().eq("id", id);
  if (error) throw error;
}
