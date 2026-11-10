import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { CoachingForm } from "@/components/CoachingForm";

export const metadata: Metadata = {
  title: "Тренирай с мен — Кухнята на Геша",
  description:
    "Лично водене от Геша: тренировки, които пасват на живота ти, и хранене без глад. Онлайн или на живо в зала. Попълни заявката и си говорим.",
  alternates: { canonical: "/trenirai-s-men" },
};

const GET = [
  ["План, направен за теб", "За вкъщи или за зала, според времето, нивото и целта ти."],
  ["Хранене без глад", "Калории и протеин за твоята цел, с храна, която наистина ти се яде."],
  ["Седмична проверка", "Гледаме заедно напредъка и коригираме плана, когато трябва."],
  ["Връзка с мен", "Питаш, когато се колебаеш, и ти отговарям лично."],
  ["Правилна техника", "Показвам ти как да правиш упражненията безопасно, на живо или по видео."],
];

const FOR = [
  "искаш да свалиш килограми, без да гладуваш и без да се лишаваш от всичко;",
  "нямаш много време и ти трябва ясен план, а не още съвети от интернет;",
  "тепърва започваш или се връщаш след дълга пауза;",
  "искаш да станеш по-силен и да се чувстваш добре в тялото си.",
];

const STEPS = [
  ["Попълваш заявката", "Отнема около 2 минути."],
  ["Говорим си", "Пиша ти до 2 работни дни. Разбираме какво искаш и как ще работим."],
  ["Почваме", "Получаваш плана си и тръгваме заедно."],
];

export default function CoachingPage() {
  return (
    <>
      <SiteHeader />
      <main className="about coach">
        <section className="about-hero">
          <div className="about-copy">
            <p className="about-kicker">Тренирай с мен</p>
            <h1 className="display">
              Да го направим <span>заедно</span>
            </h1>
            <p>
              Лично водене от мен: тренировки, които пасват на живота ти, и
              храна, която ти се яде. Без глад, без крайности и без да се
              чудиш какво да правиш.
            </p>
            <p>Онлайн, от където и да си, или на живо в зала.</p>
            <a href="#zayavka" className="btn btn-cream coach-hero-btn">
              Попълни заявката
            </a>
          </div>
          <div className="about-photo">
            <Image src="/za-men.jpg" alt="Геша и Хоуми" fill priority sizes="(min-width: 900px) 420px, 92vw" />
          </div>
        </section>

        <section className="about-book">
          <h2 className="display">Какво получаваш</h2>
          <ul className="coach-get">
            {GET.map(([t, d]) => (
              <li key={t}>
                <b>{t}</b>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="about-book">
          <h2 className="display">За теб е, ако…</h2>
          <ul className="about-list">
            {FOR.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section className="about-book">
          <h2 className="display">Как става</h2>
          <ol className="coach-steps">
            {STEPS.map(([t, d], i) => (
              <li key={t}>
                <span className="coach-num">{i + 1}</span>
                <div>
                  <b>{t}</b>
                  <p>{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="coach-price">
            <b>Колко струва?</b> Зависи дали е онлайн или на живо и колко често
            тренираш. Казвам ти цената в разговора, без ангажимент.
          </p>
        </section>

        <section className="about-book" id="zayavka">
          <h2 className="display">Заявка за тренировки</h2>
          <p>Отговори на няколко въпроса, за да знам с какво да ти помогна.</p>
          <CoachingForm />
          <p className="coach-disclaimer">
            Ако имаш здравословен проблем, бременна си или се възстановяваш от
            операция, първо се посъветвай с лекар.
          </p>
        </section>
      </main>
    </>
  );
}
