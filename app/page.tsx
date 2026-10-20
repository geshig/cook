import Link from "next/link";
import Image from "next/image";
import { StickyBuy } from "@/components/StickyBuy";
import { ValueStack } from "@/components/ValueStack";
import { Testimonials } from "@/components/Testimonials";
import { PayBadges } from "@/components/PayBadges";
import { getAccess } from "@/lib/access";
import { getPublicRecipes, type PublicRecipe } from "@/lib/publicRecipes";
import { MenuGenerator } from "@/components/MenuGenerator";
import { IntroVideo } from "@/components/IntroVideo";
import { getIntroVideo } from "@/lib/settings";
import { getLaunchOffer, FIRST_BUYERS } from "@/lib/launch";
import { CheckoutButton } from "@/components/CheckoutButton";
import { SiteHeader } from "@/components/SiteHeader";
import { COMMUNITY, CONTACT_EMAIL, SOCIALS, getSiteUrl } from "@/lib/site";

const PREVIEW_TITLES = [
  "Пиле шаурма",
  "Хрупкаво пиле с лимон",
  "Блекнд пиле с броколи",
  "Паста със сьомга",
  "Стек с чимичури",
  "Протеинови брауни със сладък картоф",
];

/** Photos that look the least real stay out of the landing page. */
const NOT_ON_LANDING = /пица|калцоне/i;

const CATEGORIES: [string, number][] = [
  ["Храна в кутии за работа (meal prep)", 16],
  ["Основни с пилешко", 12],
  ["Телешко, свинско и риба", 12],
  ["Салати", 11],
  ["Сосове и мариновки", 10],
  ["Десерти", 8],
  ["Солени закуски", 8],
  ["Гарнитури и снаксове", 6],
  ["Тортили, хлебчета и пици", 5],
  ["Сладки закуски", 5],
  ["Супи", 5],
  ["Вегетариански основни", 3],
];

