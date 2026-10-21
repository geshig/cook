import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { ValueStack } from "@/components/ValueStack";
import { EmailCapture } from "@/components/EmailCapture";
import { StickyBuy } from "@/components/StickyBuy";
import { getLaunchOffer } from "@/lib/launch";
import { getPublicRecipes } from "@/lib/publicRecipes";
import { getAccess, hasBookAccess } from "@/lib/access";
import { IntroVideo } from "@/components/IntroVideo";
import { getIntroVideo } from "@/lib/settings";

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

export default async function ChickenMagnetPage() {
  const [recipes, access] = await Promise.all([getPublicRecipes(), getAccess()]);
  void hasBookAccess(access);
  const months: 3 | 1 = (await getLaunchOffer()).left > 0 ? 3 : 1;
  const intro = await getIntroVideo();
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
            <a href="#oferta" className="magnet-jump">
              📖 Виж и останалите 100+ рецепти ↓
            </a>
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

        <section className="magnet-offer" id="oferta">
          <p className="magnet-bridge">
            Хареса ли ти? <b>Тази рецепта е 1 от 100+ в книгата.</b>
          </p>
          {intro && (
            <div className="magnet-video">
              <IntroVideo url={intro.url} poster={intro.poster} />
            </div>
          )}
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
          <ValueStack bonusMonths={months} source="магнит пиле" title="Вземи всички 100+ рецепти" />
        </section>

        <section className="magnet-capture">
          <EmailCapture source="pile" />
        </section>
      </main>
      <StickyBuy afterPx={900} note="Още 100+ рецепти като тази" />
    </>
  );
}
