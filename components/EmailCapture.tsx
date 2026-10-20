"use client";

import { useState, type FormEvent } from "react";
import { track } from "@/lib/track";

/** Email for the newsletter / email funnel, with a plain consent line. */
export function EmailCapture({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      setState(res.ok ? "sent" : "error");
      if (res.ok) track("Имейл: записан", { от: source });
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return <p className="capture-done">Готово! Ще ти пиша с нови безплатни рецепти. 🎉</p>;
  }
  return (
    <div className="capture">
      <h3>Още безплатни рецепти на имейла ти</h3>
      <p>Пращам по някоя нова рецепта и съвет за готвене. Без спам.</p>
      <form onSubmit={submit}>
        <input
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder="твоят имейл"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "…" : "Искам"}
        </button>
      </form>
      <small>
        {state === "error"
          ? "Нещо се обърка, опитай пак."
          : "С изпращането се съгласяваш да получаваш имейли от мен. Отписваш се с един клик по всяко време."}
      </small>
    </div>
  );
}
