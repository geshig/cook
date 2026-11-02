"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Admin → Имейли: one press sends the group email to everyone with the book. */
export function GroupInviteButton({ count }: { count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function go() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/group-invite", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(data.error ?? "Нещо се обърка.");
    setMsg(`Готово: изпратени ${data.sent}.${data.failed?.length ? ` Не тръгнаха: ${data.failed.join(", ")}` : ""}`);
    router.refresh();
  }

  return (
    <div>
      <button className="btn" onClick={go} disabled={busy || count === 0}>
        {busy ? "Изпращам… (около минута)" : `Изпрати на всички с книгата (${count})`}
      </button>
      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}
