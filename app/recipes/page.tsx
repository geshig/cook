import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAccess, hasBookAccess } from "@/lib/access";
import {
  getAllTags,
  getFavoriteIds,
  getRecipeTeaser,
  getRecipesForViewer,
  type RecipeTeaser,
} from "@/lib/recipes";
import { getStripe } from "@/lib/stripe";
import { RecipeApp } from "@/components/RecipeApp";
import { SiteHeader } from "@/components/SiteHeader";
import { CheckoutPending } from "@/components/CheckoutPending";
import { BonusBanner } from "@/components/BonusBanner";
import { CommunityCard } from "@/components/CommunityCard";
import { COMMUNITY } from "@/lib/site";

type SP = Promise<{ [key: string]: string | string[] | undefined }>;

function sharedId(sp: Awaited<SP>): number {
  return typeof sp.r === "string" ? Number(sp.r) : NaN;
}

function macrosLine(t: RecipeTeaser): string {
  return [
    t.kcal != null && `${t.kcal} kcal`,
    t.proteinG != null && `${t.proteinG} g протеин`,
    t.timeMinutes != null && `${t.timeMinutes} мин`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * A shared recipe link (/recipes?r=12) previews as that recipe in Viber,
 * Messenger and WhatsApp: its photo, name and macros instead of the generic card.
 */
export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const t = await getRecipeTeaser(sharedId(await searchParams)).catch(() => null);
  if (!t) return { title: "Рецептите — Кухнята на Геша" };
  const title = `${t.title} — Кухнята на Геша`;
  const description = `${macrosLine(t)}. Рецепта от високопротеиновата книга „Кухнята на Геша“.`;
  const images = t.photoUrl ? [{ url: t.photoUrl, alt: t.title }] : undefined;
  return {
    title,
    description,
    openGraph: { title, description, images, type: "article" },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

/** What a non-buyer sees when a friend sends them a recipe link. */
function SharedTeaser({ t, signedIn }: { t: RecipeTeaser; signedIn: boolean }) {
  return (
    <div className="gate teaser">
      {t.photoUrl && (
        <div className="teaser-photo">
          <Image src={t.photoUrl} alt={t.title} fill sizes="(min-width: 640px) 520px, 100vw" preload />
        </div>
      )}
      <h1 className="display">{t.title}</h1>
      <p className="teaser-macros">{macrosLine(t)}</p>
      <p>
        Тази рецепта е от книгата ми с 101 високопротеинови рецепти. Всяка е
        със снимка, продукти, стъпки и макроси на порция.
      </p>
      <Link className="btn" href="/#pricing">
        Виж книгата — 47€
      </Link>
      {!signedIn && (
        <Link className="btn btn-ghost" href="/login">
          Имам книгата, вход
        </Link>
      )}
    </div>
  );
}

/** The email the buyer entered on Stripe Checkout, if this session is paid. */
async function paidEmailFor(sessionId: string | undefined): Promise<string | null> {
  if (!sessionId || !sessionId.startsWith("cs_")) return null;
  try {
    const s = await getStripe().checkout.sessions.retrieve(sessionId);
    if (s.status !== "complete") return null;
    const email = s.customer_details?.email ?? s.customer_email;
    return email ? email.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const access = await getAccess();

  if (!hasBookAccess(access)) {
    const sp = await searchParams;
    const justPaid = sp.checkout === "success";
    const paidEmail = justPaid
      ? await paidEmailFor(typeof sp.session_id === "string" ? sp.session_id : undefined)
      : null;
    const signedIn = access.email?.toLowerCase() ?? null;

    if (justPaid) {
      const loginHref = paidEmail ? `/login?email=${encodeURIComponent(paidEmail)}` : "/login";
      return (
        <>
          <SiteHeader />
          <div className="gate">
            <div className="lock-big">🎉</div>
            <h1 className="display">Благодаря ти за покупката</h1>
            {signedIn && (!paidEmail || paidEmail === signedIn) ? (
              <CheckoutPending />
            ) : signedIn && paidEmail ? (
              <>
                <p>
                  Плати с {paidEmail}, а си влязъл с {signedIn}. Излез и влез с
                  имейла, с който плати.
                </p>
                <Link className="btn" href={loginHref}>
                  Влез с {paidEmail}
                </Link>
              </>
            ) : (
              <>
                <p>
                  Плащането мина. Влез с {paidEmail ?? "имейла, с който плати"} и
                  ще ти изпратя линк. Рецептите ще те чакат отключени.
                </p>
                <Link className="btn" href={loginHref}>
                  Влез в рецептите
                </Link>
              </>
            )}
          </div>
        </>
      );
    }

    const teaser = await getRecipeTeaser(sharedId(sp)).catch(() => null);
    if (teaser) {
      return (
        <>
          <SiteHeader />
          <SharedTeaser t={teaser} signedIn={!!access.email} />
        </>
      );
    }

    return (
      <>
        <SiteHeader />
        <div className="gate">
          <div className="lock-big">🔒</div>
          <h1 className="display">Книгата отключва тук</h1>
          <p>
            {access.email
              ? `Не виждам платена книга или абонамент за ${access.email}. Купи книгата, за да влезеш в пълния каталог.`
              : "Купи книгата или влез, ако вече си я взел, за да отвориш пълния каталог с рецепти."}
          </p>
          <Link className="btn" href="/#pricing">
            Купи книгата — 47€
          </Link>
          {!access.email && (
            <Link className="btn btn-ghost" href="/login">
              Вече платих, вход
            </Link>
          )}
        </div>
      </>
    );
  }

  const [recipes, tags, favorites] = await Promise.all([
    getRecipesForViewer(access),
    getAllTags().catch(() => []),
    getFavoriteIds(access.email).catch(() => []),
  ]);
  // Only offer tags that at least one recipe actually has, grouped for the filter panel.
  const used = new Set(recipes.flatMap((r) => r.tags));
  const tagGroups: { category: string; names: string[] }[] = [];
  for (const t of tags) {
    if (!used.has(t.name)) continue;
    let g = tagGroups.find((x) => x.category === t.category);
    if (!g) tagGroups.push((g = { category: t.category, names: [] }));
    g.names.push(t.name);
  }

  return (
    <>
      <SiteHeader />
      <header className="app-header">
        <h1 className="display">Рецептите</h1>
        <p>{recipes.length} рецепти · търси, филтрирай и запазвай любими</p>
      </header>
      {access.purchasedBook && (!access.hadSubscription || access.trialEndsAt) && (
        <section style={{ paddingBlock: 0, maxWidth: 900 }}>
          <BonusBanner trialEndsAt={access.trialEndsAt} />
        </section>
      )}
      {access.purchasedBook && COMMUNITY.url && (
        <section style={{ paddingBlock: "0 8px", maxWidth: 900 }}>
          <CommunityCard />
        </section>
      )}
      <RecipeApp
        recipes={recipes}
        tagGroups={tagGroups}
        initialFavorites={favorites}
        trialOffer={access.purchasedBook && !access.hadSubscription}
      />
    </>
  );
}
