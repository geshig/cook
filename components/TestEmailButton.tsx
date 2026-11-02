"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Admin → Имейли: sends a test to hello@ to check sending and forwarding. */
export function TestEmailButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/test-email", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(
      res.ok
        ? `Изпратен до ${data.to}. Виж в geshbdo@gmail.com (и в Спам) до минута.`
        : (data.error ?? "Нещо се обърка.")
    );
    router.refresh();
  }

  return (
    <div>
      <button className="btn" onClick={go} disabled={busy} style={{ background: "transparent", color: "var(--text)", border: "1.5px solid var(--line)" }}>
        {busy ? "Изпращам…" : "Изпрати тестов имейл до hello@"}
      </button>
      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}
