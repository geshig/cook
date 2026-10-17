"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyLink } from "./CopyLink";

/** Paste emails (one per line) → one free-access link per person. */
export function GiftMaker() {
  const router = useRouter();
  const [names, setNames] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [made, setMade] = useState<{ note: string; link: string }[]>([]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/admin/gifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error ?? "Нещо се обърка.");
    setMade(data.gifts);
    setNames("");
    router.refresh();
  }

  return (
    <div className="gift-maker">
      <form onSubmit={submit} className="admin-form">
        <label>
          <span>Имейли (по един на ред)</span>
          <textarea
            rows={5}
            value={names}
            onChange={(e) => setNames(e.target.value)}
            placeholder={"ivan@gmail.com\nmaria@abv.bg"}
          />
        </label>
        <button className="btn" disabled={busy || !names.trim()}>
          {busy ? "Създавам…" : "Създай линкове"}
        </button>
        {err && <p style={{ color: "var(--rust)" }}>{err}</p>}
      </form>
      {made.length > 0 && (
        <div className="gift-made">
          <b>Готово. Прати на всеки неговия линк:</b>
          {made.map((g) => (
            <div key={g.link} className="gift-made-row">
              <span>{g.note}</span>
              <code>{g.link.replace(/^https?:\/\//, "")}</code>
              <CopyLink url={g.link} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
