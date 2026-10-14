import { NextResponse } from "next/server";
import { getAccess, isAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "Snimki";

export async function POST(request: Request) {
  const access = await getAccess();
  if (!isAdmin(access)) return NextResponse.json({ error: "Няма достъп" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  const name = String(form?.get("name") ?? "").trim();
  const recipe = String(form?.get("recipe") ?? "").trim();
  const body = String(form?.get("body") ?? "").trim();
  const photo = form?.get("photo");
  if (!name || !body || !(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "Попълни име, текст и снимка." }, { status: 400 });
  }
  if (photo.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "Снимката е твърде голяма." }, { status: 413 });
  }

  const admin = createAdminClient();
  const path = `otzivi/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await photo.arrayBuffer()), { contentType: "image/jpeg", upsert: false });
  if (upErr) return NextResponse.json({ error: `Качването не мина: ${upErr.message}` }, { status: 500 });

  const photoUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await admin.from("testimonials").insert({ name, recipe: recipe || null, body, photo_url: photoUrl });
  if (error) return NextResponse.json({ error: `Записът не мина: ${error.message}` }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const access = await getAccess();
  if (!isAdmin(access)) return NextResponse.json({ error: "Няма достъп" }, { status: 403 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Невалиден отзив" }, { status: 400 });
  const { error } = await createAdminClient().from("testimonials").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
