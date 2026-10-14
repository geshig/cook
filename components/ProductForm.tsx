"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { shrink } from "./TestimonialForm";

type Initial = {
  id?: number;
  name?: string;
  body?: string;
  whereToBuy?: string;
  link?: string;
  sort?: number;
};

/** Add a new product (no initial) or edit an existing one. */
export function ProductForm({ initial, onDone }: { initial?: Initial; onDone?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const editing = !!initial?.id;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMsg(null);
    try {
      const file = data.get("photo");
      if (file instanceof File && file.size > 0) data.set("photo", await shrink(file), "photo.jpg");
      else data.delete("photo");
      const res = await fetch("/api/admin/products", { method: "POST", body: data });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error ?? "Нещо се обърка.");
      if (!editing) form.reset();
      setMsg(editing ? "Записано." : "Добавено. Вече е на /produkti.");
      router.refresh();
      onDone?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Нещо се обърка.");
    } finally {
      setBusy(false);
    }
  }

  const k = initial?.id ?? "new";
  return (
    <form className="admin-form" onSubmit={submit}>
      {editing && <input type="hidden" name="id" value={initial!.id} />}
      <label>
        Продукт
        <input name="name" id={`p-name-${k}`} required defaultValue={initial?.name} placeholder="Еритритол" />
      </label>
      <label>
        Какво е и за какво го ползвам
        <textarea
          name="body"
          id={`p-body-${k}`}
          rows={4}
          defaultValue={initial?.body}
          placeholder="Подсладител без калории. Слагам го в десертите вместо захар."
        />
      </label>
      <label>
        Къде го купувам
        <input name="where" id={`p-where-${k}`} defaultValue={initial?.whereToBuy} placeholder="Kaufland, щанда със здравословни храни" />
      </label>
      <label>
        Линк (по желание)
        <input name="link" id={`p-link-${k}`} type="url" defaultValue={initial?.link} placeholder="https://…" />
      </label>
      <label>
        Ред (по-малкото число излиза по-горе)
        <input name="sort" id={`p-sort-${k}`} type="number" defaultValue={initial?.sort ?? 0} />
      </label>
      <label>
        Снимка {editing ? "(само ако искаш да я смениш)" : "(по желание)"}
        <input name="photo" id={`p-photo-${k}`} type="file" accept="image/*" />
      </label>
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "Записване…" : editing ? "Запази" : "Добави продукт"}
      </button>
      {msg && (
        <p className="admin-msg" role="status">
          {msg}
        </p>
      )}
    </form>
  );
}

export function ProductAdminItem({
  item,
}: {
  item: { id: number; name: string; body: string; whereToBuy: string; link: string; sort: number };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="admin-review" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b>{item.name}</b>
          <p style={{ fontSize: 13, color: item.whereToBuy ? "var(--text-dim)" : "var(--rust)" }}>
            {item.whereToBuy ? `Къде: ${item.whereToBuy}` : "Липсва „Къде го купувам“"}
          </p>
        </div>
        <button type="button" className="link-btn" onClick={() => setOpen((o) => !o)}>
          {open ? "Затвори" : "Редакция"}
        </button>
        <button
          type="button"
          className="link-btn"
          disabled={busy}
          onClick={async () => {
            if (!confirm(`Да махна ли „${item.name}“?`)) return;
            setBusy(true);
            await fetch(`/api/admin/products?id=${item.id}`, { method: "DELETE" }).catch(() => {});
            router.refresh();
          }}
        >
          {busy ? "Махане…" : "Махни"}
        </button>
      </div>
      {open && <ProductForm initial={item} onDone={() => setOpen(false)} />}
    </div>
  );
}
