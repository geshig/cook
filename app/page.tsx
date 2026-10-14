import Link from "next/link";
import Image from "next/image";
import { StickyBuy } from "@/components/StickyBuy";
import { getAccess } from "@/lib/access";
import { getRecipesForViewer } from "@/lib/recipes";
import { CheckoutButton } from "@/components/CheckoutButton";
import { SiteHeader } from "@/components/SiteHeader";

const PREVIEW_TITLES = [
  "Пиле шаурма",
  "Протеинов кейк в чаша",
  "Купа с хрупкав ориз и сьомга",
  "Протеинова мусака",
  "Пица с пълнена коричка",
  "Протеинови брауни със сладък картоф",
];

const CATEGORIES: [string, number][] = [
  ["Meal prep кутии за седмицата", 16],
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

export default async function LandingPage() {
  const access = await getAccess();
  // The recipe preview is decorative — if Supabase is briefly unreachable,
  // the funnel (checkout) should still render and take payments.
  const preview = await getRecipesForViewer(access)
    .then((recipes) => {
      const withPhoto = recipes.filter((r) => r.photoUrl);
      const picked = PREVIEW_TITLES.map((t) =>
        withPhoto.find((r) => r.title.startsWith(t))
      ).filter((r): r is NonNullable<typeof r> => !!r);
      return picked.length >= 4 ? picked : withPhoto.slice(0, 6);
    })
    .catch((err) => {
      console.error("Failed to load recipe preview:", err);
      return [];
    });

  return (
    <>
      <SiteHeader />

      <section className="hero">
        <div className="eyebrow">Високопротеинова готварска книга</div>
        <h1 className="display">
          Вкусно. Бързо.
          <br />
          <span>С макросите.</span>
        </h1>
        <p>
          101 високопротеинови рецепти със снимка, калории и макроси на всяка.
          Готвиш за един или за цялата седмица: избираш порциите и
          количествата се преизчисляват сами.
        </p>
        <a href="#pricing" className="btn" id="hero-cta">
          Купи книгата — 47€
        </a>
        <div className="hero-meta">
          <span>101 рецепти</span>
          <span>51 са до 30 мин</span>
          <span>~35 g протеин средно</span>
        </div>
      </section>

      {preview.length > 0 && (
        <section className="preview">
          <h2>Какво ще готвиш</h2>
          <p>Няколко от рецептите. Всяка е снимана така, както ще излезе при теб.</p>
          <div className="pgrid">
            {preview.map((r) => (
              <div key={r.id} className="pcard">
                {r.photoUrl && (
                  <div className="pcard-photo">
                    <Image src={r.photoUrl} alt={r.title} fill sizes="(min-width: 640px) 300px, 46vw" />
                  </div>
                )}
                <h4>{r.title}</h4>
                <div className="meta">
                  {r.kcal != null && `${r.kcal} kcal`}
                  {r.kcal != null && r.proteinG != null && " · "}
                  {r.proteinG != null && `${r.proteinG} g протеин`}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="inside">
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

      <section id="pricing" className="pricing">
        <div className="price-card">
          <div className="tag">Книгата</div>
          <div className="amount">
            47€ <span>еднократно</span>
          </div>
          <ul>
            <li>101 рецепти с калории и макроси на порция</li>
            <li>Снимка на всяка рецепта</li>
            <li>Избираш порциите, количествата се смятат сами</li>
            <li>Филтри по съставка, хранене и повод</li>
            <li>В браузъра на телефона и компютъра, без приложение</li>
            <li>Всички рецепти в книгата остават твои завинаги</li>
            <li>
              <b>Бонус:</b> 3 месеца новите рецепти безплатно
            </li>
          </ul>
          <CheckoutButton kind="book" className="btn">
            Купи сега
          </CheckoutButton>
        </div>
        {access.purchasedBook && !access.hadSubscription && (
          <div className="upsell-note">
            Имаш книгата? Бонусът ти чака: 3 месеца новите рецепти безплатно.{" "}
            <CheckoutButton kind="subscription" className="upsell-link">
              Активирай бонуса →
            </CheckoutButton>
          </div>
        )}
      </section>

      <section className="faq">
        <h2 style={{ fontSize: 26, marginBottom: 10 }}>Въпроси</h2>
        <div className="faq-item">
          <h4>Как получавам достъп?</h4>
          <p>
            След плащането влизаш с имейла, с който си платил. Пращаме ти линк
            за вход, без парола. Рецептите се отварят в браузъра, без
            инсталация, и сайтът те помни на това устройство.
          </p>
        </div>
        <div className="faq-item">
          <h4>Какво е бонусът от 3 месеца?</h4>
          <p>
            Всеки месец добавяме нови рецепти. След покупката на книгата
            активираш с един клик 3 месеца безплатен достъп до тях. Не е
            задължително: книгата си е твоя и без него.
          </p>
        </div>
        <div className="faq-item">
          <h4>Мога ли да готвя само за себе си?</h4>
          <p>
            Да. Основните ястия се отварят за 1 порция, а с бутоните + и −
            сменяш броя и всички количества се преизчисляват.
          </p>
        </div>
        <div className="faq-item">
          <h4>Трябва ли ми кухненска везна?</h4>
          <p>
            Помага за точни макроси, но не е задължителна. Количествата са в
            грамове, лъжици и бройки.
          </p>
        </div>
        <div className="faq-item">
          <h4>Мога ли да върна покупката?</h4>
          <p>
            Достъпът до рецептите започва веднага след плащането, затова
            книгата не се връща. Абонаментът спираш по всяко време от
            „Профил“. Подробности има в{" "}
            <Link href="/usloviya">Условията</Link>.
          </p>
        </div>
        <div className="faq-item">
          <h4>Имам въпрос, който го няма тук</h4>
          <p>Пиши на hello@geshapov.com.</p>
        </div>
      </section>

      <StickyBuy />

      <footer>
        Кухнята на Геша © 2026 · <Link href="/usloviya">Условия</Link> ·{" "}
        <Link href="/poveritelnost">Поверителност</Link>
      </footer>
    </>
  );
}
