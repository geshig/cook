import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAccess, hasBookAccess } from "@/lib/access";
import { getRecipesForViewer } from "@/lib/recipes";
import { MENUS, MENU_LEVELS, type MenuDay } from "@/lib/menus";
import type { RecipeCard } from "@/lib/types";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Примерни дневни менюта — Кухнята на Геша",
  description:
    "Готови дни от високопротеиновите рецепти: около 1500, 2000 и 2500 kcal, с калориите и протеина на всяко хранене.",
};

const norm = (s: string) => s.toLowerCase().replace(/кътидж/g, "котидж").replace(/\s+/g, " ").trim();

function findRecipe(recipes: RecipeCard[], title: string): RecipeCard | undefined {
  const t = norm(title);
  return (
    recipes.find((r) => norm(r.title) === t) ??
    recipes.find((r) => norm(r.title).startsWith(t.slice(0, 24)))
  );
}

function qtyLabel(qty: number, per: string): string | null {
  if (qty === 1) return null;
  return per === "порция" ? `${qty} порции` : `${qty} бр.`;
}

type Row = { meal: string; qty: number; per: string; title: string; recipe?: RecipeCard };

function totals(rows: Row[]) {
  let kcal = 0;
  let protein = 0;
  for (const r of rows) {
    kcal += (r.recipe?.kcal ?? 0) * r.qty;
    protein += (r.recipe?.proteinG ?? 0) * r.qty;
  }
  return { kcal: Math.round(kcal / 10) * 10, protein: Math.round(protein) };
}

function DayCard({ day, recipes }: { day: MenuDay; recipes: RecipeCard[] }) {
  const rows: Row[] = day.items.map((it) => ({ ...it, recipe: findRecipe(recipes, it.title) }));
  const t = totals(rows);
  return (
    <article className="menu-day reveal">
      <header>
        <h3>{day.name}</h3>
        <p>{day.blurb}</p>
        <div className="menu-total">
          <span>{t.kcal} kcal</span>
          <span>{t.protein} g протеин</span>
        </div>
      </header>
      <ul>
        {rows.map((r, i) => {
          const q = qtyLabel(r.qty, r.per);
          const body = (
            <>
              <span className="menu-meal">{r.meal}</span>
              <span className="menu-thumb">
                {r.recipe?.photoUrl && <Image src={r.recipe.photoUrl} alt="" fill sizes="52px" />}
              </span>
              <span className="menu-name">
                {r.recipe?.title ?? r.title}
                {q && <em> · {q}</em>}
              </span>
              {r.recipe?.kcal != null && (
                <span className="menu-kcal">
                  {Math.round(r.recipe.kcal * r.qty)} kcal
                  {r.recipe.proteinG != null && <> · {Math.round(r.recipe.proteinG * r.qty)} g</>}
                </span>
              )}
            </>
          );
          return (
            <li key={i}>
              {r.recipe ? (
                <Link href={`/recipes?r=${r.recipe.id}`} className="menu-row">
                  {body}
                </Link>
              ) : (
                <div className="menu-row">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}

export default async function MenusPage() {
  const access = await getAccess();
  const owner = hasBookAccess(access);
  const recipes = await getRecipesForViewer(access).catch(() => [] as RecipeCard[]);

  return (
    <>
      <SiteHeader />
      <header className="app-header">
        <h1 className="display">Примерни дневни менюта</h1>
        <p>
          Цели дни, сглобени от рецептите в книгата. Калориите и протеинът са
          за един човек. Размествай ястията, както ти е удобно.
        </p>
        <nav className="menu-levels" aria-label="Калории">
          {MENU_LEVELS.map((l) => (
            <a key={l.id} href={`#${l.id}`}>
              {l.label}
            </a>
          ))}
        </nav>
      </header>

      {MENU_LEVELS.map((l) => (
        <section key={l.id} id={l.id} className="menu-level">
          <h2>
            {l.label} <span>{l.hint}</span>
          </h2>
          <div className="menu-grid">
            {MENUS.filter((d) => d.level === l.id).map((d) => (
              <DayCard key={d.name} day={d} recipes={recipes} />
            ))}
          </div>
        </section>
      ))}

      <section className="menu-foot">
        {!owner && (
          <div className="menu-cta">
            <p>Всички ястия от менютата са в книгата, със снимка, продукти и стъпки.</p>
            <Link className="btn" href="/#pricing">
              Купи книгата — 47€
            </Link>
          </div>
        )}
        <p className="menu-note">
          Менютата са примерни и не са хранителен режим. Калориите са
          приблизителни и зависят от продуктите, които ползваш.
        </p>
      </section>
    </>
  );
}
