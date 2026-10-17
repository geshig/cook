import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";
import Image from "next/image";
import { getProducts, safeLink } from "@/lib/products";
import { getAccess, hasBookAccess } from "@/lib/access";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Продуктите, с които готвя — Кухнята на Геша",
  description:
    "Котидж чийз, протеин на прах, еритритол и другите по-особени продукти от рецептите: какво са, за какво ги ползвам и откъде ги купувам.",
};

export default async function ProductsPage() {
  const [items, access] = await Promise.all([getProducts(), getAccess()]);
  const owner = hasBookAccess(access);

  return (
    <>
      <SiteHeader />
      <header className="app-header">
        <h1 className="display">Продуктите, с които готвя</h1>
        <p>
          Повечето неща в рецептите са от всеки супермаркет. Тук са
          по-особените: какво са, за какво ги ползвам и откъде ги купувам.
        </p>
      </header>

      <section className="products">
        {items.length === 0 ? (
          <p className="products-empty">Скоро ще добавя продуктите тук.</p>
        ) : (
          <div className="products-grid">
            {items.map((p) => {
              const href = p.link ? safeLink(p.link) : null;
              return (
                <article key={p.id} className="product reveal">
                  {p.photoUrl && (
                    <div className="product-photo">
                      <Image src={p.photoUrl} alt={p.name} fill sizes="(min-width: 760px) 300px, 100vw" />
                    </div>
                  )}
                  <h3>{p.name}</h3>
                  {p.body && <p>{p.body}</p>}
                  {(p.whereToBuy || href) && (
                    <div className="product-where">
                      <span>Къде купувам</span>
                      {p.whereToBuy && <b>{p.whereToBuy}</b>}
                      {href && (
                        <a href={href} target="_blank" rel="noopener noreferrer nofollow">
                          Виж продукта →
                        </a>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
        {!owner && (
          <div className="menu-cta" style={{ textAlign: "center", marginTop: 36 }}>
            <p>Всички рецепти с тези продукти са в книгата.</p>
            <CheckoutButton kind="book" className="btn" source="продукти">
              Купи книгата — 47 €
            </CheckoutButton>
          </div>
        )}
      </section>
    </>
  );
}
