"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { RecipeCard } from "@/lib/types";
import { RecipeSheet } from "@/components/RecipeSheet";

type TagGroup = { category: string; names: string[] };

type Quick = { id: string; label: string; test: (r: RecipeCard, fav: Set<number>) => boolean };

const QUICK: Quick[] = [
  { id: "all", label: "Всички", test: () => true },
  { id: "fav", label: "♥ Любими", test: (r, fav) => fav.has(r.id) },
  { id: "chicken", label: "Пиле", test: (r) => r.tags.includes("пиле") },
  { id: "red", label: "Червено месо", test: (r) => r.tags.includes("червено месо") },
  { id: "fish", label: "Риба", test: (r) => r.tags.includes("риба") },
  { id: "veg", label: "Без месо", test: (r) => r.tags.includes("вегетарианско") },
  { id: "prep", label: "Кутии за работа", test: (r) => r.tags.includes("meal prep") },
  { id: "breakfast", label: "Закуска", test: (r) => r.tags.includes("закуска") },
  { id: "dessert", label: "Десерт", test: (r) => r.tags.includes("десерт") },
  { id: "snack", label: "Снакс", test: (r) => r.tags.some((t) => t.startsWith("снак")) },
  { id: "slow", label: "Бавно готвене", test: (r) => r.tags.includes("бавно готвене") },
  { id: "guests", label: "За гости", test: (r) => r.tags.includes("за гости") },
  { id: "five", label: "До 5 продукта", test: (r) => r.tags.includes("само с 5 продукта") },
  { id: "fast", label: "До 30 мин", test: (r) => r.timeMinutes != null && r.timeMinutes <= 30 },
  { id: "protein", label: "40+ g протеин", test: (r) => (r.proteinG ?? 0) >= 40 },
  { id: "light", label: "До 400 kcal", test: (r) => r.kcal != null && r.kcal <= 400 && r.tags.length > 0 },
];

