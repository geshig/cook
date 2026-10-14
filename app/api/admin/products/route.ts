import { NextResponse } from "next/server";
import { getAccess, isAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "Snimki";

/** Create (no id) or update (with id) a product. Photo is optional. */
export async function POST(request: Request) {
  const access = await getAccess();
  if (!isAdmin(access)) return NextResponse.json({ error: "Няма достъп" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  const get = (k: string) => String(form?.get(k) ?? "").trim();
  const id = Number(get("id")) || null;
  const name = get("name");
  if (!name) return NextResponse.json({ error: "Попълни име на продукта." }, { status: 400 });

  const row: Record<string, unknown> = {
    name: name.slice(0, 120),
    body: get("body").slice(0, 2000) || null,
    where_to_buy: get("where").slice(0, 300) || null,
    link: get("link").slice(0, 500) || null,
    sort: Number(get("sort")) || 0,
  };

  const admin = createAdminClient();
  const photo = form?.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "Снимката е твърде голяма." }, { status: 413 });
    }
    const path = `produkti/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(path, Buffer.from(await photo.arrayBuffer()), { contentType: "image/jpeg", upsert: false });
    if (upErr) return NextResponse.json({ error: `Качването не мина: ${upErr.message}` }, { status: 500 });
    row.photo_url = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const { error } = id
    ? await admin.from("products").update(row).eq("id", id)
    : await admin.from("products").insert(row);
  if (error) return NextResponse.json({ error: `Записът не мина: ${error.message}` }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const access = await getAccess();
  if (!isAdmin(access)) return NextResponse.json({ error: "Няма достъп" }, { status: 403 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Невалиден продукт" }, { status: 400 });
  const { error } = await createAdminClient().from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