/** What you get, in the words of someone cooking — each one is a real feature. */
function pickPreview(withPhoto: PublicRecipe[]) {
  const picked = PREVIEW_TITLES.map((t) => withPhoto.find((r) => r.title.startsWith(t))).filter(
    (r): r is PublicRecipe => !!r
  );
  return picked.length >= 4 ? picked : withPhoto.slice(0, 6);
}

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
  const bonusLine = first
    ? `3 месеца нови рецепти безплатно за първите ${FIRST_BUYERS} закупили`
    : "1 месец нови рецепти безплатно";
  const withPhoto = all.filter((r) => r.photoUrl && !NOT_ON_LANDING.test(r.title));
  const preview = pickPreview(withPhoto);
  const previewIds = new Set(preview.map((r) => r.id));
  // Hero columns: photos not already in the preview grid, spread over the book.
  const rest = withPhoto.filter((r) => !previewIds.has(r.id));
  const step = Math.max(1, Math.floor(rest.length / 10));
  const heroPics = rest.filter((_, i) => i % step === 0).slice(0, 10);
  const colA = heroPics.filter((_, i) => i % 2 === 0);
  const colB = heroPics.filter((_, i) => i % 2 === 1);
  const stripPics = rest.slice(-4);

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

      <div className="hero-band">
        <section className={"hero" + (intro ? " has-video" : "")}>
          <div className="hero-copy">
            <h1 className="display">
              Вкусно. Бързо.
              <br />
              <span>С калориите.</span>
            </h1>
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
          <div className="hero-cta">
            <ul className="hero-points">
              <li><b>100+ рецепти</b> с калории, макроси и порции по избор</li>
              <li><b>Дневни менюта</b> и храна в кутии за работа (meal prep)</li>
              <li><b>Общност в Skool</b> и видеа от мен</li>
              <li><b>Калкулатор за калории</b> и списък за пазаруване</li>
            </ul>
            <p className="hero-lead">
              Пица, дюнер, бисквити и още 100+ рецепти с повече протеин и по-малко
              калории. <b>Всичко е сметнато вместо теб.</b>
              <br />
              Не само за фитнес маниаци.
            </p>
          </div>
        </section>
      </div>

      <section className="value-sec" id="vatre">
        <ValueStack bonusMonths={first ? 3 : 1} source="всичко за 47" />
      </section>

      <Testimonials />

      {preview.length > 0 && (
        <section className="preview reveal">
          <div className="sec-head">
            <h2>Какво ще готвиш</h2>
            <p>Няколко от рецептите. Всяка е снимана така, както ще излезе при теб.</p>
          </div>
          <div className="pgrid">
            {preview.map((r) => (
              <Link key={r.id} href={`/recipes?r=${r.id}`} className="pcard">
                <div className="pcard-photo">
                  <Image src={r.photoUrl!} alt={r.title} fill sizes="(min-width: 900px) 300px, 46vw" />
                </div>
                <h4>{r.title}</h4>
                <div className="meta">
                  {r.kcal != null && <span>{r.kcal} kcal</span>}
                  {r.proteinG != null && <span>{r.proteinG} g протеин</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="for-whom reveal">
        <div className="sec-head">
          <h2>Ще ти хареса, ако…</h2>
          <p>Не е книга само за хора, които живеят в залата.</p>
        </div>
        <ul className="for-whom-list">
          <li>
            <b>Искаш просто да се храниш по-здравословно</b>
            <span>Без диети и без да смяташ калории: всичко е сметнато.</span>
          </li>
          <li>
            <b>Искаш да отслабнеш, без храната да е скучна</b>
            <span>Пица, брауни, бургер купи и шаурма, в по-лека версия.</span>
          </li>
          <li>
            <b>Готвиш за семейството</b>
            <span>Порциите се преизчисляват за колкото души искаш, вкусно е за всички.</span>
          </li>
          <li>
            <b>Нямаш време</b>
            <span>Половината рецепти са до 30 минути, а храната в кутии за работа (meal prep) стига за цялата седмица.</span>
          </li>
          <li>
            <b>Тренираш и ти трябва повече протеин</b>
            <span>Средно около 35 g протеин на порция, без протеинови шейкове по цял ден.</span>
          </li>
          <li>
            <b>Всеки ден се чудиш какво да сготвиш</b>
            <span>Готови дневни менюта, меню по твоите калории и бутон „Изненадай ме“.</span>
          </li>
        </ul>
      </section>

      <div className="buy-row">
      <section className="inside reveal">
        <h2>Какво има вътре</h2>
        <ul className="cats">
          {CATEGORIES.map(([name, n]) => (
            <li key={name}>
              <span>{name}</span>
              <b>{n}</b>
            </li>
          ))}
        </ul>
        <div className="inside-note">
          <b>На всяка рецепта:</b>
          <ul>
            <li>снимка, продукти и стъпки</li>
            <li>съвети и време за готвене</li>
            <li>калории, протеин, въглехидрати и мазнини на порция</li>
          </ul>
        </div>
      </section>

      <section id="pricing" className="pricing reveal">
        <div className="price-card">
          <Image className="price-cover" src="/book-cover.png" alt="Книгата „Кухнята на Геша“ с Хоуми на корицата" width={260} height={337} sizes="160px" />
          <div className="tag">Всичко това за</div>
          <div className="amount">
            47 € <span>еднократно</span>
          </div>
          <ul>
            <li>100+ рецепти с калории и макроси на порция</li>
            <li>Снимка на всяка рецепта</li>
            <li>Избираш порциите, количествата се смятат сами</li>
            <li>Примерни дневни менюта и меню по твоите калории</li>
            <li>Режим за готвене с таймери и списък за пазаруване</li>
            <li>Калкулатор: колко калории ти трябват, BMI и за колко време стигаш целта</li>
            <li>Филтри по съставка, хранене и повод</li>
            <li>В браузъра на телефона и компютъра, без приложение</li>
            <li>Всички рецепти в книгата остават твои завинаги</li>
            <li>Достъп до затворената общност в Skool и видеата ми за здраве и уелнес</li>
            <li>
              <b>Бонус:</b> {bonusLine}, по 2–4 нови всяка седмица
            </li>
          </ul>
          <CheckoutButton kind="book" className="btn" source="цена">
            Купи сега
          </CheckoutButton>
          <div className="for-two">
            <div>
              <b>Готвите двама?</b>
              <span>
                <s>94 €</s> <strong>74 € за двама</strong> · спестявате 20 €
              </span>
              <small>Всеки влиза със своя имейл. Вторият получава линк.</small>
            </div>
            <CheckoutButton kind="book" forTwo className="btn btn-ghost" source="за двама">
              Купи за двама
            </CheckoutButton>
          </div>
          <p className="price-help">
            🤝 Нещо не ти се получи? Пиши ми в Skool общността, там винаги
            отговарям, или на hello@geshapov.com. Помагам лично.
          </p>
          <PayBadges />
          <p className="price-pay">Плащането минава защитено през Stripe. Не виждам и не пазя данните на картата ти.</p>
        </div>
        {access.purchasedBook && !access.hadSubscription && (
          <div className="upsell-note">
            Имаш книгата? Бонусът ти чака: новите рецепти безплатно.{" "}
            <Link href="/recipes#bonus" className="upsell-link">
              Вземи го
            </Link>
          </div>
        )}
      </section>

      </div>

      <div className="community-band reveal">
        <section className="community">
          <div className="community-copy">
            <h2>Не готвиш сам</h2>
            <p>
              С книгата влизаш в затворената ми общност в Skool. Хората там
              споделят какво са сготвили и си помагат, а аз качвам видеа за
              здраве, хранене и уелнес.
            </p>
            <div className="community-note">
              <span aria-hidden="true">🤝</span>
              <p>
                <b>Там винаги отговарям лично.</b> Нещо не ти се получава или не
                знаеш с какво да замениш продукт? Питаш и ти помагам.
              </p>
            </div>
          </div>
          <ul className="community-list">
            <li>
              <b>Споделяш какво си сготвил</b>
              <span>Снимки, твои варианти на рецептите и идеи за седмицата.</span>
            </li>
            <li>
              <b>Питаш за хранене и тренировки</b>
              <span>Мен и останалите членове, без да се губиш в коментари в Instagram.</span>
            </li>
            <li>
              <b>Видеа от мен за здраве и уелнес</b>
              <span>Хранене, сън, възстановяване и как да го направиш навик.</span>
            </li>
            <li>
              <b>Само за хората с книгата</b>
              <span>Затворена група: след покупката влизаш с един бутон от профила си.</span>
            </li>
          </ul>
        </section>
      </div>

      <section className="menus-band reveal" id="menu">
        <div className="sec-head">
          <h2>Меню точно по твоите калории</h2>
          <p>
            Напиши колко калории искаш на ден и виж какво ще ядеш: закуска,
            обяд, вечеря и нещо малко, все от рецептите в книгата.
          </p>
        </div>
        {all.length > 0 && <MenuGenerator recipes={all} canShop={access.purchasedBook || access.subscriptionActive} />}
      </section>

      <section className="about-teaser reveal">
        <div className="about-teaser-photo">
          <Image src="/za-men.jpg" alt="Геша и Хоуми с готварски шапки" fill sizes="140px" />
        </div>
        <div>
          <h2 className="display">Кой готви</h2>
          <p>
            Аз съм Геша. Обичам да тренирам, но не искам да ям едно и също
            всеки ден. Затова готвя любимите си ястия с повече протеин, а
            Хоуми, моята овчарка, ги опитва първи.
          </p>
          <Link href="/za-men" className="about-teaser-link">
            Повече за мен и рецептурника →
          </Link>
        </div>
      </section>

      <section id="faq" className="faq reveal">
        <h2>Въпроси</h2>
        {[
          {
            q: "Подходяща ли е, ако не тренирам?",
            a: "Да. Рецептите са просто вкусна и здравословна храна с повече протеин и по-малко празни калории. Ползват ги и хора, които искат да отслабнат, и такива, които просто искат да ядат по-добре, и семейства.",
          },
          {
            q: "Трябват ли ми специални или скъпи продукти?",
            a: "Не. Повечето продукти са от всеки супермаркет. По-особените, като котидж чийз или протеин на прах, ги обяснявам в „Продукти“ и казвам откъде ги купувам, а при рецептите пише с какво да ги замениш.",
          },
          {
            q: "Нямам много време. Колко отнема готвенето?",
            a: "Над половината рецепти стават за до 30 минути. Има и 16 рецепти за храна в кутии за работа (meal prep): готвиш веднъж и имаш обяд за няколко дни.",
          },
          {
            q: "Мога ли да готвя само за себе си?",
            a: "Да. Основните ястия се отварят за 1 порция, а с бутоните + и − сменяш броя и всички количества се преизчисляват.",
          },
          {
            q: "Как получавам достъп?",
            a: "Веднага след плащането влизаш с имейла, с който си платил. Пращам ти линк за вход, без парола. Рецептите се отварят в браузъра, без инсталация, и сайтът те помни на това устройство.",
          },
          {
            q: "На телефона и на компютъра ли работи?",
            a: "Да, на всяко устройство. На телефона можеш да добавиш сайта на началния екран и се отваря като приложение.",
          },
          {
            q: "Какво е калкулаторът за калории?",
            a: "Въвеждаш пол, възраст, ръст, тегло, колко се движиш и каква е целта ти: да отслабнеш, да задържиш или да качиш. Виждаш колко калории и протеин ти трябват на ден и за колко седмици стигаш желаното тегло. После с едно натискане получаваш меню от рецептите точно за тези калории.",
          },
          {
            q: "Какъв е бонусът с новите рецепти?",
            a: `Всяка седмица добавям 2–4 нови рецепти. Първите ${FIRST_BUYERS} закупили получават 3 месеца безплатен достъп до тях, а след това бонусът е 1 месец. Книгата плащаш еднократно. Бонуса го взимаш след покупката с едно натискане в сайта: днес 0 €, а след безплатния период е 5,99 € на месец, ако не го спреш. Спираш го по всяко време от „Профил“ и ти напомням по имейл 7 дни преди първото плащане. Книгата си остава твоя завинаги.`,
          },
          {
            q: "Какво е общността в Skool?",
            a: "Затворена група само за хората с книгата. Споделяте какво сте сготвили, питате за хранене и тренировки, а аз качвам видеа за здраве и уелнес и отговарям лично. След покупката влизаш с бутона в профила си. Достъпът не изтича.",
          },
          {
            q: "Мога ли да я подаря или да купя и за приятел?",
            a: "Да. Ако готвите двама, купи „за двама“: 74 € вместо 94 €, спестявате 20 €. Ако вече имаш книгата, в Профил подаряваш втори достъп по същата цена. Получаваш линк, пращаш го и другият влиза със своя имейл.",
          },
          {
            q: "Трябва ли ми кухненска везна?",
            a: "Помага за точни макроси, но не е задължителна. Количествата са в грамове, лъжици и бройки.",
          },
          {
            q: "Не ми идва имейлът за вход",
            a: "Обикновено пристига до минута. Провери папките „Спам“ и „Промоции“. Ако го няма, поискай нов линк от „Вход“ и внимавай имейлът да е същият, с който си платил.",
          },
        ].map((f) => (
          <details key={f.q} className="faq-item">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
        <details className="faq-item">
          <summary>Мога ли да върна покупката?</summary>
          <p>
            Достъпът до рецептите започва веднага след плащането, затова книгата
            не се връща. Абонаментът спираш по всяко време от „Профил“.
            Подробности има в <Link href="/usloviya">Условията</Link>.
          </p>
        </details>
        <details className="faq-item">
          <summary>Имам въпрос, който го няма тук</summary>
          <p>
            Пиши ми на <a href="mailto:hello@geshapov.com">hello@geshapov.com</a>.
          </p>
        </details>
      </section>

      <div className="final-band reveal">
        <div className="final-strip" aria-hidden="true">
          {stripPics.map((r) => (
            <div key={r.id} className="final-pic">
              <Image src={r.photoUrl!} alt="" fill sizes="25vw" />
            </div>
          ))}
        </div>
        <div className="final-copy">
          <h2>Сготви първата рецепта още тази вечер</h2>
          <p>100+ рецепти с макросите, менюта за цялата седмица, калкулатор за калории, общността в Skool и {first ? "3 месеца" : "1 месец"} нови рецепти отгоре.</p>
          <CheckoutButton kind="book" className="btn btn-cream" source="край">
            Купи книгата за 47 €
          </CheckoutButton>
        </div>
      </div>

      <StickyBuy afterPx={2100} note={first ? `+ 3 месеца нови рецепти за първите ${FIRST_BUYERS}` : "+ 1 месец нови рецепти безплатно"} />
    </>
  );
}
