"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RecipeCard } from "@/lib/types";
import { parseIngredients, parseSteps } from "@/lib/recipeText";

export function RecipeApp({ recipes }: { recipes: RecipeCard[] }) {
  const allTags = useMemo(
    () => ["всички", ...Array.from(new Set(recipes.flatMap((r) => r.tags)))],
    [recipes]
  );
  const [active, setActive] = useState("всички");
  const [open, setOpen] = useState<RecipeCard | null>(null);

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
                  Тази рецепта е част от абонамента. Отключи всички заключени
                  рецепти плюс новите, които се добавят всеки месец.
                </p>
                <Link className="cta" href="/#pricing">
                  Виж абонамента
                </Link>
              </div>
              <button className="close" onClick={() => setOpen(null)}>
                Затвори
              </button>
            </>
          ) : (
            <>
              <h2>{open.title}</h2>
              <div className="meta">
                {open.timeMinutes != null && <span>{open.timeMinutes} мин</span>}
                {open.kcal != null && <span>{open.kcal} kcal</span>}
                {open.servings != null && <span>{open.servings} порции</span>}
              </div>
              {(open.proteinG != null || open.carbsG != null || open.fatG != null) && (
                <div className="macros">
                  {open.proteinG != null && <span>Протеин: {open.proteinG}г</span>}
                  {open.carbsG != null && <span>Въглехидрати: {open.carbsG}г</span>}
                  {open.fatG != null && <span>Мазнини: {open.fatG}г</span>}
                </div>
              )}
              <h4>Продукти</h4>
              <ul>
                {parseIngredients(open.ingredients).map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
              <h4>Начин на приготвяне</h4>
              <ol>
                {parseSteps(open.steps).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ol>
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
