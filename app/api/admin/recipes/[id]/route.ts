import { NextResponse } from "next/server";
import { getAccess, isAdmin } from "@/lib/access";
import { deleteRecipe, updateRecipe, type RecipeInput } from "@/lib/recipes";

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/admin/recipes/[id]">
) {
  const access = await getAccess();
  if (!isAdmin(access)) {
    return NextResponse.json({ error: "Няма достъп" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const recipeId = Number(id);
  if (Number.isNaN(recipeId)) {
    return NextResponse.json({ error: "Невалидно ID" }, { status: 400 });
  }

  let input: RecipeInput;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Невалидна заявка" }, { status: 400 });
  }

  if (!input.title || typeof input.title !== "string") {
    return NextResponse.json({ error: "Заглавието е задължително" }, { status: 400 });
  }

  await updateRecipe(recipeId, input);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/admin/recipes/[id]">
) {
  const access = await getAccess();
  if (!isAdmin(access)) {
    return NextResponse.json({ error: "Няма достъп" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const recipeId = Number(id);
  if (Number.isNaN(recipeId)) {
    return NextResponse.json({ error: "Невалидно ID" }, { status: 400 });
  }

  await deleteRecipe(recipeId);
  return NextResponse.json({ ok: true });
}
