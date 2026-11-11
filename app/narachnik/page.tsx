import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { GuideVideo } from "@/components/GuideVideo";
import { getGuideVideo } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Наръчник — Кухнята на Геша",
  description: "Видео за 1:38: как да използваш книгата — търсене, филтри, калкулатор, менюта, списък за пазаруване и рецептите.",
  robots: { index: false, follow: true },
};

/** "Наръчник": just the how-it-works video, always one tap away in the menu. */
export default async function GuidePage() {
  const video = await getGuideVideo();

  return (
    <>
      <SiteHeader />
      <main className="novi narachnik">
        <section className="novi-head">
          <p className="about-kicker">📖 Наръчник</p>
          <h1 className="display">Как да използваш книгата</h1>
          <p>
            За 1:38 ти показвам всичко: търсене и филтри, калкулатора, менютата, списъка за пазаруване, порциите,
            таймера и любимите.
          </p>
        </section>
        <section className="narachnik-video">
          {video ? (
            <GuideVideo url={video.url} poster={video.poster} where="наръчник" />
          ) : (
            <p className="narachnik-empty">Видеото се качва. Провери отново след малко.</p>
          )}
          <p className="narachnik-help">
            Нещо не ти е ясно? Пиши ми на <a href="mailto:hello@geshapov.com">hello@geshapov.com</a>.
          </p>
          <Link className="btn" href="/recipes">
            Към рецептите
          </Link>
        </section>
      </main>
    </>
  );
}
