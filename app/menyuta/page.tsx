import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAccess, hasBookAccess } from "@/lib/access";
import { getPublicRecipes } from "@/lib/publicRecipes";
import { MENUS, MENU_LEVELS, type MenuDay } from "@/lib/menus";
import { rowsFor, totals, type MiniRecipe } from "@/lib/menuMath";
import { SiteHeader } from "@/components/SiteHeader";
import { MenuRows } from "@/components/MenuRows";
import { MenuGenerator } from "@/components/MenuGenerator";
import { StickyBuy } from "@/components/StickyBuy";

export const metadata: Metadata = {
  title: "Дневни менюта и меню по калории — Кухнята на Геша",
  description:
    "Напиши колко калории искаш и получи цял ден от високопротеинови рецепти. Или избери готов ден за около 1500, 2000 или 2500 kcal.",
};

/** A sample day, folded by default so the page stays short on a phone. */
function DayCard({ day, recipes }: { day: MenuDay; recipes: MiniRecipe[] }) {
  const rows = rowsFor(day.items, recipes);
  const t = totals(rows);
  const pics = rows.filter((r) => r.photoUrl).slice(0, 4);
  return (
    <details className="menu-day">
      <summary>
        <div className="menu-day-top">
          <h3>{day.name}</h3>
          <div className="menu-total">
            <span>{t.kcal} kcal</span>
            <span>{t.protein} g протеин</span>
          </div>
        </div>
        <p>{day.blurb}</p>
        <div className="menu-strip" aria-hidden="true">
          {pics.map((r, i) => (
            <span key={i} className="menu-thumb">
              <Image src={r.photoUrl!} alt="" fill sizes="52px" />
            </span>
          ))}
          <span className="menu-open">Виж деня</span>
        </div>
      </summary>
      <MenuRows rows={rows} />
    </details>
  );
}

export default async function MenusPage() {
  const [access, recipes] = await Promise.all([getAccess(), getPublicRecipes()]);
  const owner = hasBookAccess(access);

  return (
    <>
      <SiteHeader />
      <header className="app-header">
        <h1 className="display">Дневни менюта</h1>
        <p>
          Напиши колко калории искаш и ще ти сглобя цял ден от рецептите в
          книгата. Или избери някой от готовите дни по-долу.
        </p>
      </header>

      <section className="menu-gen-section">
        <MenuGenerator recipes={recipes} />
      </section>

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
            <p>Всички рецепти от менютата са в книгата, със снимка, продукти и стъпки.</p>
            <Link className="btn" href="/#pricing">
              Купи книгата — 47 €
            </Link>
          </div>
        )}
        <p className="menu-note">
          Менютата са примерни и не са хранителен режим. Калориите са
          приблизителни и зависят от продуктите, които ползваш.
        </p>
      </section>

      {!owner && <StickyBuy afterPx={500} />}
    </>
  );
}
