import { getTestimonials } from "@/lib/testimonials";
import { ReviewsSlider } from "@/components/ReviewsSlider";

/** „Сготвено от вас“: показва се само когато има поне един отзив. */
export async function Testimonials() {
  const items = await getTestimonials();
  if (items.length === 0) return null;
  return (
    <section className="reviews">
      <h2>Сготвено от вас</h2>
      <ReviewsSlider items={items} />
    </section>
  );
}
