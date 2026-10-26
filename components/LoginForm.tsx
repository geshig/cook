"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function LoginForm() {
  // /login?email=... (after checkout) pre-fills the address the buyer paid with.
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  // /login?next=/podarak/CODE: come back there after the email link.
  const rawNext = params.get("next") ?? "";
  const next = /^\/(?![\/\\])/.test(rawNext) ? rawNext : "";
  const failed = params.get("error") === "auth";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const router = useRouter();
  const [code, setCode] = useState("");
  const [codeState, setCodeState] = useState<"idle" | "checking" | "bad">("idle");

  // The code from the email signs in THIS browser. The link signs in whichever
  // browser opens it (often Gmail's or another app's), which is why people
  // "weren't remembered" on their laptop.
  async function handleCode(e: FormEvent) {
    e.preventDefault();
    setCodeState("checking");
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.verifyOtp({ email, token: code.replace(/\s/g, ""), type: "email" });
    if (error) {
      setCodeState("bad");
      return;
    }
    router.replace(next || "/recipes");
    router.refresh();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <section className="auth-section">
      <div className="eyebrow">Вход</div>
      <h1 className="display" style={{ fontSize: 40, color: "var(--amber)" }}>
        Влез в Кухнята на Геша
      </h1>
      <p style={{ color: "var(--text-dim)", margin: "12px 0 24px", lineHeight: 1.6 }}>
        Въведи имейла, с който плати книгата или абонамента — ще ти изпратя
        линк за вход, без парола.
      </p>

      {failed && status === "idle" && (
        <div className="lead-note" style={{ color: "var(--rust)", marginBottom: 14 }}>
          Линкът за вход не сработи или е изтекъл. Въведи имейла си и ще ти пратя нов.
        </div>
      )}

      {status === "sent" ? (
        <>
          <div className="lead-success" style={{ display: "block" }}>
            Провери пощата си 🎉 Пратих ти линк и код за вход.
          </div>
          <form className="lead-form login-code" onSubmit={handleCode}>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="код от имейла"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button className="btn" type="submit" disabled={codeState === "checking"}>
              {codeState === "checking" ? "Проверявам…" : "Влез с кода"}
            </button>
          </form>
          <p className="login-hint">
            Най-сигурно е с кода: въведи го тук и сайтът ще те помни в този
            браузър. Ако натиснеш линка, отвори го в същия браузър, в който е
            сайтът.
          </p>
          {codeState === "bad" && (
            <div className="lead-note" style={{ color: "var(--rust)" }}>
              Кодът не става или е изтекъл. Провери го или поискай нов.
            </div>
          )}
        </>
      ) : (
        <form className="lead-form" onSubmit={handleSubmit}>
          <input
            type="email"
            required
            placeholder="твоят имейл"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Изпращане…" : "Изпрати линк"}
          </button>
        </form>
      )}

      {status === "error" && (
        <div className="lead-note" style={{ color: "var(--rust)" }}>
          Нещо се обърка — опитай пак.
        </div>
      )}
    </section>
  );
}
