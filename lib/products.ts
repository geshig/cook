import "server-only";
import { createAdminClient } from "./supabase/admin";

export type Product = {
  id: number;
  name: string;
  body: string;
  whereToBuy: string;
  link: string;
  photoUrl: string | null;
  sort: number;
};

/** Продуктите от /admin/produkti, по реда, в който са подредени. [] ако таблицата я няма. */
export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("products")
      .select("id, name, body, where_to_buy, link, photo_url, sort")
      .order("sort", { ascending: true })
      .order("id", { ascending: true });
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      body: r.body ?? "",
      whereToBuy: r.where_to_buy ?? "",
      link: r.link ?? "",
      photoUrl: r.photo_url ?? null,
      sort: r.sort ?? 0,
    }));
  } catch {
    return [];
  }
}

/** Only http(s) links are ever rendered, so a typo can't become a javascript: link. */
export function safeLink(url: string): string | null {
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}
