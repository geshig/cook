import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Favourite recipes per signed-in user, keyed by the verified session email.
 * The client keeps a local copy too, so a missing table only means favourites
 * don't sync across devices — nothing breaks.
 */
async function sessionEmail(): Promise<string | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email?.toLowerCase() ?? null;
}

export async function GET() {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ ids: [] });
  const { data, error } = await createAdminClient()
    .from("favorites")
    .select("recipe_id")
    .eq("email", email);
  if (error) return NextResponse.json({ ids: [], unavailable: true });
  return NextResponse.json({ ids: (data ?? []).map((r) => r.recipe_id as number) });
}

export async function POST(request: Request) {
  const email = await sessionEmail();
  if (!email) return NextResponse.json({ error: "Влез, за да пазиш любими." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { recipeId?: unknown; on?: unknown } | null;
  const recipeId = Number(body?.recipeId);
  if (!Number.isInteger(recipeId) || recipeId <= 0) {
    return NextResponse.json({ error: "Невалидна рецепта." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = body?.on
    ? await admin.from("favorites").upsert({ email, recipe_id: recipeId }, { onConflict: "email,recipe_id" })
    : await admin.from("favorites").delete().eq("email", email).eq("recipe_id", recipeId);

  if (error) return NextResponse.json({ ok: false, unavailable: true });
  return NextResponse.json({ ok: true });
}
