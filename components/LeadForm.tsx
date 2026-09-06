"use client";

import { useState, type FormEvent } from "react";

export function LeadForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="lead-success" style={{ display: "block" }}>
        Провери пощата си 🎉 — трите рецепти пътуват към теб.
      </div>
    );
  }

  return (
    <>
      <form className="lead-form" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          placeholder="твоят имейл"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn" type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Изпращане…" : "Изпрати ми ги"}
        </button>
      </form>
      <div className="lead-note">
        {status === "error"
          ? "Нещо се обърка — опитай пак."
          : "Без спам. Отписваш се с един клик по всяко време."}
      </div>
    </>
  );
}
