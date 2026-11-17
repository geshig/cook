import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { CoachingForm } from "@/components/CoachingForm";
import { COACHING } from "@/lib/coaching";
import { spotsLeft } from "@/lib/coachingDb";

export const metadata: Metadata = {
  title: "Онлайн коучинг с Геша — само 10 места",
  description:
    "Личен план за хранене и тренировки, проверка всяка седмица и пишеш директно на Геша. Старт 1 декември, само 10 места.",
};

const GET: [string, string, string][] = [
  ["🎯", "Твоите калории и протеин", "Смятам ги аз, за теб: по теглото, движението и целта ти. Не от общ калкулатор."],
  ["🍽️", "Меню всяка седмица", "От рецептите в книгата, само с храни, които обичаш. Пица, кюфтета и десерти също."],
  ["🏋️", "Тренировки 3 пъти седмично", "Вкъщи или във фитнес, с видео за всяко упражнение. По 30–45 минути."],
  ["📊", "Проверка всяка неделя", "Пращаш ми теглото и как мина седмицата. В понеделник оправям плана."],
  ["💬", "Пишеш директно на мен", "Във Viber, WhatsApp или Telegram. Отговарям лично, не бот."],
  ["📖", "Книгата е включена", "100+ рецепти, калкулатор и списък за магазина. Остава твоя завинаги."],
];

const FOR: string[] = [
  "Диетите не ти се получават или килограмите се връщат",
  "Искаш някой да ти каже точно какво да ядеш и колко",
  "Нямаш време за сложни рецепти и по 2 часа фитнес",
  "Искаш да стегнеш тялото или да качиш мускули",
];
const NOT_FOR: string[] = [
  "Търсиш чудо за 2 седмици",
  "Не искаш да отделиш 5 минути в неделя за проверката",
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Трябва ли да ходя на фитнес?",
    a: "Не. Правим тренировки вкъщи, без уреди или с дъмбели. Ако ходиш на фитнес, планът е за там. Може и само хранене.",
  },
  {
    q: "Ще гладувам ли?",
    a: "Не. Ядеш нормални порции с повече протеин, който засища. Менюто е от любими ястия в по-лека версия, не салата и пилешко гърди всеки ден.",
  },
  {
    q: "Колко време ми отнема?",
    a: "Готвиш както обикновено, 3 тренировки по 30–45 минути седмично и 5 минути в неделя за проверката.",
  },
  {
    q: "Ако имам здравословен проблем?",
    a: "Отбележи го във формата. При бременност, кърмене, диабет, проблем със сърцето или хранително разстройство ще те помоля първо за „да“ от лекар. Коучингът не е лечение.",
  },
  {
    q: "Как спирам месечния план?",
    a: "Пишеш ми преди следващото плащане и го спирам. Планът за 3 месеца се плаща веднъж и не се подновява.",
  },
  {
    q: "Ами ако местата свършат?",
    a: "Попълни формата пак: записвам те и пиша първо на теб, когато се освободи място.",
  },
];

const eur = (cents: number) => `${(cents / 100).toFixed(0)} €`;

