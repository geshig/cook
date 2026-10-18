"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ACTIVITY, GOALS, calculate, type Goal, type Sex } from "@/lib/calc";
import { track } from "@/lib/track";
import { saveTargets } from "@/lib/targets";

const KEY = "kalkulator-v1";

type Form = {
  sex: Sex;
  age: string;
  height: string;
  weight: string;
  target: string;
  activity: number;
  goal: Goal;
};

const START: Form = { sex: "f", age: "", height: "", weight: "", target: "", activity: 1.375, goal: "lose" };

const num = (s: string) => {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

/** BMI scale 15–40 → 0–100 % for the marker. */
const bmiPos = (b: number) => Math.min(100, Math.max(0, ((b - 15) / 25) * 100));

export function CalorieCalculator() {
  const [f, setF] = useState<Form>(START);
  const [tracked, setTracked] = useState(false);

  // Remember the last answers on this device (a convenience only).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setF({ ...START, ...JSON.parse(saved) });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(f));
    } catch {}
  }, [f]);

  const age = num(f.age);
  const height = num(f.height);
  const weight = num(f.weight);
  const targetKg = num(f.target);
  const valid = age >= 16 && age <= 90 && height >= 130 && height <= 220 && weight >= 35 && weight <= 250;

  const r = useMemo(
    () =>
      valid
        ? calculate({
            sex: f.sex,
            age,
            heightCm: height,
            weightKg: weight,
            activity: f.activity,
            goal: f.goal,
            targetKg: targetKg >= 35 && targetKg <= 250 ? targetKg : null,
          })
        : null,
    [valid, f.sex, age, height, weight, f.activity, f.goal, targetKg]
  );

  // Remember the numbers for recipes ("% of your day") and the menu generator.
  useEffect(() => {
    if (r) saveTargets({ kcal: r.target, protein: r.proteinMin });
  }, [r]);

  useEffect(() => {
    if (r && !tracked) {
      track("Калкулатор: сметнат");
      setTracked(true);
    }
  }, [r, tracked]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const lowBmi = r?.bmiTone === "low";

  return (
    <div className="calc">
      <form className="calc-form" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="calc-seg">
          <legend>Пол</legend>
          {(["f", "m"] as Sex[]).map((s) => (
            <label key={s} className={f.sex === s ? "on" : ""}>
              <input type="radio" name="sex" checked={f.sex === s} onChange={() => set("sex", s)} />
              {s === "f" ? "Жена" : "Мъж"}
            </label>
          ))}
        </fieldset>

        <div className="calc-nums">
          <label>
            <span>Възраст</span>
            <div className="calc-in">
              <input inputMode="numeric" placeholder="30" value={f.age} onChange={(e) => set("age", e.target.value)} />
              <i>г.</i>
            </div>
          </label>
          <label>
            <span>Ръст</span>
            <div className="calc-in">
              <input inputMode="numeric" placeholder="168" value={f.height} onChange={(e) => set("height", e.target.value)} />
              <i>cm</i>
            </div>
          </label>
          <label>
            <span>Тегло сега</span>
            <div className="calc-in">
              <input inputMode="decimal" placeholder="70" value={f.weight} onChange={(e) => set("weight", e.target.value)} />
              <i>kg</i>
            </div>
          </label>
          <label>
            <span>Желано тегло</span>
            <div className="calc-in">
              <input inputMode="decimal" placeholder="60" value={f.target} onChange={(e) => set("target", e.target.value)} />
              <i>kg</i>
            </div>
          </label>
        </div>

        <fieldset className="calc-list">
          <legend>Колко се движиш</legend>
          {ACTIVITY.map((a) => (
            <label key={a.id} className={f.activity === a.id ? "on" : ""}>
              <input type="radio" name="activity" checked={f.activity === a.id} onChange={() => set("activity", a.id)} />
              <b>{a.label}</b>
              <small>{a.hint}</small>
            </label>
          ))}
        </fieldset>

        <fieldset className="calc-seg calc-goals">
          <legend>Цел</legend>
          {GOALS.map((g) => (
            <label key={g.id} className={f.goal === g.id ? "on" : ""}>
              <input type="radio" name="goal" checked={f.goal === g.id} onChange={() => set("goal", g.id)} />
              {g.label}
            </label>
          ))}
        </fieldset>
      </form>

      <div className="calc-out" aria-live="polite">
        {!r ? (
          <div className="calc-empty">
            <b>Попълни възраст, ръст и тегло</b>
            <p>Резултатът излиза веднага, без бутон.</p>
          </div>
        ) : (
          <>
            <div className="calc-main">
              <span>Калории на ден за твоята цел</span>
              <b>
                {r.target} <small>kcal</small>
              </b>
              <p>
                Протеин: <strong>{r.proteinMin}–{r.proteinMax} g</strong> на ден
              </p>
            </div>

            <Link className="btn btn-cream calc-cta" href={`/menyuta?kcal=${r.target}&protein=${r.proteinMin}#gen`}>
              Направи ми меню за {r.target} kcal
            </Link>

            <div className="calc-grid">
              <div>
                <span>Поддържане</span>
                <b>{r.tdee} kcal</b>
                <small>толкова гориш на ден</small>
              </div>
              <div>
                <span>Темпо</span>
                <b>
                  {r.perWeek === 0 ? "0" : `${r.perWeek > 0 ? "+" : "−"}${Math.abs(r.perWeek).toLocaleString("bg-BG")}`} kg
                </b>
                <small>на седмица</small>
              </div>
              {r.weeksToTarget != null && (
                <div className="wide">
                  <span>До желаното тегло</span>
                  <b>~{r.weeksToTarget} седмици</b>
                  <small>около {Math.max(1, Math.round(r.weeksToTarget / 4.3))} месеца при това темпо</small>
                </div>
              )}
            </div>

            <div className="calc-bmi">
              <div className="calc-bmi-top">
                <span>BMI</span>
                <b>{r.bmi.toLocaleString("bg-BG")}</b>
                <em className={`tone-${r.bmiTone}`}>{r.bmiLabel}</em>
              </div>
              <div className="calc-bar" aria-hidden="true">
                <i style={{ left: `${bmiPos(r.bmi)}%` }} />
              </div>
              <small>
                Нормално тегло за твоя ръст: {r.healthyMin}–{r.healthyMax} kg
              </small>
            </div>

            {(r.floored || lowBmi) && (
              <p className="calc-warn">
                {lowBmi
                  ? "Теглото ти е под нормалното, затова не смятам отслабване. Сметнах калориите за задържане."
                  : `Не слизам под ${f.sex === "m" ? 1500 : 1200} kcal на ден. По-малко е трудно за поддържане и не е полезно.`}
              </p>
            )}
          </>
        )}
        <p className="calc-note">
          Сметките са ориентир по формулата на Mifflin-St Jeor, не медицински
          съвет. При здравословен проблем, бременност или кърмене попитай лекар.
        </p>
      </div>
    </div>
  );
}
