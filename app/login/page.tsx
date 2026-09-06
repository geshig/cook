"use client";

import { useState, type FormEvent } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <section className="auth-section">
      <div className="eyebrow">Вход</div>
      <h1 className="display" style={{ fontSize: 40, color: "var(--amber)" }}>
        Влез в Кухнята
      </h1>
      <p style={{ color: "var(--text-dim)", margin: "12px 0 24px", lineHeight: 1.6 }}>
        Въведи имейла, с който плати книгата или абонамента — ще ти изпратим
        линк за вход, без парола.
      </p>

      {status === "sent" ? (
        <div className="lead-success" style={{ display: "block" }}>
          Провери пощата си 🎉 — линкът за вход е на път.
        </div>
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
