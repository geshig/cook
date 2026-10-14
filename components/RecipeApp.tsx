"use client";

import { useMemo, useState } from "react";
import type { RecipeCard } from "@/lib/types";
import { parseIngredients, parseSteps } from "@/lib/recipeText";
import { defaultServings, scaleLine, splitTips } from "@/lib/scale";
import { CheckoutButton } from "@/components/CheckoutButton";

export function RecipeApp({ recipes, trialOffer = false }: { recipes: RecipeCard[]; trialOffer?: boolean }) {
  const allTags = useMemo(
    () => ["всички", ...Array.from(new Set(recipes.flatMap((r) => r.tags)))],
    [recipes]
  );
  const [active, setActive] = useState("всички");
  const [open, setOpenRecipe] = useState<RecipeCard | null>(null);
  const [portions, setPortions] = useState(1);
  const setOpen = (r: RecipeCard | null) => {
    if (r) setPortions(defaultServings(r.servings, r.tags));
    setOpenRecipe(r);
  };

  const list =
    active === "всички" ? recipes : recipes.filter((r) => r.tags.includes(active));

  return (
    <>
      <div className="tagbar">
        {allTags.map((tag) => (
          <div
            key={tag}
            className={"tag" + (tag === active ? " active" : "")}
            onClick={() => setActive(tag)}
          >
            {tag}
          </div>
        ))}
      </div>

      <div className="grid">
        {list.length === 0 && (
          <div className="empty-state">Няма рецепти с този таг — засега.</div>
        )}
        {list.map((r) => (
          <div
            key={r.id}
            className={"card" + (r.isLocked ? " locked" : "")}
            onClick={() => setOpen(r)}
          >
            {r.isLocked && <div className="lock">🔒</div>}
            <div className="card-photo">
              {r.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.photoUrl} alt={r.title} loading="lazy" />
              ) : (
                <span>{r.title}</span>
              )}
            </div>
            <h3>{r.title}</h3>
            <div className="meta">
              {r.timeMinutes != null && <span>{r.timeMinutes} мин</span>}
              {r.kcal != null && <span>{r.kcal} kcal</span>}
            </div>
            <div className="card-tags">
              {r.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={"overlay" + (open ? " open" : "")} onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(null);
      }}>
        <div className="sheet">
          {open && (open.ingredients === null && open.steps === null ? (
            <>
              <div className="paywall">
                <div className="lock-big">🔒</div>
                <h2>{open.title}</h2>
                <p>
                  Тази рецепта е от новите, които добавяме след покупката на
                  книгата. С абонамента получаваш всички нови рецепти.
                </p>
                {trialOffer ? (
                  <>
                    <CheckoutButton kind="subscription" className="cta">
                      Активирай 3 месеца безплатно
                    </CheckoutButton>
                    <p className="paywall-note">
                      После 5,99 € на месец. Спираш по всяко време от „Профил“.
                      Рецептите от книгата остават твои.
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
              <button className="close" onClick={() => setOpen(null)}>
                Затвори
              </button>
            </>
          ) : (
            <>
              {open.photoUrl && (
                <div className="sheet-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={open.photoUrl} alt={open.title} />
                </div>
              )}
              <h2>{open.title}</h2>
              <div className="meta">
                {open.timeMinutes != null && <span>{open.timeMinutes} мин</span>}
                {open.kcal != null && <span>{open.kcal} kcal на порция</span>}
              </div>
              {(open.proteinG != null || open.carbsG != null || open.fatG != null) && (
                <div className="macros">
                  {open.proteinG != null && <span>Протеин: {open.proteinG}г</span>}
                  {open.carbsG != null && <span>Въглехидрати: {open.carbsG}г</span>}
                  {open.fatG != null && <span>Мазнини: {open.fatG}г</span>}
                </div>
              )}
              <div className="portions">
                <span className="portions-label">Порции</span>
                <div className="stepper">
                  <button
                    type="button"
                    aria-label="По-малко порции"
                    onClick={() => setPortions((p) => Math.max(1, p - 1))}
                  >
                    −
                  </button>
                  <output aria-live="polite">{portions}</output>
                  <button
                    type="button"
                    aria-label="Повече порции"
                    onClick={() => setPortions((p) => Math.min(40, p + 1))}
                  >
                    +
                  </button>
                </div>
                {open.servings != null && open.servings !== portions && (
                  <span className="portions-hint">
                    Рецептата е за {open.servings}. Количествата са преизчислени.
                  </span>
                )}
              </div>
              <h4>Продукти</h4>
              <ul className="ingredients">
                {parseIngredients(open.ingredients).map((line, idx) => {
                  const it = scaleLine(line, open.servings ? portions / open.servings : 1);
                  return it.kind === "header" ? (
                    <li key={idx} className="ing-group">{it.text}</li>
                  ) : (
                    <li key={idx}>
                      {it.amount ? <span className="ing-amount">{it.amount}</span> : null}
                      <span>{it.text}</span>
                    </li>
                  );
                })}
              </ul>
              {(() => {
                const { steps, tips } = splitTips(parseSteps(open.steps));
                return (
                  <>
                    <h4>Начин на приготвяне</h4>
                    <ol>
                      {steps.map((st, idx) => (
                        <li key={idx}>{st}</li>
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
                  </>
                );
              })()}
              {open.videoUrl && (
                <a className="video-link" href={open.videoUrl} target="_blank" rel="noopener noreferrer">
                  ▶ Гледай видеото
                </a>
              )}
              <button className="close" onClick={() => setOpen(null)}>
                Затвори
              </button>
            </>
          ))}
        </div>
      </div>
    </>
  );
}
