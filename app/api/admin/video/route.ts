import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAccess, isAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "Snimki";

/**
 * Videos are too big to pass through the server (Vercel caps requests at
 * ~4.5 MB), so: 1) POST {action:"sign"} returns a one-time upload URL, the
 * browser uploads straight to Supabase; 2) POST {action:"save"} stores the
 * public URL. DELETE removes the video from the landing page.
 */
export async function POST(request: Request) {
  const access = await getAccess();
  if (!isAdmin(access)) return NextResponse.json({ error: "Няма достъп" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { action?: string; ext?: string; path?: string; kind?: string; target?: string };
  const guide = body.target === "guide";
  const admin = createAdminClient();

  if (body.action === "sign") {
    const ext = (body.ext ?? "mp4").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "mp4";
    const path = `video/${guide ? "guide-" : ""}${body.kind === "poster" ? "poster" : "intro"}-${Date.now()}.${ext}`;
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) return NextResponse.json({ error: error?.message ?? "Не става" }, { status: 500 });
    return NextResponse.json({ path, token: data.token });
  }

  if (body.action === "save" && body.path?.startsWith("video/")) {
    const url = admin.storage.from(BUCKET).getPublicUrl(body.path).data.publicUrl;
    const key = `${guide ? "guide" : "intro"}_${body.kind === "poster" ? "poster" : "video"}`;
    const { error } = await admin.from("site_settings").upsert({ key, value: url, updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateTag("settings", "max");
    return NextResponse.json({ ok: true, url });
  }

  return NextResponse.json({ error: "Невалидна заявка" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const access = await getAccess();
  if (!isAdmin(access)) return NextResponse.json({ error: "Няма достъп" }, { status: 403 });
  const t = new URL(request.url).searchParams.get("target") === "guide" ? "guide" : "intro";
  await createAdminClient().from("site_settings").delete().in("key", [`${t}_video`, `${t}_poster`]);
  revalidateTag("settings", "max");
  return NextResponse.json({ ok: true });
}
