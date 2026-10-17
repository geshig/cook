import "server-only";
import { createAdminClient } from "./supabase/admin";

export type Testimonial = {
  id?: number;
  name: string;
  recipe: string;
  text: string;
  /** Пълен URL или път в public/. */
  photo: string;
  /** 1–5, само ако човекът наистина е дал оценка. */
  rating: number | null;
};

/** Първите отзиви от приятели: снимките са в public/otzivi/. */
const BUILT_IN: Testimonial[] = [
  ["Александра", "Бърз миш-маш с яйца и извара", "aleksandra-mish-mash"],
  ["Велизара", "Татзики салата с пилешко", "velizara-tatziki-salata"],
  ["Георги", "Салата с нахут, едамаме и моцарела", "georgi-salata-nahut-edamame"],
  ["Стоян", "Паста с пилешко за кутии за работа", "stoyan-pasta-pile-kutii"],
  ["Симона", "Протеинови брауни", "simona-proteinovi-brauni"],
  ["Никол", "Паста със скариди", "nikol-pasta-skaridi"],
  ["Сияна", "Запеканка за кутии за работа", "siyana-zapekanka-kutii"],
].map(([name, recipe, file]) => ({ name, recipe, text: "", photo: `/otzivi/${file}.jpg`, rating: 5 }));

/** Отзивите от админа (най-новите първи), след тях вградените. */
export async function getTestimonials(): Promise<Testimonial[]> {
  const fromAdmin = await getAdminTestimonials();
  return [...fromAdmin, ...BUILT_IN];
}

async function getAdminTestimonials(): Promise<Testimonial[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data
      .filter((r) => r.photo_url)
      .map((r) => ({
        id: r.id,
        name: r.name,
        recipe: r.recipe ?? "",
        text: r.body ?? "",
        photo: r.photo_url,
        rating: typeof r.rating === "number" && r.rating >= 1 && r.rating <= 5 ? r.rating : 5,
      }));
  } catch {
    return [];
  }
}