export default async function Coaching({ searchParams }: PageProps<"/treniray">) {
  const q = await searchParams;
  const left = await spotsLeft();
  const full = left <= 0;
  const perMonth = Math.round(COACHING.three / 3);
  const save = COACHING.month * 3 - COACHING.three;

  const notice =
    q.paid === "1"
      ? "🎉 Плащането мина! Провери имейла си: там са първите стъпки. Ще ти пиша до 48 часа."
      : q.full === "1"
        ? "Местата току-що свършиха 😔 Пиши ми на hello@geshapov.com и ще те запиша първо теб."
        : q.link === "bad"
          ? "Линкът за плащане не важи. Пиши ми на hello@geshapov.com и ще ти пратя нов."
          : q.link === "error"
            ? "Плащането не можа да започне. Опитай пак след минута или ми пиши на hello@geshapov.com."
            : null;

  return (
    <>
      <SiteHeader />
      <div className="tr-page">
        {notice && <p className="tr-notice">{notice}</p>}

        <section className="tr-hero">
          <p className="tr-kicker">Онлайн коучинг · старт {COACHING.start}</p>
          <h1 className="display">Отслабни или качи мускули. С храна, която обичаш.</h1>
          <p className="tr-lead">
            Личен план за хранене и тренировки, проверка всяка седмица и пишеш
            директно на мен. Вземам само {COACHING.spots} души, за да имам време
            за всеки.
          </p>
          <div className="tr-spots" aria-label={`Остават ${left} от ${COACHING.spots} места`}>
            <div className="tr-dots">
              {Array.from({ length: COACHING.spots }, (_, i) => (
                <span key={i} className={i < COACHING.spots - left ? "taken" : ""} />
              ))}
            </div>
            <b>{full ? "Местата свършиха" : `Остават ${left} от ${COACHING.spots} места`}</b>
          </div>
          <a href="#forma" className="btn btn-cream tr-cta">
            {full ? "Запиши се за следващия път" : "Кандидатствай"}
          </a>
          <p className="tr-small">Плащаш чак след като те одобря.</p>
        </section>

        <section className="tr-get">
          <h2 className="display">Какво получаваш</h2>
          <ul>
            {GET.map(([icon, head, text]) => (
              <li key={head}>
                <span aria-hidden="true">{icon}</span>
                <div>
                  <b>{head}</b>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="tr-fit">
          <div className="tr-yes">
            <h3>За теб е, ако</h3>
            <ul>
              {FOR.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="tr-no">
            <h3>Не е за теб, ако</h3>
            <ul>
              {NOT_FOR.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lp-how tr-how">
          <h2 className="display">Как започваме</h2>
          <ol>
            <li>
              <span aria-hidden="true">1</span>
              <div>
                <b>Попълваш формата</b>
                3 минути: целта ти, как се храниш и движиш.
              </div>
            </li>
            <li>
              <span aria-hidden="true">2</span>
              <div>
                <b>Пиша ти до 48 часа</b>
                Ако сме подходящи, получаваш линк за плащане.
              </div>
            </li>
            <li>
              <span aria-hidden="true">3</span>
              <div>
                <b>Тръгваме на {COACHING.start}</b>
                Получаваш плана, първото меню и тренировките.
              </div>
            </li>
          </ol>
        </section>

        <section className="tr-prices" id="ceni">
          <h2 className="display">Цена</h2>
          <div className="tr-plans">
            <div className="tr-plan best">
              <span className="tr-badge">Най-изгодно</span>
              <h3>3 месеца</h3>
              <p className="tr-amount">
                <b>{eur(COACHING.three)}</b>
              </p>
              <p className="tr-per">
                {eur(perMonth)} на месец · спестяваш {eur(save)}
              </p>
              <p className="tr-note">3 месеца стигат за видим резултат и нов навик. Плащаш веднъж.</p>
            </div>
            <div className="tr-plan">
              <h3>Месечно</h3>
              <p className="tr-amount">
                <b>{eur(COACHING.month)}</b> <span>/ месец</span>
              </p>
              <p className="tr-note">Спираш, когато поискаш, с едно съобщение.</p>
            </div>
          </div>
          <p className="tr-small dark">
            И в двата: всичко от „Какво получаваш“ и книгата. Плащаш чак след
            като те одобря: карта, Apple Pay или Google Pay.
          </p>
        </section>

        <section className="tr-form-wrap" id="forma">
          <h2 className="display">{full ? "Запиши се за следващия път" : "Кандидатствай"}</h2>
          <p className="tr-form-sub">
            {full
              ? "Местата свършиха. Попълни формата и ще пиша първо на теб, когато се освободи място."
              : "Отнема 3 минути. Чета всяка форма лично и ти пиша до 48 часа."}
          </p>
          <CoachingForm />
        </section>

        <section className="faq lp-faq">
          <h2>Въпроси</h2>
          {FAQ.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      </div>
    </>
  );
}
