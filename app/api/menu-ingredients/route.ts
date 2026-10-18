import { NextResponse } from "next/server";
import { getAccess, hasBookAccess } from "@/lib/access";
import { getIngredientsFor } from "@/lib/recipes";

/** GET ?ids=1,2,3 → ingredients for the week's shopping list (book owners only). */
export async function GET(request: Request) {
  const access = await getAccess();
  if (!hasBookAccess(access)) return NextResponse.json({ error: "Само за хората с книгата." }, { status: 403 });
  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  return NextResponse.json({ recipes: await getIngredientsFor(ids, access) });
}
