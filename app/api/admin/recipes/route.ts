import { NextResponse } from "next/server";
import { getAccess, isAdmin } from "@/lib/access";
import { createRecipe, type RecipeInput } from "@/lib/recipes";

export async function POST(request: Request) {
  const access = await getAccess();
  if (!isAdmin(access)) {
    return NextResponse.json({ error: "Няма достъп" }, { status: 403 });
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

  const id = await createRecipe(input);
  return NextResponse.json({ id });
}
