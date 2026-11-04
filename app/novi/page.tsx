import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { BonusBanner } from "@/components/BonusBanner";
import { CheckoutButton } from "@/components/CheckoutButton";
import { Price } from "@/components/Price";
import { getAccess } from "@/lib/access";
import { bonusMonthsFor } from "@/lib/launch";
import { getNewRecipes } from "@/lib/newRecipes";

export const metadata: Metadata = {
  title: "Нови рецепти — Кухнята на Геша",
  description: "Всеки месец по 3–4 нови високопротеинови рецепти, подредени по седмици.",
  robots: { index: false, follow: true },
};

/**
 * "Нови рецепти": everything added after the launch, week by week, so the
 * bonus is visible on the site and not only in emails. Locked for people
 * without the bonus, with the offer to claim it right there.
 */
export default async function NewRecipesPage() {
  const access = await getAccess();
  const weeks = await getNewRecipes(access).catch(() => []);
  const total = weeks.reduce((n, w) => n + w.recipes.length, 0);
  const anyLocked = weeks.some((w) => w.recipes.some((r) => !r.open));
  const months: 3 | 1 = access.purchasedBook ? await bonusMonthsFor(access.email) : 3;

  return (
    <>
      <SiteHeader />
      <main className="novi">
        <section className="novi-head">
          <p className="about-kicker">🎁 Бонусът</p>
          <h1 className="display">Нови рецепти</h1>
          <p>
            Всеки месец добавям 3–4 нови рецепти. Тук ги виждаш подредени по седмици.
            {total > 0 && (
              <>
                {" "}
                <b>Досега: {total} нови.</b>
              </>
            )}
          </p>
        </section>

        {anyLocked && (
          <section className="novi-offer">
            {access.purchasedBook ? (
              <BonusBanner trialEndsAt={access.trialEndsAt} months={months} />
            ) : (
              <div className="bonus bonus-claim">
                <div className="bonus-text">
                  <b>🔒 Новите рецепти са за хората с книгата</b>
                  <span>
                    Купи книгата и получаваш {months === 3 ? "3 месеца" : "1 месец"} нови рецепти
                    безплатно, заедно със 100+ рецепти в нея.
                  </span>
                </div>
                <CheckoutButton kind="book" className="btn" source="нови рецепти">
                  Купи книгата за <Price />
                </CheckoutButton>
              </div>
            )}
          </section>
        )}

        {weeks.length === 0 ? (
          <section className="novi-empty">
            <p>Първите нови рецепти идват съвсем скоро. Ще ти пиша, когато излязат. 🐾</p>
          </section>
        ) : (
          weeks.map((w, i) => (
            <section key={w.key} className="novi-week">
              <h2>
                {i === 0 && <span className="novi-new">НОВО</span>}
                {w.label}
              </h2>
              <div className="novi-grid">
                {w.recipes.map((r) =>
                  r.open ? (
                    <Link key={r.id} href={`/recipes?r=${r.id}`} className="novi-card">
                      <Thumb r={r} />
                    </Link>
                  ) : (
                    <a key={r.id} href="#bonus" className="novi-card locked">
                      <Thumb r={r} />
                    </a>
                  )
                )}
              </div>
            </section>
          ))
        )}
      </main>
    </>
  );
}

function Thumb({ r }: { r: { title: string; photoUrl: string | null; kcal: number | null; proteinG: number | null; open: boolean } }) {
  return (
    <>
      <div className="novi-photo">
        {r.photoUrl && <Image src={r.photoUrl} alt={r.open ? r.title : ""} fill sizes="(min-width: 900px) 280px, 46vw" />}
        {!r.open && <span className="novi-lock">🔒 Отключи с бонуса</span>}
      </div>
      <h3>{r.title}</h3>
      <p>
        {r.kcal != null && <span>{r.kcal} kcal</span>}
        {r.proteinG != null && <span>{r.proteinG} g протеин</span>}
      </p>
    </>
  );
}
