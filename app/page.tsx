import Link from "next/link";
import Image from "next/image";
import { StickyBuy } from "@/components/StickyBuy";
import { Testimonials } from "@/components/Testimonials";
import { CountUp } from "@/components/CountUp";
import { PayBadges } from "@/components/PayBadges";
import { getAccess } from "@/lib/access";
import { getPublicRecipes, type PublicRecipe } from "@/lib/publicRecipes";
import { MenuGenerator } from "@/components/MenuGenerator";
import { IntroVideo } from "@/components/IntroVideo";
import { getIntroVideo } from "@/lib/settings";
import { CheckoutButton } from "@/components/CheckoutButton";
import { SiteHeader } from "@/components/SiteHeader";
import { COMMUNITY, CONTACT_EMAIL, SOCIALS, getSiteUrl } from "@/lib/site";

const PREVIEW_TITLES = [
  "Пиле шаурма",
  "Протеинов кейк в чаша",
  "Купа с хрупкав ориз и сьомга",
  "Протеинова мусака",
  "Пица с пълнена коричка",
  "Протеинови брауни със сладък картоф",
];

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
const FEATURES: { icon: string; title: string; text: string }[] = [
  { icon: "M4 19h16M7 16V9m5 7V5m5 11v-4", title: "Калории и макроси", text: "На всяка порция: калории, протеин, въглехидрати, мазнини." },
  { icon: "M12 5v14M5 12h14", title: "Порциите се смятат сами", text: "За един или за шестима: натискаш + и всичко се преизчислява." },
  { icon: "M12 8v4l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", title: "Режим за готвене", text: "Екранът не заспива, таймерите са в самите стъпки." },
  { icon: "M6 6h15l-1.5 9h-12zM6 6 5 3H2M9 20a1 1 0 1 0 0 .01M18 20a1 1 0 1 0 0 .01", title: "Списък за пазаруване", text: "Продуктите от рецептата влизат в списъка с едно натискане." },
  { icon: "M4 5h16v15H4zM4 10h16M9 3v4M15 3v4", title: "Дневни менюта", text: "Меню по твоите калории и храна в кутии за работа (meal prep)." },
  { icon: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z", title: "Нови рецепти всяка седмица", text: "По 2–4 седмично. Първите 3 месеца са подарък с книгата." },
  { icon: "M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 20v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8", title: "Общност в Skool", text: "Споделяш, питаш и винаги ти отговарям лично." },
  { icon: "M3 6h13v12H3zM16 10l5-3v10l-5-3", title: "Видеа от мен", text: "За хранене, здраве и уелнес, и как да стане навик." },
];

function pickPreview(withPhoto: PublicRecipe[]) {
  const picked = PREVIEW_TITLES.map((t) => withPhoto.find((r) => r.title.startsWith(t))).filter(
    (r): r is PublicRecipe => !!r
  );
  return picked.length >= 4 ? picked : withPhoto.slice(0, 6);
}

export default async function LandingPage() {
  // Photos are decorative — if Supabase is briefly unreachable, the funnel
  // (checkout) must still render and take payments.
  const [access, all, intro] = await Promise.all([
    getAccess(),
    getPublicRecipes().catch((err) => {
      console.error("Failed to load recipe preview:", err);
      return [] as PublicRecipe[];
    }),
    getIntroVideo(),
  ]);
  const withPhoto = all.filter((r) => r.photoUrl);
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
            <p className="hero-kicker">Здравословен готварски рецептурник</p>
            <h1 className="display">
              Вкусно. Бързо.
              <br />
              <span>С макросите.</span>
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
            <p className="hero-lead">
              100+ рецепти със снимка, калории и макроси, плюс дневни менюта,
              общност в Skool, видеа и списък за пазаруване. За всеки, който
              иска да яде вкусно и здравословно, не само за фитнес маниаци.
            </p>
            <div className="hero-actions">
              <CheckoutButton kind="book" className="btn btn-cream" id="hero-cta" source="горе">
                Купи книгата за 47 €
              </CheckoutButton>
              <Link href="/menyuta" className="btn btn-outline-cream">
                Виж дневните менюта
              </Link>
            </div>
            <PayBadges dark />
            <p className="hero-bonus">
              С книгата получаваш и 3 месеца нови рецепти безплатно, по 2–4 всяка седмица.
            </p>
          </div>
        </section>
      </div>

      <section className="stats reveal" aria-label="Книгата в числа">
        <div>
          <b>
            <CountUp to={100} suffix="+" />
          </b>
          <span>рецепти</span>
        </div>
        <div>
          <b>
            <CountUp to={30} suffix=" мин" />
          </b>
          <span>за толкова стават над половината рецепти</span>
        </div>
        <div>
          <b>
            <CountUp to={16} />
          </b>
          <span>за кутии за работа (meal prep)</span>
        </div>
        <div>
          <b>
            <CountUp to={3} suffix=" мес." />
          </b>
          <span>нови рецепти подарък</span>
        </div>
      </section>


      <section className="features reveal">
        <div className="sec-head">
          <h2>Какво получаваш</h2>
          <p>Не е PDF, а кухня в телефона: отваря се в браузъра, без приложение.</p>
        </div>
        <ul className="feature-grid">
          {FEATURES.map((f) => (
            <li key={f.title}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={f.icon} />
              </svg>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </li>
          ))}
        </ul>
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
            <span>Без диети и без да смяташ калории сама: всичко е сметнато.</span>
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
        <p className="inside-note">
          На всяка рецепта: снимка, продукти, стъпки, съвети, време за готвене и
          калории с протеин, въглехидрати и мазнини на порция.
        </p>
      </section>

      <section id="pricing" className="pricing reveal">
        <div className="price-card">
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
            <li>Филтри по съставка, хранене и повод</li>
            <li>В браузъра на телефона и компютъра, без приложение</li>
            <li>Всички рецепти в книгата остават твои завинаги</li>
            <li>Достъп до затворената общност в Skool и видеата ми за здраве и уелнес</li>
            <li>
              <b>Бонус:</b> 3 месеца новите рецепти безплатно, 2–4 нови всяка
              седмица
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
            Имаш книгата? Бонусът ти чака: 3 месеца новите рецепти безплатно.{" "}
            <CheckoutButton kind="subscription" className="upsell-link">
              Активирай бонуса
            </CheckoutButton>
          </div>
        )}
      </section>

      </div>

      <div className="community-band reveal">
        <section className="community">
          <div className="community-copy">
            <h2>Не готвиш сам</h2>
            <p>
              С книгата влизаш в затворената ми общност в Skool. Там хората с
              книгата споделят какво са сготвили, питат за хранене и тренировки и
              си помагат. Аз качвам видеа, в които обяснявам за здраве, хранене и
              уелнес.
            </p>
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
        {all.length > 0 && <MenuGenerator recipes={all} />}
        <Link href="/menyuta" className="gen-more">
          Още готови дни за 1500, 2000 и 2500 kcal
        </Link>
      </section>

      <section id="faq" className="faq reveal">
        <h2>Въпроси</h2>
        {[
          {
            q: "Как получавам достъп?",
            a: "След плащането влизаш с имейла, с който си платил. Пращам ти линк за вход, без парола. Рецептите се отварят в браузъра, без инсталация, и сайтът те помни на това устройство.",
          },
          {
            q: "Подходяща ли е, ако не тренирам?",
            a: "Да. Рецептите са просто вкусна и здравословна храна с повече протеин и по-малко празни калории. Ползват ги и хора, които искат да отслабнат, и такива, които просто искат да ядат по-добре, и семейства.",
          },
          {
            q: "Не ми идва имейлът за вход",
            a: "Обикновено пристига до минута. Провери папките „Спам“ и „Промоции“. Ако го няма, поискай нов линк от „Вход“ и внимавай имейлът да е същият, с който си платил.",
          },
          {
            q: "На телефона и на компютъра ли работи?",
            a: "Да, на всяко устройство. Влизаш с имейла си и рецептите са там. На телефона можеш да добавиш сайта на началния екран и се отваря като приложение.",
          },
          {
            q: "Какво е бонусът от 3 месеца?",
            a: "Всяка седмица добавям 2–4 нови рецепти. С покупката на книгата получаваш автоматично 3 месеца безплатен достъп до тях, без карта. След това продължаваш само ако искаш. Книгата си остава твоя завинаги.",
          },
          {
            q: "Какво е общността в Skool?",
            a: "Затворена група само за хората с книгата, нещо като малка социална мрежа. Споделяте какво сте сготвили, питате за хранене и тренировки, а аз качвам видеа за здраве и уелнес. След покупката влизаш с бутона в профила си. Достъпът не изтича.",
          },
          {
            q: "Мога ли да я подаря или да купя и за приятел?",
            a: "Да. Ако готвите двама, купи „за двама“: 74 € вместо 94 €, спестявате 20 €. Ако вече имаш книгата, в Профил подаряваш втори достъп по същата цена. Получаваш линк, пращаш го и другият влиза със своя имейл, със същите рецепти и бонус.",
          },
          {
            q: "Мога ли да готвя само за себе си?",
            a: "Да. Основните ястия се отварят за 1 порция, а с бутоните + и − сменяш броя и всички количества се преизчисляват.",
          },
          {
            q: "Трябва ли ми кухненска везна?",
            a: "Помага за точни макроси, но не е задължителна. Количествата са в грамове, лъжици и бройки.",
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
          <p>100+ рецепти с макросите, менюта за цялата седмица, общността в Skool и 3 месеца нови рецепти отгоре.</p>
          <CheckoutButton kind="book" className="btn btn-cream" source="край">
            Купи книгата за 47 €
          </CheckoutButton>
        </div>
      </div>

      <StickyBuy />
    </>
  );
}
