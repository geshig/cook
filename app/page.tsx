import Image from "next/image";
import { StickyBuy } from "@/components/StickyBuy";
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
          "Онлайн готварска книга със 100+ високопротеинови рецепти: снимка, калории и макроси на всяка, порции, които се смятат сами, дневни менюта и общност в Skool.",
        image: [`${site}/opengraph-image.png`],
        brand: { "@id": `${site}/#org` },
        offers: {
          "@type": "Offer",
          price: "47.00",
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
              Вкусно, бързо
              <br />
              <span>и с макросите.</span>
            </h1>
            <p className="lp-lead">
              100+ рецепти с повече протеин за вечери, кутии за работа и
              сладко без угризения. <b>Калориите са сметнати вместо теб.</b>
            </p>
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

      <section className="lp-fix">
        <h2 className="display">Сготвено и сметнато вместо теб</h2>
        <ul>
          <li>
            <span aria-hidden="true">🍽️</span>
            <b>„Какво да сготвя за вечеря?“</b>
            Вечери, които харесват и децата.
          </li>
          <li>
            <span aria-hidden="true">🥡</span>
            <b>„Какво ще ям утре на обяд?“</b>
            Готвиш веднъж, обядът е готов за дни.
          </li>
          <li>
            <span aria-hidden="true">📊</span>
            <b>„Колко протеин изядох?“</b>
            Макросите са на всяка порция.
          </li>
          <li>
            <span aria-hidden="true">🍫</span>
            <b>„Пак ли без сладко?“</b>
            Брауни и бисквити в лека версия.
          </li>
        </ul>
      </section>

      <ProductCard
        bonusMonths={first ? 3 : 1}
        firstBuyers={FIRST_BUYERS}
        ownsBook={access.purchasedBook && !access.hadSubscription}
      />

      <Testimonials />

      <section id="faq" className="faq lp-faq">
        <h2>Въпроси</h2>
        {[
          {
            q: "Подходяща ли е, ако не тренирам?",
            a: "Да. Това е просто вкусна храна с повече протеин и по-малко празни калории. Готвят я хора, които искат да отслабнат, такива, които искат да ядат по-добре, и цели семейства.",
          },
          {
            q: "Трябват ли ми специални продукти?",
            a: "Не. Почти всичко е от всеки супермаркет, а при по-особените продукти пише с какво да ги замениш.",
          },
          {
            q: "Колко време отнема готвенето?",
            a: "Над половината рецепти стават за до 30 минути. С кутиите за работа готвиш веднъж и имаш обяд за няколко дни.",
          },
          {
            q: "Мога ли да готвя само за себе си?",
            a: "Да. Отваряш рецептата за 1 порция и всички количества се преизчисляват сами.",
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

      <StickyBuy afterPx={700} note={first ? `+ 3 месеца нови рецепти за първите ${FIRST_BUYERS}` : "+ 1 месец нови рецепти безплатно"} />
    </>
  );
}
