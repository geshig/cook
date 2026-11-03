"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";

async function upload(file: File, kind: "video" | "poster", target: "intro" | "guide"): Promise<string> {
  const ext = file.name.split(".").pop() ?? (kind === "video" ? "mp4" : "jpg");
  const signRes = await fetch("/api/admin/video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "sign", ext, kind, target }),
  });
  const sign = await signRes.json();
  if (!signRes.ok) throw new Error(sign.error ?? "Не мога да започна качването.");
  const { error } = await createBrowserSupabase()
    .storage.from("Snimki")
    .uploadToSignedUrl(sign.path, sign.token, file, { contentType: file.type || undefined });
  if (error) throw new Error(`Качването не мина: ${error.message}`);
  const saveRes = await fetch("/api/admin/video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save", path: sign.path, kind, target }),
  });
  const saved = await saveRes.json();
  if (!saveRes.ok) throw new Error(saved.error ?? "Записът не мина.");
  return saved.url as string;
}

export function VideoUpload({ current, target = "intro" }: { current: string | null; target?: "intro" | "guide" }) {
  const where = target === "guide" ? "страницата „Как работи“" : "началната страница";
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function pick(kind: "video" | "poster", file: File | undefined) {
    if (!file) return;
    if (kind === "video" && file.size > 50 * 1024 * 1024) {
      setMsg("Видеото е над 50 MB. Запиши го в по-ниско качество (1080p стига) или го скъси.");
      return;
    }
    setBusy(kind === "video" ? "Качвам видеото… (може да отнеме минута)" : "Качвам снимката…");
    setMsg(null);
    try {
      await upload(file, kind, target);
      setMsg(kind === "video" ? `Готово, видеото е на ${where}.` : "Готово, корицата на видеото е сменена.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Нещо се обърка.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="admin-form">
      <label>
        Видео (вертикално от телефона е идеално, до 50 MB)
        <input type="file" accept="video/*" id={`v-file-${target}`} disabled={!!busy} onChange={(e) => pick("video", e.target.files?.[0])} />
      </label>
      <label>
        Снимка, която се вижда преди пускане (по желание)
        <input type="file" accept="image/*" id={`v-poster-${target}`} disabled={!!busy} onChange={(e) => pick("poster", e.target.files?.[0])} />
      </label>
      {busy && <p className="admin-msg">{busy}</p>}
      {msg && <p className="admin-msg">{msg}</p>}
      {current && !busy && (
        <button
          type="button"
          className="link-btn"
          onClick={async () => {
            if (!confirm(`Да махна ли видеото от ${where}?`)) return;
            await fetch(`/api/admin/video?target=${target}`, { method: "DELETE" });
            router.refresh();
          }}
        >
          Махни видеото от сайта
        </button>
      )}
    </div>
  );
}
