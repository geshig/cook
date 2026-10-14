import "server-only";
import { createAdminClient } from "./supabase/admin";

export type Testimonial = {
  id?: number;
  name: string;
  recipe: string;
  text: string;
  /** Пълен URL или път в public/. */
  photo: string;
};

/** Отзиви, добавени в /admin/otzivi. Празен списък, ако таблицата я няма. */
export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("testimonials")
      .select("id, name, recipe, body, photo_url")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data
      .filter((r) => r.photo_url)
      .map((r) => ({ id: r.id, name: r.name, recipe: r.recipe ?? "", text: r.body, photo: r.photo_url }));
  } catch {
    return [];
  }
}
