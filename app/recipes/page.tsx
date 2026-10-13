import Link from "next/link";
import { getAccess, hasBookAccess } from "@/lib/access";
import { getRecipesForViewer } from "@/lib/recipes";
import { getStripe } from "@/lib/stripe";
import { RecipeApp } from "@/components/RecipeApp";
import { SiteHeader } from "@/components/SiteHeader";
import { CheckoutPending } from "@/components/CheckoutPending";

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
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
            <h1 className="display">Благодарим за покупката</h1>
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
                  ще ти изпратим линк. Рецептите ще те чакат отключени.
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

    return (
      <>
        <SiteHeader />
        <div className="gate">
          <div className="lock-big">🔒</div>
          <h1 className="display">Книгата отключва тук</h1>
          <p>
            {access.email
              ? `Не виждаме платена книга или абонамент за ${access.email}. Купи книгата, за да влезеш в пълния каталог.`
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

  const recipes = await getRecipesForViewer(access);

  return (
    <>
      <SiteHeader />
      <header className="app-header">
        <h1 className="display">КУХНЯТА</h1>
        <p>Филтрирай рецептите по съставка, хранене или повод — тап с пръст</p>
      </header>
      <RecipeApp recipes={recipes} />
    </>
  );
}
