import Link from "next/link";
import { getAccess, hasBookAccess } from "@/lib/access";
import { getRecipesForViewer } from "@/lib/recipes";
import { RecipeApp } from "@/components/RecipeApp";
import { SiteHeader } from "@/components/SiteHeader";

export default async function RecipesPage() {
  const access = await getAccess();

  if (!hasBookAccess(access)) {
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
