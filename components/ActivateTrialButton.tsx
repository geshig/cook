"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ActivateTrialButton({ className = "btn", children }: { className?: string; children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function go() {
    setState("busy");
    try {
      const res = await fetch("/api/trial", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Нещо се обърка. Опитай пак.");
        setState("error");
        return;
      }
      router.refresh();
    } catch {
      setMsg("Нещо се обърка. Опитай пак.");
      setState("error");
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={go} disabled={state === "busy"}>
        {state === "busy" ? "Активиране…" : children}
      </button>
      {state === "error" && <p className="paywall-note" role="alert">{msg}</p>}
    </>
  );
}
