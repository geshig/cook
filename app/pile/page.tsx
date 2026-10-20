import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { CheckoutButton } from "@/components/CheckoutButton";
import { PayBadges } from "@/components/PayBadges";
import { getPublicRecipes } from "@/lib/publicRecipes";
import { getAccess, hasBookAccess } from "@/lib/access";

/**
 * Free recipe from the book, sent through ManyChat ("сочно пиле"). Shows the
 * full recipe exactly as in the book (№64), then the book right under it.
 */
export const metadata: Metadata = {
  title: "Мариновка за сочно пиле с портокал и соев сос — Кухнята на Геша",
  description: "Безплатна рецепта от „Кухнята на Геша“: мариновка за ~800 g пилешко за 5 минути.",
  robots: { index: false, follow: true },
};

const INGREDIENTS: [string, string, string?][] = [
  ["80 ml", "портокалов сок", "от 1 портокал, плюс настъргана кора"],
  ["3 с.л.", "соев сос"],
  ["1 с.л.", "мед"],
  ["3 скилидки", "чесън", "смачкан"],
  ["1 ч.л.", "пресен джинджифил", "настърган, или ½ ч.л. на прах"],
  ["1 с.л.", "олио или зехтин"],
  ["½ ч.л.", "черен пипер"],
  ["щипка", "люти люспи", "по желание"],
];

const STEPS = [
  "Разбъркай всичко и омеси с ~800 g пилешко.",
  "Остави пилето да се маринова в хладилника от 10 минути до 4 часа.",
  "Най-добре става в тиган: нарязано на кубчета, на силен огън за 5–6 минути.",
  "Може и в air fryer на 200°C: гърди на кубчета 10–12 минути, бутчета 16–20 минути. Във фурна на 200°C: 15–18 минути за гърди, 25–30 минути за бутчета.",
  "За глазура прецеди остатъка от мариновката, свари го 2 минути и намажи готовото пиле.",
];

const INSIDE = [
  "100+ рецепти с калории и макроси на всяка порция",
  "Над половината стават за до 30 минути",
  "Избираш порциите, количествата се смятат сами",
  "Дневни менюта, калкулатор за калории и списък за пазаруване",
];

export default async function ChickenMagnetPage() {
  const [recipes, access] = await Promise.all([getPublicRecipes(), getAccess()]);
  // Logged-in or not, the page always ends with the book offer.
  void hasBookAccess(access);
  const chicken = recipes
    .filter((r) => r.photoUrl && /пиле|пилешк/i.test(r.title) && !/мариновка/i.test(r.title))
    .slice(0, 4);

  return (
    <>
      <SiteHeader />
      <main className="magnet">
        <section className="magnet-hero">
          <div className="magnet-copy">
            <p className="about-kicker">Безплатна рецепта от книгата</p>
            <h1 className="display">
              Мариновка за <span>сочно пиле</span> с портокал и соев сос
            </h1>
            <ul className="magnet-meta">
              <li>⏱ 5 минути</li>
              <li>🍗 за ~800 g пилешко</li>
              <li>4 порции</li>
            </ul>
            <p>
              Това е рецепта №64 от „Кухнята на Геша“, точно както е в книгата. Сладко, солено и леко пикантно,
              а пилето остава сочно и в air fryer, и във фурна.
            </p>
          </div>
          <div className="magnet-photo">
            <Image src="/recipes/pile-portokal-real.jpg" alt="Пиле с портокалова и соева мариновка в тигана" fill priority sizes="(min-width: 900px) 420px, 92vw" />
          </div>
        </section>

        <section className="magnet-recipe">
          <h2 className="display">Продукти</h2>
          <ul className="magnet-ing">
            {INGREDIENTS.map(([amount, name, note]) => (
              <li key={name}>
                <b>{amount}</b>
                <span>
                  {name}
                  {note && <small>{note}</small>}
                </span>
              </li>
            ))}
          </ul>

          <h2 className="display">Как се прави</h2>
          <ol className="magnet-steps">
            {STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="magnet-tip">💡 Соевият сос е солен, затова не соли месото.</p>
        </section>

        <section className="magnet-cta">
          {(
            <>
              <p className="about-kicker">Хареса ли ти?</p>
              <h2 className="display">Това е 1 от 100+ рецепти в книгата</h2>
              <ul className="about-list">
                {INSIDE.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              {chicken.length > 0 && (
                <div className="magnet-more" aria-label="Още рецепти с пиле от книгата">
                  {chicken.map((r) => (
                    <figure key={r.id}>
                      <div>
                        <Image src={r.photoUrl!} alt="" fill sizes="(min-width: 900px) 160px, 45vw" />
                      </div>
                      <figcaption>{r.title}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
              <div className="magnet-buy">
                <CheckoutButton kind="book" className="btn" source="магнит пиле">
                  Вземи книгата за 47 €
                </CheckoutButton>
                <Link href="/" className="btn btn-ghost">
                  Виж какво има вътре
                </Link>
              </div>
              <p className="magnet-small">Еднократно плащане. Влизаш веднага с имейла си.</p>
              <PayBadges />
            </>
          )}
        </section>
      </main>
    </>
  );
}
