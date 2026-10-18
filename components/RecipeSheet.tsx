"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { RecipeCard } from "@/lib/types";
import { parseIngredients, parseSteps } from "@/lib/recipeText";
import { defaultServings, scaleLine, splitTips } from "@/lib/scale";
import { splitTimers, formatClock } from "@/lib/timers";
import { addToShopping } from "@/lib/shopping";
import { readTargets, type Targets } from "@/lib/targets";
import { cookedToday, toggleCookedToday } from "@/lib/cooked";
import { CheckoutButton } from "@/components/CheckoutButton";
import { ActivateTrialButton } from "@/components/ActivateTrialButton";

type Timer = { id: number; label: string; total: number; endsAt: number | null; left: number };

type WakeLock = { release: () => Promise<void> };

export function RecipeSheet({
  recipe,
  onClose,
  isFavorite,
  onToggleFavorite,
  trialOffer,
}: {
  recipe: RecipeCard;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  trialOffer: boolean;
}) {
  const locked = recipe.ingredients === null && recipe.steps === null;
  const [portions, setPortions] = useState(() => defaultServings(recipe.servings, recipe.tags));
  const [gotIng, setGotIng] = useState<Set<number>>(new Set());
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const [cooking, setCooking] = useState(false);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const wake = useRef<WakeLock | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [targets, setTargets] = useState<Targets | null>(null);
  const [cooked, setCooked] = useState(false);
  useEffect(() => {
    setTargets(readTargets());
    setCooked(cookedToday(recipe.id));
  }, [recipe.id]);

  const lines = useMemo(() => {
    const factor = recipe.servings ? portions / recipe.servings : 1;
    return parseIngredients(recipe.ingredients).map((l) => scaleLine(l, factor));
  }, [recipe, portions]);
  const { steps, tips } = useMemo(() => splitTips(parseSteps(recipe.steps)), [recipe]);

  const say = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  }, []);

  // Esc closes; the page behind doesn't scroll while the sheet is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Cooking mode keeps the screen on (where the browser allows it).
  useEffect(() => {
    if (!cooking) return;
    let cancelled = false;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLock> } };
    const acquire = async () => {
      try {
        const lock = await nav.wakeLock?.request("screen");
        if (lock && !cancelled) wake.current = lock;
        else lock?.release();
      } catch {
        // Not supported or refused: cooking mode still works, the screen may dim.
      }
    };
    acquire();
    const onVis = () => document.visibilityState === "visible" && acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      wake.current?.release().catch(() => {});
      wake.current = null;
    };
  }, [cooking]);

  // Timers tick once a second while any is running.
  const running = timers.some((t) => t.endsAt !== null);
  useEffect(() => {
    if (!running) return;
    const iv = window.setInterval(() => {
      setTimers((list) =>
        list.map((t) => {
          if (t.endsAt === null) return t;
          const left = Math.max(0, Math.round((t.endsAt - Date.now()) / 1000));
          if (left === 0 && t.left > 0) ring(t.label);
          return { ...t, left, endsAt: left === 0 ? null : t.endsAt };
        })
      );
    }, 1000);
    return () => window.clearInterval(iv);
  }, [running]);

  function startTimer(seconds: number, label: string) {
    setTimers((list) => [
      ...list,
      { id: Date.now(), label, total: seconds, left: seconds, endsAt: Date.now() + seconds * 1000 },
    ]);
  }

  function toggleTimer(id: number) {
    setTimers((list) =>
      list.map((t) =>
        t.id !== id
          ? t
          : t.endsAt !== null
            ? { ...t, endsAt: null }
            : t.left > 0
              ? { ...t, endsAt: Date.now() + t.left * 1000 }
              : t
      )
    );
  }

  function toggle(set: Set<number>, i: number, update: (s: Set<number>) => void) {
    const next = new Set(set);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    update(next);
  }

  async function share() {
    const url = `${window.location.origin}/recipes?r=${recipe.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      say("Линкът е копиран");
    } catch {
      // Share sheet dismissed: nothing to do.
    }
  }

  function addShopping() {
    addToShopping({
      recipeId: recipe.id,
      title: recipe.title,
      portions,
      lines: lines.map((l) =>
        l.kind === "header" ? { amount: "", text: l.text, group: true } : { amount: l.amount, text: l.text }
      ),
    });
    say("Добавено в списъка за пазаруване");
  }

  const perPortion = recipe.kcal != null;

  return (
    <div
      className="overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={"sheet" + (cooking ? " cooking" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={recipe.title}
        tabIndex={-1}
        ref={sheetRef}
      >
        <div className="sheet-bar">
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Затвори">
            ✕
          </button>
          <div className="sheet-bar-actions">
            <button
              type="button"
              className={"icon-btn" + (isFavorite ? " on" : "")}
              onClick={onToggleFavorite}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? "Махни от любими" : "Добави в любими"}
            >
              {isFavorite ? "♥" : "♡"}
            </button>
            <button type="button" className="icon-btn" onClick={share} aria-label="Сподели рецептата">
              ↗
            </button>
          </div>
        </div>

        {recipe.photoUrl && !cooking && (
          <div className="sheet-photo">
            <Image
              src={recipe.photoUrl}
              alt={recipe.title}
              fill
              sizes="(min-width: 600px) 560px, 100vw"
              fetchPriority="high"
            />
          </div>
        )}

        <h2 className="display">{recipe.title}</h2>
        <div className="meta">
          {recipe.timeMinutes != null && <span>⏱ {recipe.timeMinutes} мин</span>}
          {perPortion && <span>{recipe.kcal} kcal на порция</span>}
        </div>
        {targets && recipe.kcal != null && !locked && (
          <p className="day-share">
            Една порция е <b>{Math.round((recipe.kcal / targets.kcal) * 100)}%</b> от твоите {targets.kcal} kcal
            {recipe.proteinG != null && (
              <>
                {" "}и <b>{Math.round((recipe.proteinG / targets.protein) * 100)}%</b> от протеина за деня
              </>
            )}
            .
          </p>
        )}
        {(recipe.proteinG != null || recipe.carbsG != null || recipe.fatG != null) && (
          <div className="macro-row">
            {recipe.proteinG != null && (
              <div className="macro p">
                <b>{recipe.proteinG} g</b>
                <span>протеин</span>
              </div>
            )}
            {recipe.carbsG != null && (
              <div className="macro">
                <b>{recipe.carbsG} g</b>
                <span>въглехидрати</span>
              </div>
            )}
            {recipe.fatG != null && (
              <div className="macro">
                <b>{recipe.fatG} g</b>
                <span>мазнини</span>
              </div>
            )}
          </div>
        )}

        {locked ? (
          <div className="paywall">
            <div className="lock-big">🔒</div>
            <p>
              Тази рецепта е от новите, които добавям след покупката на книгата.
              С абонамента получаваш всички нови рецепти.
            </p>
            {trialOffer ? (
              <>
                <ActivateTrialButton className="cta">Активирай бонуса безплатно</ActivateTrialButton>
                <p className="paywall-note">
                  Без карта. След бонуса продължаваш за 5,99 € на месец само ако
                  добавиш карта. Рецептите от книгата остават твои.
                </p>
              </>
            ) : (
              <>
                <CheckoutButton kind="subscription" className="cta">
                  Абонамент за 5,99 € на месец
                </CheckoutButton>
                <p className="paywall-note">Спираш по всяко време от „Профил“.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="sheet-actions">
              <button
                type="button"
                className={"chip-btn" + (cooking ? " on" : "")}
                onClick={() => setCooking((c) => !c)}
                aria-pressed={cooking}
              >
                {cooking ? "Спри режим „Готвя“" : "👩‍🍳 Режим „Готвя“"}
              </button>
              <button type="button" className="chip-btn" onClick={addShopping}>
                🛒 В списъка
              </button>
              <button
                type="button"
                className={"chip-btn" + (cooked ? " on" : "")}
                aria-pressed={cooked}
                onClick={() => {
                  const now = toggleCookedToday(recipe.id);
                  setCooked(now);
                  if (now) say("Браво! Отбелязах, че си я сготвил днес 🔥");
                }}
              >
                {cooked ? "✅ Сготвих я днес" : "✅ Сготвих го"}
              </button>
            </div>
            {cooking && (
              <p className="cooking-note">
                Екранът няма да изгасва. Докосни продукт или стъпка, за да я отметнеш,
                а времето в стъпка пуска таймер.
              </p>
            )}

            <div className="portions">
              <span className="portions-label">Порции</span>
              <div className="stepper">
                <button type="button" aria-label="По-малко порции" onClick={() => setPortions((p) => Math.max(1, p - 1))}>
                  −
                </button>
                <output aria-live="polite">{portions}</output>
                <button type="button" aria-label="Повече порции" onClick={() => setPortions((p) => Math.min(40, p + 1))}>
                  +
                </button>
              </div>
              {recipe.servings != null && recipe.servings !== portions && (
                <span className="portions-hint">Рецептата е за {recipe.servings}. Количествата са преизчислени.</span>
              )}
            </div>

            <h4>Продукти</h4>
            <ul className="ingredients">
              {lines.map((it, idx) =>
                it.kind === "header" ? (
                  <li key={idx} className="ing-group">
                    {it.text}
                  </li>
                ) : (
                  <li
                    key={idx}
                    className={gotIng.has(idx) ? "got" : undefined}
                    onClick={() => toggle(gotIng, idx, setGotIng)}
                  >
                    <span className="tick" aria-hidden="true" />
                    {it.amount ? <span className="ing-amount">{it.amount}</span> : null}
                    <span>{it.text}</span>
                  </li>
                )
              )}
            </ul>

            <h4>Начин на приготвяне</h4>
            <ol className="steps">
              {steps.map((st, idx) => (
                <li
                  key={idx}
                  className={doneSteps.has(idx) ? "done" : undefined}
                  onClick={() => toggle(doneSteps, idx, setDoneSteps)}
                >
                  <span className="step-n" aria-hidden="true">
                    {idx + 1}
                  </span>
                  <span className="step-body">
                    {/* One sentence per line: easier to follow on a phone. */}
                    {sentences(st).map((line, k) => (
                      <span key={k} className="step-line">
                        {splitTimers(line).map((part, j) =>
                          "seconds" in part ? (
                            <button
                              key={j}
                              type="button"
                              className="time-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                startTimer(part.seconds, `Стъпка ${idx + 1} · ${part.text}`);
                              }}
                              aria-label={`Пусни таймер ${part.text}`}
                            >
                              ⏱ {part.text}
                            </button>
                          ) : (
                            <span key={j}>{part.text}</span>
                          )
                        )}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ol>

            {tips.length > 0 && (
              <div className="tips">
                <h4>Съвети</h4>
                <ul>
                  {tips.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
            {recipe.videoUrl && /^https?:\/\//i.test(recipe.videoUrl) ? (
              <a className="video-link" href={recipe.videoUrl} target="_blank" rel="noopener noreferrer">
                ▶ Гледай видеото
              </a>
            ) : null}
          </>
        )}

        <button className="close" onClick={onClose}>
          Затвори
        </button>

        {timers.length > 0 && (
          <div className="timers" aria-live="polite">
            {timers.map((t) => (
              <div key={t.id} className={"timer" + (t.left === 0 ? " ring" : "")}>
                <span className="timer-label">{t.label}</span>
                <b className="timer-clock">{t.left === 0 ? "Готово!" : formatClock(t.left)}</b>
                {t.left > 0 && (
                  <button type="button" className="timer-btn" onClick={() => toggleTimer(t.id)}>
                    {t.endsAt !== null ? "Пауза" : "Продължи"}
                  </button>
                )}
                <button
                  type="button"
                  className="timer-btn"
                  aria-label="Махни таймера"
                  onClick={() => setTimers((list) => list.filter((x) => x.id !== t.id))}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

/** Splits a step into sentences ("Свари ориза. Остави го 5 мин." → two lines). */
function sentences(step: string): string[] {
  return step
    .split(/(?<=[.!?])\s+(?=[А-ЯA-Z])/u)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Short beep and vibration when a timer finishes. */
function ring(label: string) {
  try {
    navigator.vibrate?.([300, 150, 300, 150, 300]);
  } catch {}
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.45, 0.9].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.36);
    });
  } catch {}
  if (document.visibilityState !== "visible") {
    const original = document.title;
    document.title = `⏰ ${label}`;
    const restore = () => {
      if (document.visibilityState === "visible") {
        document.title = original;
        document.removeEventListener("visibilitychange", restore);
      }
    };
    document.addEventListener("visibilitychange", restore);
  }
}
