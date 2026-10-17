"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const KEY = "pendingGift";

async function redeem(code: string): Promise<{ ok: boolean; error?: string; owned?: boolean }> {
  const res = await fetch("/api/gift/redeem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return res.json().catch(() => ({ ok: false, error: "Нещо се обърка." }));
}

/** On /podarak/CODE: claim now if signed in, otherwise remember it and sign in. */
export function GiftRedeemButton({ code, signedIn, auto = false }: { code: string; signedIn: boolean; auto?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const started = useRef(false);

  async function claim() {
    setBusy(true);
    const r = await redeem(code);
    if (r.ok) {
      try {
        localStorage.removeItem(KEY);
      } catch {}
      router.push("/recipes?gift=ok");
    } else {
      setMsg(r.error ?? "Нещо се обърка.");
      setBusy(false);
    }
  }

  // Back from the email link (…?auto=1): take the gift without another tap.
  useEffect(() => {
    if (signedIn && auto && !started.current) {
      started.current = true;
      claim();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, auto]);

  if (!signedIn) {
    return (
      <Link
        className="btn"
        href={`/login?next=${encodeURIComponent(`/podarak/${code}?auto=1`)}`}
        onClick={() => {
          try {
            localStorage.setItem(KEY, code);
          } catch {}
        }}
      >
        Влез с твоя имейл и вземи подаръка
      </Link>
    );
  }
  return (
    <>
      <button className="btn" disabled={busy} onClick={claim}>
        {busy ? "Отключвам…" : "Вземи подаръка"}
      </button>
      {msg && <p className="gift-msg">{msg}</p>}
    </>
  );
}

/** After sign-in (on /recipes and /account): finishes a remembered gift. */
export function PendingGift() {
  const router = useRouter();
  useEffect(() => {
    let code: string | null = null;
    try {
      code = localStorage.getItem(KEY);
    } catch {}
    if (!code) return;
    redeem(code).then((r) => {
      if (r.ok || r.owned || r.error) {
        try {
          localStorage.removeItem(KEY);
        } catch {}
      }
      if (r.ok) router.refresh();
    });
  }, [router]);
  return null;
}
