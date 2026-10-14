import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { ShoppingList } from "@/components/ShoppingList";

export const metadata: Metadata = { title: "Списък за пазаруване — Кухнята на Геша" };

export default function ShoppingPage() {
  return (
    <>
      <SiteHeader />
      <section className="shop">
        <div className="eyebrow">Списък за пазаруване</div>
        <h1 className="display">Какво да купиш</h1>
        <ShoppingList />
      </section>
    </>
  );
}