const SORTS = [
  { id: "default", label: "По ред" },
  { id: "protein", label: "Най-много протеин" },
  { id: "kcal", label: "Най-малко калории" },
  { id: "time", label: "Най-бързи" },
  { id: "ratio", label: "Протеин на калория" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

const CATEGORY_LABEL: Record<string, string> = {
  "съставка": "Основна съставка",
  "хранене": "Хранене",
  "десерт": "Десерти",
  "профил": "Хранителен профил",
  "ограничение": "Режим",
  "повод": "Повод",
  "скорост": "Време",
  "метод": "Как се готви",
};

const FAV_KEY = "kuhnyata-favorites-v1";

function norm(s: string) {
  // Both spellings find the same recipes.
  return s.toLowerCase().replace(/ё/g, "е").replace(/кътидж/g, "котидж");
}

export function RecipeApp({
  recipes,
  tagGroups = [],
  trialOffer = false,
  initialFavorites = [],
}: {
  recipes: RecipeCard[];
  tagGroups?: TagGroup[];
  trialOffer?: boolean;
  initialFavorites?: number[];
}) {
  const [query, setQuery] = useState("");
  const [quick, setQuick] = useState("all");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortId>("default");
  const [showFilters, setShowFilters] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [fav, setFav] = useState<Set<number>>(() => new Set(initialFavorites));

  // Local copy of favourites: instant, and works even before the DB table exists.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const local: number[] = raw ? JSON.parse(raw) : [];
      // Merged after hydration on purpose: the server can't see localStorage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (local.length) setFav((f) => new Set([...f, ...local]));
    } catch {}
  }, []);

  const toggleFav = useCallback((id: number) => {
    setFav((prev) => {
      const next = new Set(prev);
      const on = !next.has(id);
      if (on) next.add(id);
      else next.delete(id);
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      } catch {}
      fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: id, on }),
      }).catch(() => {});
      return next;
    });
  }, []);

  // Deep link: /recipes?r=12 opens that recipe; the phone's back button closes it.
  useEffect(() => {
    const fromUrl = () => {
      const r = Number(new URLSearchParams(window.location.search).get("r"));
      setOpenId(Number.isInteger(r) && r > 0 ? r : null);
    };
    fromUrl();
    window.addEventListener("popstate", fromUrl);
    return () => window.removeEventListener("popstate", fromUrl);
  }, []);

  const open = useCallback((id: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("r", String(id));
    url.searchParams.delete("checkout");
    url.searchParams.delete("session_id");
    window.history.pushState({ r: id }, "", url);
    setOpenId(id);
  }, []);

  const close = useCallback(() => {
    if (window.history.state?.r) {
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("r");
      window.history.replaceState(null, "", url);
      setOpenId(null);
    }
  }, []);

  const list = useMemo(() => {
    const q = norm(query.trim());
    const quickTest = QUICK.find((x) => x.id === quick)?.test ?? (() => true);
    const byCategory = new Map<string, string[]>();
    for (const g of tagGroups) {
      const chosen = g.names.filter((n) => picked.has(n));
      if (chosen.length) byCategory.set(g.category, chosen);
    }
    const out = recipes.filter((r) => {
      if (!quickTest(r, fav)) return false;
      // Within a group any tag matches; across groups all must match.
      for (const chosen of byCategory.values()) {
        if (!chosen.some((t) => r.tags.includes(t))) return false;
      }
      if (q) {
        const hay = norm(`${r.title} ${r.tags.join(" ")} ${r.tags.includes("meal prep") ? "кутии работа" : ""} ${r.ingredients ?? ""}`);
        if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    const val = (x: number | null, fallback: number) => (x == null ? fallback : x);
    if (sort === "protein") out.sort((a, b) => val(b.proteinG, -1) - val(a.proteinG, -1));
    if (sort === "kcal") out.sort((a, b) => val(a.kcal, 1e9) - val(b.kcal, 1e9));
    if (sort === "time") out.sort((a, b) => val(a.timeMinutes, 1e9) - val(b.timeMinutes, 1e9));
    if (sort === "ratio")
      out.sort((a, b) => (b.proteinG ?? 0) / (b.kcal || 1e9) - (a.proteinG ?? 0) / (a.kcal || 1e9));
    return out;
  }, [recipes, query, quick, picked, sort, fav, tagGroups]);

  const openRecipe = openId != null ? recipes.find((r) => r.id === openId) ?? null : null;
  const filtersOn = query.trim() !== "" || quick !== "all" || picked.size > 0;

  function togglePick(name: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  /** "What do I cook today?": a random open recipe from the current filters. */
  function surprise() {
    const pool = list.filter((r) => !r.isLocked);
    if (pool.length) open(pool[Math.floor(Math.random() * pool.length)].id);
  }

  function reset() {
    setQuery("");
    setQuick("all");
    setPicked(new Set());
  }

  return (
    <>
      <div className="finder">
        <div className="search">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            id="recipe-search"
            placeholder="Търси или напиши какво имаш: пиле ориз броколи…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Търси рецепта по име или продукт"
            autoComplete="off"
          />
        </div>
        <div className="tagbar" role="group" aria-label="Бързи филтри">
          {/* Hide a chip until at least one recipe has it (e.g. slow cooking). */}
          {QUICK.filter((x) => x.id === "all" || x.id === "fav" || recipes.some((r) => x.test(r, fav))).map((x) => (
            <button
              type="button"
              key={x.id}
              className={"tag" + (quick === x.id ? " active" : "")}
              aria-pressed={quick === x.id}
              onClick={() => setQuick(x.id)}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div className="finder-row">
          <span className="count" aria-live="polite">
            {list.length} {list.length === 1 ? "рецепта" : "рецепти"}
          </span>
          <div className="finder-tools">
            <button
              type="button"
              className="link-btn"
              onClick={surprise}
              disabled={!list.some((r) => !r.isLocked)}
              title="Отваря случайна рецепта от тези, които виждаш"
            >
              🎲 Изненадай ме
            </button>
            {tagGroups.length > 0 && (
              <button
                type="button"
                className={"link-btn" + (picked.size ? " on" : "")}
                onClick={() => setShowFilters((s) => !s)}
                aria-expanded={showFilters}
              >
                Филтри{picked.size ? ` (${picked.size})` : ""}
              </button>
            )}
            <label className="sort">
              <span className="sr-only">Подреди</span>
              <select id="recipe-sort" value={sort} onChange={(e) => setSort(e.target.value as SortId)}>
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {showFilters && (
          <div className="filter-panel">
            {tagGroups.map((g) => (
              <div key={g.category} className="filter-group">
                <div className="filter-title">{CATEGORY_LABEL[g.category] ?? g.category}</div>
                <div className="filter-chips">
                  {g.names.map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={"mini-chip" + (picked.has(n) ? " on" : "")}
                      aria-pressed={picked.has(n)}
                      onClick={() => togglePick(n)}
                    >
                      {n === "meal prep" ? "кутии за работа" : n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="filter-foot">
              <button type="button" className="link-btn" onClick={() => setPicked(new Set())}>
                Изчисти филтрите
              </button>
              <button type="button" className="cta" onClick={() => setShowFilters(false)}>
                Покажи {list.length}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid">
        {list.length === 0 && (
          <div className="empty-state">
            {quick === "fav" && !query && picked.size === 0
              ? "Още нямаш любими. Отвори рецепта и натисни ♡, за да я запазиш тук."
              : "Няма рецепти с тези филтри."}
            {filtersOn && (
              <div>
                <button type="button" className="link-btn" onClick={reset} style={{ marginTop: 10 }}>
                  Покажи всички
                </button>
              </div>
            )}
          </div>
        )}
        {list.map((r, i) => (
          <article
            key={r.id}
            className={"card" + (r.isLocked ? " locked" : "")}
            onClick={() => open(r.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open(r.id);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={r.title}
          >
            {r.isLocked && <div className="lock">🔒</div>}
            <button
              type="button"
              className={"fav-btn" + (fav.has(r.id) ? " on" : "")}
              aria-pressed={fav.has(r.id)}
              aria-label={fav.has(r.id) ? "Махни от любими" : "Добави в любими"}
              onClick={(e) => {
                e.stopPropagation();
                toggleFav(r.id);
              }}
            >
              {fav.has(r.id) ? "♥" : "♡"}
            </button>
            <div className="card-photo">
              {r.photoUrl ? (
                <Image
                  src={r.photoUrl}
                  alt=""
                  fill
                  sizes="(min-width: 960px) 300px, (min-width: 640px) 45vw, 92vw"
                  loading={i < 2 ? "eager" : "lazy"}
                />
              ) : (
                <span>{r.title}</span>
              )}
            </div>
            <h3>{r.title}</h3>
            <div className="meta">
              {r.timeMinutes != null && <span>⏱ {r.timeMinutes} мин</span>}
              {r.kcal != null && <span>{r.kcal} kcal</span>}
              {r.proteinG != null && <span className="p">{r.proteinG} g протеин</span>}
            </div>
          </article>
        ))}
      </div>

      {openRecipe && (
        <RecipeSheet
          key={openRecipe.id}
          recipe={openRecipe}
          onClose={close}
          isFavorite={fav.has(openRecipe.id)}
          onToggleFavorite={() => toggleFav(openRecipe.id)}
          trialOffer={trialOffer}
        />
      )}
    </>
  );
}
