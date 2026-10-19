import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { CheckoutButton } from "@/components/CheckoutButton";
import { getAccess, hasBookAccess } from "@/lib/access";
import { SOCIALS } from "@/lib/site";

export const metadata: Metadata = {
  title: "За мен — Кухнята на Геша",
  description:
    "Кой стои зад рецептите: Геша, фитнес ентусиаст, който иска да се храни разнообразно и вкусно, и Хоуми, главният дегустатор.",
  alternates: { canonical: "/za-men" },
};

const INSIDE = [
  "100+ рецепти: закуски, обеди, вечери, снакс и десерти",
  "Над половината стават за до 30 минути",
  "16 са кутии за работа (meal prep)",
  "Избираш порциите, количествата се смятат сами",
  "Дневни менюта, калкулатор за калории и списък за пазаруване",
  "Всяка седмица добавям нови рецепти",
];

export default async function AboutPage() {
  const owner = hasBookAccess(await getAccess());
  const instagram = SOCIALS.find((s) => s.id === "instagram");

  return (
    <>
      <SiteHeader />
      <main className="about">
        <section className="about-hero">
          <div className="about-copy">
            <p className="about-kicker">За мен</p>
            <h1 className="display">
              Здравей, аз съм <span>Геша</span>
            </h1>
            <p>
              Обичам да тренирам и да се чувствам добре в тялото си. Но никога
              не съм искал това да значи да ям едно и също всеки ден.
            </p>
            <p>
              Дълго време храната ми беше пиле, ориз и броколи. Работеше, но
              беше скучно и не издържах дълго. Затова започнах да готвя сам:
              любимите си ястия, но с повече протеин и с калориите пред очите ми.
            </p>
            <p>
              Хоуми, моята немска овчарка, е главният дегустатор. Ако нещо мирише
              хубаво, той е първи в кухнята. Затова е и на корицата, с
              готварска шапка.
            </p>
          </div>
          <div className="about-photo">
            <Image src="/za-men.jpg" alt="Геша и Хоуми с готварски шапки в кухнята" fill priority sizes="(min-width: 900px) 420px, 92vw" />
          </div>
        </section>

        <section className="about-book">
          <h2 className="display">За рецептурника</h2>
          <p>
            Събрах в една книга рецептите, които наистина готвя всяка седмица.
            Вкусни, разнообразни и лесни, с калории и макроси на всяка порция.
          </p>
          <ul className="about-list">
            {INSIDE.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p>
            Не е диета и не е само за фитнес маниаци. Това е храна, която ти се
            яде, и с която знаеш какво слагаш в чинията си.
          </p>
          <p className="about-sign">
            Геша
            {instagram && (
              <>
                {" · "}
                <a href={instagram.href} target="_blank" rel="noopener noreferrer">
                  @geshapov
                </a>
              </>
            )}
          </p>
          <div className="about-cta">
            {owner ? (
              <Link href="/recipes" className="btn">
                Към рецептите
              </Link>
            ) : (
              <CheckoutButton kind="book" className="btn" source="за мен">
                Купи книгата за 47 €
              </CheckoutButton>
            )}
            <Link href="/menyuta" className="btn btn-ghost">
              Виж дневните менюта
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
