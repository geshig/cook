"use client";

import { useState, type FormEvent } from "react";
import { ACTIVITY, CONTACT_APPS, GOALS, HEALTH, HEALTH_DOCTOR, TRAIN_WHERE } from "@/lib/coaching";
import { track } from "@/lib/track";

type F = {
  goal: string;
  sex: string;
  age: string;
  height_cm: string;
  weight_kg: string;
  activity: string;
  train_where: string;
  train_days: string;
  dislikes: string;
  tried: string;
  health: string[];
  health_note: string;
  plan: string;
  name: string;
  email: string;
  phone: string;
  contact_app: string;
  agree: boolean;
  website: string;
};

const EMPTY: F = {
  goal: "",
  sex: "",
  age: "",
  height_cm: "",
  weight_kg: "",
  activity: "",
  train_where: "",
  train_days: "3",
  dislikes: "",
  tried: "",
  health: [],
  health_note: "",
  plan: "three",
  name: "",
  email: "",
  phone: "",
  contact_app: "Viber",
  agree: false,
  website: "",
};

const STEPS = ["За теб", "Храна и движение", "Здраве и връзка"];

function Chips({ value, options, onPick }: { value: string; options: string[]; onPick: (v: string) => void }) {
  return (
    <div className="cf-chips">
      {options.map((o) => (
        <button key={o} type="button" className={value === o ? "on" : ""} aria-pressed={value === o} onClick={() => onPick(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

/** /treniray: a 3-step application, short on a phone; name and contact come last. */
export function CoachingForm() {
  const [f, setF] = useState<F>(EMPTY);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = <K extends keyof F>(k: K, v: F[K]) => setF((x) => ({ ...x, [k]: v }));

  function check(s: number): string | null {
    if (s === 0) {
      if (!f.goal) return "Избери целта си.";
      if (!f.sex) return "Избери пол.";
      if (!f.age || !f.height_cm || !f.weight_kg) return "Попълни години, ръст и тегло.";
      if (!f.activity) return "Избери колко се движиш.";
    }
    if (s === 1 && !f.train_where) return "Избери къде ще тренираш.";
    return null;
  }

  function next() {
    const e = check(step);
    setErr(e);
    if (e) return;
    if (step === 0) track("Коучинг: стъпка 2");
    if (step === 1) track("Коучинг: стъпка 3");
    setStep(step + 1);
    document.getElementById("forma")?.scrollIntoView({ behavior: "smooth" });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (step < 2) return next();
    if (!f.agree) return setErr("Отметни бележката за здравето.");
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/coaching/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { ok?: boolean; error?: string } | undefined;
    setBusy(false);
    if (!res?.ok || !data?.ok) {
      setErr(data?.error ?? "Нещо се обърка. Опитай пак или пиши на hello@geshapov.com.");
      return;
    }
    track("Коучинг: кандидатура", { план: f.plan === "three" ? "3 месеца" : "месечно" });
    setDone(true);
    document.getElementById("forma")?.scrollIntoView({ behavior: "smooth" });
  }

  if (done) {
    return (
      <div className="cf-done">
        <p className="cf-done-icon">💪</p>
        <h3>Получих анкетата ти!</h3>
        <p>
          Чета я лично и до 48 часа ти пиша{f.contact_app !== "Обаждане" ? ` в ${f.contact_app}` : ""}, за да си уговорим
          15-минутния разговор. Пратих ти и имейл: ако не го виждаш, провери „Спам“ и „Промоции“.
        </p>
        <p>Геша и Хоуми 🐾</p>
      </div>
    );
  }

  const needsDoctor = f.health.some((h) => HEALTH_DOCTOR.has(h));

  return (
    <form className="cf" onSubmit={submit} noValidate>
      <div className="cf-progress" aria-label={`Стъпка ${step + 1} от 3`}>
        {STEPS.map((s, i) => (
          <span key={s} className={i <= step ? "on" : ""}>
            <i />
            {s}
          </span>
        ))}
      </div>

      {step === 0 && (
        <div className="cf-step">
          <label className="cf-label">Каква е целта ти?</label>
          <Chips value={f.goal} options={GOALS} onPick={(v) => set("goal", v)} />

          <label className="cf-label">Пол</label>
          <Chips value={f.sex} options={["Жена", "Мъж"]} onPick={(v) => set("sex", v)} />

          <div className="cf-row3">
            <label>
              <span>Години</span>
              <input inputMode="numeric" value={f.age} onChange={(e) => set("age", e.target.value)} placeholder="38" maxLength={2} />
            </label>
            <label>
              <span>Ръст, см</span>
              <input inputMode="numeric" value={f.height_cm} onChange={(e) => set("height_cm", e.target.value)} placeholder="165" maxLength={3} />
            </label>
            <label>
              <span>Тегло, кг</span>
              <input inputMode="decimal" value={f.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} placeholder="72" maxLength={5} />
            </label>
          </div>

          <label className="cf-label">Колко се движиш сега?</label>
          <Chips value={f.activity} options={ACTIVITY} onPick={(v) => set("activity", v)} />
        </div>
      )}

      {step === 1 && (
        <div className="cf-step">
          <label className="cf-label">Къде ще тренираш?</label>
          <Chips value={f.train_where} options={TRAIN_WHERE} onPick={(v) => set("train_where", v)} />

          {f.train_where && f.train_where !== TRAIN_WHERE[3] && (
            <>
              <label className="cf-label">Колко пъти седмично можеш?</label>
              <Chips value={f.train_days} options={["2", "3", "4", "5"]} onPick={(v) => set("train_days", v)} />
            </>
          )}

          <label className="cf-field">
            <span>Какво не ядеш или не обичаш?</span>
            <textarea rows={2} value={f.dislikes} onChange={(e) => set("dislikes", e.target.value)} placeholder="напр. риба, гъби, лактоза" maxLength={600} />
          </label>
          <label className="cf-field">
            <span>Какво пробва досега и защо не се получи?</span>
            <textarea rows={3} value={f.tried} onChange={(e) => set("tried", e.target.value)} placeholder="напр. броих калории, но гладувах и се отказах" maxLength={1000} />
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="cf-step">
          <label className="cf-label">Имаш ли някое от тези? (по желание)</label>
          <div className="cf-checks">
            {HEALTH.map((h) => (
              <label key={h} className={f.health.includes(h) ? "on" : ""}>
                <input
                  type="checkbox"
                  checked={f.health.includes(h)}
                  onChange={(e) => set("health", e.target.checked ? [...f.health, h] : f.health.filter((x) => x !== h))}
                />
                {h}
              </label>
            ))}
          </div>
          {needsDoctor && (
            <p className="cf-hint">Благодаря, че ми казваш. Преди да започнем, ще те помоля за „да“ от лекар.</p>
          )}
          {f.health.length > 0 && (
            <label className="cf-field">
              <span>Нещо, което трябва да знам?</span>
              <textarea rows={2} value={f.health_note} onChange={(e) => set("health_note", e.target.value)} maxLength={600} />
            </label>
          )}

          <label className="cf-label">Кой план те интересува?</label>
          <Chips
            value={f.plan === "three" ? "3 месеца · 237 €" : "Месечно · 97 €"}
            options={["3 месеца · 237 €", "Месечно · 97 €"]}
            onPick={(v) => set("plan", v.startsWith("3") ? "three" : "month")}
          />

          <label className="cf-field">
            <span>Име</span>
            <input autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
          </label>
          <label className="cf-field">
            <span>Имейл</span>
            <input type="email" autoComplete="email" inputMode="email" value={f.email} onChange={(e) => set("email", e.target.value)} maxLength={120} />
          </label>
          <label className="cf-field">
            <span>Телефон</span>
            <input type="tel" autoComplete="tel" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="088…" maxLength={40} />
          </label>
          <label className="cf-label">Къде да се чуем?</label>
          <Chips value={f.contact_app} options={CONTACT_APPS} onPick={(v) => set("contact_app", v)} />

          <input className="cf-hp" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} aria-hidden="true" />

          <label className="cf-agree">
            <input type="checkbox" checked={f.agree} onChange={(e) => set("agree", e.target.checked)} />
            <span>
              Разбирам, че коучингът е за хранене и тренировки и не замества лекар. Ако имам здравословен проблем,
              ще го кажа.
            </span>
          </label>
        </div>
      )}

      {err && <p className="cf-err">{err}</p>}

      <div className="cf-nav">
        {step > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => (setErr(null), setStep(step - 1))}>
            Назад
          </button>
        )}
        <button type="submit" className="btn cf-next" disabled={busy}>
          {step < 2 ? "Напред" : busy ? "Изпращам…" : "Изпрати анкетата"}
        </button>
      </div>
    </form>
  );
}
