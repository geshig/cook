import Image from "next/image";
import { TESTIMONIALS } from "@/lib/testimonials";

export function Testimonials() {
  if (TESTIMONIALS.length === 0) return null;
  return (
    <section className="reviews">
      <h2>Сготвено от вас</h2>
      <p className="reviews-sub">Приятели и първи читатели, с техните снимки.</p>
      <div className="reviews-row">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name + t.recipe} className="review">
            <div className="review-photo">
              <Image src={t.photo} alt={`${t.recipe}, сготвено от ${t.name}`} fill sizes="260px" />
            </div>
            <blockquote>„{t.text}“</blockquote>
            <figcaption>
              <b>{t.name}</b> · {t.recipe}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
