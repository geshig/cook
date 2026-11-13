import Image from "next/image";
import { Price } from "@/components/Price";
import { prices } from "@/lib/price";
import { StickyBuy } from "@/components/StickyBuy";
import { ChatWidget } from "@/components/ChatWidget";
import { ProductCard } from "@/components/ProductCard";
import { Testimonials } from "@/components/Testimonials";
import { getAccess } from "@/lib/access";
import { getPublicRecipes, type PublicRecipe } from "@/lib/publicRecipes";
import { IntroVideo } from "@/components/IntroVideo";
import { getIntroVideo } from "@/lib/settings";
import { getLaunchOffer, FIRST_BUYERS } from "@/lib/launch";
import { SiteHeader } from "@/components/SiteHeader";
import { COMMUNITY, CONTACT_EMAIL, SOCIALS, getSiteUrl } from "@/lib/site";

/** Photos that look the least real stay out of the landing page. */
const NOT_ON_LANDING = /пица|калцоне/i;

export default async function LandingPage() {
  // Photos are decorative — if Supabase is briefly unreachable, the funnel
  // (checkout) must still render and take payments.
  const [access, all, intro, offer] = await Promise.all([
    getAccess(),
    getPublicRecipes().catch((err) => {
      console.error("Failed to load recipe preview:", err);
      return [] as PublicRecipe[];
    }),
    getIntroVideo(),
    getLaunchOffer(),
  ]);
  // Real counter: first 100 paying buyers get 3 months, then 1 month.
  const first = offer.left > 0;
  const withPhoto = all.filter((r) => r.photoUrl && !NOT_ON_LANDING.test(r.title));
  // Hero columns (only when there is no intro video): photos spread over the book.
  const rest = withPhoto;
  const step = Math.max(1, Math.floor(rest.length / 10));
  const heroPics = rest.filter((_, i) => i % step === 0).slice(0, 10);
  const colA = heroPics.filter((_, i) => i % 2 === 0);
  const colB = heroPics.filter((_, i) => i % 2 === 1);

  const site = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site}/#org`,
        name: "Кухнята на Геша",
        url: site,
        logo: `${site}/icon-512.png`,
        email: CONTACT_EMAIL,
        sameAs: [...SOCIALS.filter((s) => s.href).map((s) => s.href), ...(COMMUNITY.url ? [COMMUNITY.url] : [])],
      },
      {
        "@type": "WebSite",
        "@id": `${site}/#website`,
        url: site,
        name: "Кухнята на Геша",
        inLanguage: "bg",
        publisher: { "@id": `${site}/#org` },
      },
      {
        "@type": "Product",
        name: "Кухнята на Геша — 100+ високопротеинови рецепти",
        description:
          "Онлайн готварска книга със 100+ високопротеинови рецепти: снимка, калории и макроси на всяка, порции, които се смятат сами, дневни менюта и затворена група във Facebook.",
        image: [`${site}/opengraph-image.png`],
        brand: { "@id": `${site}/#org` },
        offers: {
          "@type": "Offer",
          price: (prices().book / 100).toFixed(2),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `${site}/#pricing`,
          seller: { "@id": `${site}/#org` },
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />
      <div className="lp-page">

      <div className="hero-band">
        <section className={"hero lp-hero" + (intro ? " has-video" : "")}>
          <div className="hero-copy">
            <h1 className="display">
              Вкусно, здравословно
              <br />
              <span>и за всеки.</span>
            </h1>
            <p className="lp-lead">
              100+ здравословни рецепти, с които и отслабваш. Лесни и в
              телефона ти. <b>Не броиш калории, само готвиш.</b>
            </p>
            <ul className="lp-points">
              <li><b>Здравословно и вкусно:</b> дори пица, дюнер и брауни в лека версия</li>
              <li><b>Помага да отслабнеш:</b> меню за всяка седмица според целта ти (може и за качване)</li>
              <li><b>За всеки:</b> стъпка по стъпка, с продукти от всеки магазин</li>
              <li><b>Удобно:</b> в телефона ти, а количествата и списъкът се правят сами</li>
            </ul>
            <div className="lp-hero-cta">
              <a href="#pricing" className="btn btn-cream">Виж какво получаваш</a>
              <span><Price /> еднократно · достъп веднага</span>
            </div>
          </div>
          {intro ? (
            <IntroVideo url={intro.url} poster={intro.poster} />
          ) : (
            colA.length >= 3 && (
              <div className="hero-media" aria-hidden="true">
                {[colA, colB].map((col, ci) => (
                  <div key={ci} className={"hero-col" + (ci ? " rev" : "")}>
                    <div className="hero-track">
                      {[...col, ...col].map((r, i) => (
                        <div key={i} className="hero-pic">
                          <Image
                            src={r.photoUrl!}
                            alt=""
                            fill
                            sizes="(min-width: 900px) 240px, 150px"
                            loading={i < 2 ? "eager" : "lazy"}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </section>
      </div>


      <ProductCard
        bonusMonths={first ? 3 : 1}
        firstBuyers={FIRST_BUYERS}
        ownsBook={access.purchasedBook && !access.hadSubscription}
      />

      <section className="lp-how">
        <h2 className="display">Как работи</h2>
        <ol>
          <li>
            <span aria-hidden="true">1</span>
            <div>
              <b>Купуваш веднъж</b>
              Плащаш с карта или Apple Pay. Без абонамент.
            </div>
          </li>
          <li>
            <span aria-hidden="true">2</span>
            <div>
              <b>Получаваш имейл</b>
              Влизаш веднага с имейла си, без парола.
            </div>
          </li>
          <li>
            <span aria-hidden="true">3</span>
            <div>
              <b>Готвиш от телефона</b>
              Избираш рецепта и следваш стъпките. Всичко е сметнато.
            </div>
          </li>
        </ol>
        <p className="lp-how-note">
          📱 Не е хартиена книга и не е PDF. Отваря се като приложение на
          телефона и компютъра.
        </p>
      </section>

      <Testimonials />

      <section id="faq" className="faq lp-faq">
        <h2>Въпроси</h2>
        {[
          {
            q: "Хартиена книга ли е?",
            a: "Не. Онлайн е: отваряш я от телефона или компютъра, като приложение. Получаваш я веднага след плащането, на имейла си.",
          },
          {
            q: "Става ли, ако тепърва започвам?",
            a: "Да. Всяка рецепта има снимка, продукти от всеки магазин (Lidl, Kaufland, Billa) и стъпки едно по едно. Над половината стават за до 30 минути, а калориите са сметнати вместо теб.",
          },
          {
            q: "Трябва ли да ходя на фитнес?",
            a: "Не. Това е просто вкусна домашна храна с по-малко калории и повече протеин. Готвят я хора, които искат да отслабнат, да ядат по-здравословно, и цели семейства.",
          },
          {
            q: "А ако искам да кача килограми?",
            a: "И това става. Книгата е направена основно за отслабване, но калкулаторът има и цел „да кача“: казва ти колко калории ти трябват и с едно натискане прави меню за тях. А протеинът във всяка рецепта помага за мускулите и докато отслабваш.",
          },
          {
            q: "Мога ли да готвя за цялото семейство?",
            a: "Да. Избираш за колко души готвиш и всички количества се сменят сами. Става и само за теб.",
          },
          {
            q: "Мога ли да върна покупката?",
            a: "Достъпът започва веднага след плащането, затова книгата не се връща. Бонус абонамента спираш по всяко време от „Профил“. Други въпроси: hello@geshapov.com.",
          },
        ].map((f) => (
          <details key={f.q} className="faq-item">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>

      </div>

      {process.env.ANTHROPIC_API_KEY && <ChatWidget />}
      <StickyBuy afterPx={700} note={first ? `+ 3 месеца нови рецепти за първите ${FIRST_BUYERS}` : "+ 1 месец нови рецепти безплатно"} />
    </>
  );
}
