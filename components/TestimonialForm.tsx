"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

/** Shrinks a phone photo in the browser (max 1400px, JPEG) so uploads stay small. */
export async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error("canvas"))), "image/jpeg", 0.85));
}

export function TestimonialForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("photo");
    if (!(file instanceof File) || file.size === 0) {
      setMsg("Избери снимка.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      data.set("photo", await shrink(file), "photo.jpg");
      const res = await fetch("/api/admin/testimonials", { method: "POST", body: data });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error ?? "Нещо се обърка.");
      form.reset();
      setMsg("Добавено. Вече е на лендинга.");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Нещо се обърка.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <label>
        Име
        <input name="name" id="t-name" required placeholder="Мария" />
      </label>
      <label>
        Рецепта
        <input name="recipe" id="t-recipe" placeholder="Бърз миш-маш" />
      </label>
      <label>
        Какво казва (по желание, само негови думи)
        <textarea name="body" id="t-body" rows={3} placeholder="Направих го за 15 минути и всички си облизаха пръстите." />
      </label>
      <label>
        Оценка (само ако човекът ти я е дал)
        <select name="rating" id="t-rating" defaultValue="">
          <option value="">Без звезди</option>
          <option value="5">★★★★★ 5 от 5</option>
          <option value="4">★★★★ 4 от 5</option>
        </select>
      </label>
      <label>
        Снимка на ястието
        <input name="photo" id="t-photo" type="file" accept="image/*" required />
      </label>
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Качване…" : "Добави отзив"}
      </button>
      {msg && <p className="admin-msg" role="status">{msg}</p>}
    </form>
  );
}

export function DeleteTestimonial({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="link-btn"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch(`/api/admin/testimonials?id=${id}`, { method: "DELETE" }).catch(() => {});
        router.refresh();
      }}
    >
      {busy ? "Махане…" : "Махни"}
    </button>
  );
}
