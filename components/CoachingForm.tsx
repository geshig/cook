"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { COACH_DAYS, COACH_EXPERIENCE, COACH_FORMATS, COACH_GOALS } from "@/lib/coaching";
import { track } from "@/lib/track";

type Status = "idle" | "sending" | "sent" | "error";

function Choice({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="coach-choices" role="radiogroup">
      {options.map((o) => (
        <label key={o} className={value === o ? "on" : undefined}>
          <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} />
          {o}
        </label>
      ))}
    </div>
  );
}

/** „Тренирай с мен“: the application form. Goes by email to Gesha. */
export function CoachingForm() {
  const [f, setF] = useState({
    name: "",
    email: "",
    contact: "",
    format: "",
    goal: "",
    age: "",
    height: "",
    weight: "",
    experience: "",
    days: "",
    health: "",
    message: "",
    website: "",
  });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!f.format || !f.goal) {
      setError("Избери как искаш да тренираш и каква е целта ти.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setError(data.error ?? "Нещо се обърка. Опитай пак.");
        return;
      }
      setStatus("sent");
      track("Тренирай с мен: заявка", { format: f.format, goal: f.goal });
    } catch {
      setStatus("error");
      setError("Няма връзка. Опитай пак.");
    }
  }

  if (status === "sent") {
    return (
      <div className="coach-sent" role="status">
        <b>Получих заявката ти 🙌</b>
        <p>
          Пратих ти потвърждение по имейл. Ще ти пиша лично до 2 работни дни.
          Ако не го виждаш, погледни в Спам.
        </p>
      </div>
    );
  }

  return (
    <form className="coach-form" onSubmit={submit}>
      <div className="coach-row">
        <label>
          Име *
          <input required value={f.name} onChange={(e) => set("name")(e.target.value)} autoComplete="name" maxLength={80} />
        </label>
        <label>
          Имейл *
          <input
            required
            type="email"
            value={f.email}
            onChange={(e) => set("email")(e.target.value)}
            autoComplete="email"
            maxLength={120}
          />
        </label>
      </div>
      <label>
        Телефон или Instagram <span>(по желание)</span>
        <input value={f.contact} onChange={(e) => set("contact")(e.target.value)} maxLength={80} />
      </label>

      <fieldset>
        <legend>Как искаш да тренираш? *</legend>
        <Choice name="format" options={COACH_FORMATS} value={f.format} onChange={set("format")} />
      </fieldset>
      <fieldset>
        <legend>Каква е целта ти? *</legend>
        <Choice name="goal" options={COACH_GOALS} value={f.goal} onChange={set("goal")} />
      </fieldset>

      <div className="coach-row coach-row-3">
        <label>
          Възраст
          <input inputMode="numeric" value={f.age} onChange={(e) => set("age")(e.target.value)} maxLength={3} />
        </label>
        <label>
          Ръст (см)
          <input inputMode="numeric" value={f.height} onChange={(e) => set("height")(e.target.value)} maxLength={3} />
        </label>
        <label>
          Тегло (кг)
          <input inputMode="decimal" value={f.weight} onChange={(e) => set("weight")(e.target.value)} maxLength={5} />
        </label>
      </div>

      <fieldset>
        <legend>Опит с тренировки</legend>
        <Choice name="experience" options={COACH_EXPERIENCE} value={f.experience} onChange={set("experience")} />
      </fieldset>
      <fieldset>
        <legend>Колко дни в седмицата можеш да тренираш?</legend>
        <Choice name="days" options={COACH_DAYS} value={f.days} onChange={set("days")} />
      </fieldset>

      <label>
        Контузии или здравословни проблеми <span>(по желание)</span>
        <textarea rows={2} value={f.health} onChange={(e) => set("health")(e.target.value)} maxLength={800} />
      </label>
      <label>
        Разкажи ми накратко за себе си <span>(по желание)</span>
        <textarea
          rows={3}
          value={f.message}
          onChange={(e) => set("message")(e.target.value)}
          maxLength={1500}
          placeholder="Какво искаш да промениш, какво си пробвал(а) досега…"
        />
      </label>

      {/* Honeypot for bots: hidden from people */}
      <input
        className="coach-hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={f.website}
        onChange={(e) => set("website")(e.target.value)}
      />

      <label className="coach-consent">
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          Съгласен съм Геша да използва данните ми, включително за здравето ми,
          за да се свърже с мен за тренировките. Виж{" "}
          <Link href="/poveritelnost">Поверителност</Link>.
        </span>
      </label>

      {error && (
        <p className="coach-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn coach-btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Изпращам…" : "Изпрати заявката"}
      </button>
      <p className="coach-note">Без ангажимент. Първо си говорим, после решаваш.</p>
    </form>
  );
}
