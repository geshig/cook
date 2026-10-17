import { NextResponse } from "next/server";
import { getAccess, isAdmin } from "@/lib/access";
import { createManualGifts } from "@/lib/gifts";

/** Админ → Подаръци: free access codes, one per line of the textarea. */
export async function POST(request: Request) {
  const access = await getAccess();
  if (!isAdmin(access)) return NextResponse.json({ error: "Няма достъп" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { names?: string };
  const notes = String(body.names ?? "")
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
  if (notes.length === 0) return NextResponse.json({ error: "Напиши поне един имейл или име." }, { status: 400 });
  const gifts = await createManualGifts(notes);
  if (gifts.length === 0) return NextResponse.json({ error: "Не успях да създам кодове. Пуснат ли е gifts.sql?" }, { status: 500 });
  return NextResponse.json({ gifts });
}
