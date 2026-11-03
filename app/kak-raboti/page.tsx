import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getGuideVideo } from "@/lib/settings";
import { COMMUNITY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Как работи книгата — Кухнята на Геша",
  description: "Кратко видео и стъпки: как да ползваш рецептите, порциите, менютата, списъка за пазаруване и бонуса.",
  robots: { index: false, follow: true },
};

/**
 * Walkthrough after purchase: Gesha's screen-recorded video on top, then the
 * features one by one, each with a link straight to it.
 */
export default async function HowItWorks() {
  const video = await getGuideVideo();

  const steps: { icon: string; title: string; text: string; href?: string; cta?: string }[] = [
    {
      icon: "🔍",
      title: "Намери рецепта",
      text: "Пиши какво имаш в хладилника („пиле ориз броколи“) или ползвай бързите филтри: пиле, червено месо, до 30 мин, 40+ g протеин, до 400 kcal. „Изненадай ме“ избира вместо теб.",
      href: "/recipes",
      cta: "Към рецептите",
    },
    {
      icon: "⚖️",
      title: "Избери порциите",
      text: "В рецептата натискаш + или − и всички количества се преизчисляват. Калориите и макросите са за една порция.",
    },
    {
      icon: "👨‍🍳",
      title: "Режим „Готвя“",
      text: "Стъпка по стъпка с големи букви, таймери с едно натискане и екранът не загасва, докато готвиш. Отмятай продуктите, докато ги слагаш.",
    },
    {
      icon: "🛒",
      title: "Списък за пазаруване",
      text: "„В списъка“ слага продуктите от рецептата в общ списък, събрани по количество. Отмяташ ги в магазина и го пращаш на някой вкъщи.",
      href: "/spisak",
      cta: "Отвори списъка",
    },
    {
      icon: "📅",
      title: "Меню по твоите калории",
      text: "Пишеш колко калории искаш на ден и получаваш закуска, обяд, вечеря и нещо малко от книгата. Не ти харесва ястие? Сменяш го с едно натискане.",
      href: "/menyuta",
      cta: "Направи меню",
    },
    {
      icon: "🔥",
      title: "Калкулатор за калории",
      text: "Казва ти колко калории и протеин ти трябват за целта ти и за колко седмици стигаш желаното тегло. После с едно натискане правиш меню точно за тях.",
      href: "/kalkulator",
      cta: "Сметни",
    },
    {
      icon: "❤️",
      title: "Любими и „Сготвих го“",
      text: "Със сърцето запазваш рецепта в „Любими“. С „Сготвих го“ отбелязваш какво си готвил и виждаш серията си.",
    },
    {
      icon: "🎁",
      title: "Бонус: нови рецепти всяка седмица",
      text: "Всяка седмица добавям нови рецепти. Активираш бонуса с едно натискане в рецептите и всеки понеделник ти пиша кои са новите.",
      href: "/recipes#bonus",
      cta: "Виж бонуса",
    },
    {
      icon: "📱",
      title: "Като приложение на телефона",
      text: "iPhone (Safari): бутона за споделяне → „Добави към началния екран“. Android (Chrome): ⋮ → „Добави към началния екран“. Сайтът те помни и се отваря с едно докосване.",
    },
  ];

  return (
    <>
      <SiteHeader />
      <main className="guide">
        <section className="guide-hero">
          <p className="about-kicker">Добре дошъл в книгата 🐾</p>
          <h1 className="display">Как работи</h1>
          <p>Две минути, и ще знаеш всичко, което книгата може.</p>
          {video ? (
            <video className="guide-video" src={video.url} poster={video.poster ?? undefined} controls playsInline preload="metadata" />
          ) : null}
        </section>

        <section className="guide-steps">
          <ol>
            {steps.map((s) => (
              <li key={s.title}>
                <span className="guide-ico" aria-hidden="true">
                  {s.icon}
                </span>
                <div>
                  <b>{s.title}</b>
                  <p>{s.text}</p>
                  {s.href && (
                    <Link href={s.href} className="guide-link">
                      {s.cta} →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="guide-end">
          {COMMUNITY.url && (
            <a className="btn btn-ghost" href={COMMUNITY.url} target="_blank" rel="noopener noreferrer">
              Влез в затворената група във Facebook
            </a>
          )}
          <Link className="btn" href="/recipes">
            Към рецептите
          </Link>
          <p>
            Нещо не ти е ясно? Пиши ми на <a href="mailto:hello@geshapov.com">hello@geshapov.com</a>.
          </p>
        </section>
      </main>
    </>
  );
}
