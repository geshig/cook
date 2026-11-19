import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { EmbeddedBuy } from "@/components/EmbeddedBuy";
import { eur, prices } from "@/lib/price";

export const metadata: Metadata = {
  title: "Плащане — Кухнята на Геша",
  robots: { index: false },
};

/**
 * Payment inside our own page. TikTok's browser refuses to open
 * checkout.stripe.com ("Open this link in your browser"), so for TikTok the
 * buy buttons come here and Stripe Checkout runs embedded on geshapov.com.
 */
export default async function Kupi({ searchParams }: PageProps<"/kupi">) {
  const q = await searchParams;
  const forTwo = q.for === "2";
  const p = prices();
  return (
    <>
      <SiteHeader />
      <section className="kupi">
        <p className="kupi-kicker">Сигурно плащане през Stripe</p>
        <h1 className="kupi-title">
          {forTwo ? "Книгата за двама" : "Кухнята на Геша"} · {eur(forTwo ? p.forTwo : p.book)}
        </h1>
        <EmbeddedBuy forTwo={forTwo} publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? ""} />
      </section>
    </>
  );
}
