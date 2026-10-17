import type { Metadata } from "next";
import { getAccess, hasBookAccess, isAdmin } from "@/lib/access";
import { SiteHeader } from "@/components/SiteHeader";
import { CalorieCalculator } from "@/components/CalorieCalculator";
import { CheckoutButton } from "@/components/CheckoutButton";
import { StickyBuy } from "@/components/StickyBuy";

export const metadata: Metadata = {
  title: "Калкулатор за калории и BMI — Кухнята на Геша",
  description:
    "Колко калории и протеин ти трябват на ден, BMI и за колко време стигаш желаното тегло. Част от рецептурника „Кухнята на Геша“.",
};

export default async function CalculatorPage() {
  const access = await getAccess();
  const owner = hasBookAccess(access) || isAdmin(access);

  return (
    <>
      <SiteHeader />
      <header className="app-header">
        <h1 className="display">Калкулатор за калории</h1>
        <ul className="header-points">
          <li>Колко калории и протеин ти трябват на ден</li>
          <li>BMI и нормалното тегло за твоя ръст</li>
          <li>За колко време стигаш желаното тегло</li>
          <li>Меню от рецептите точно за тези калории</li>
        </ul>
      </header>

      <section className="calc-section">
        {owner ? (
          <CalorieCalculator />
        ) : (
          <div className="calc-locked">
            <div className="calc-locked-preview" aria-hidden="true" inert>
              <CalorieCalculator />
            </div>
            <div className="calc-locked-card">
              <span aria-hidden="true">🔒</span>
              <h2>Калкулаторът е за хората с книгата</h2>
              <p>
                С книгата получаваш калкулатора, 100+ рецепти с калории и
                макроси, дневни менюта, общността в Skool и 3 месеца нови
                рецепти безплатно.
              </p>
              <CheckoutButton kind="book" className="btn" source="калкулатор">
                Купи книгата за 47 €
              </CheckoutButton>
            </div>
          </div>
        )}
      </section>
      {!owner && <StickyBuy afterPx={400} />}
    </>
  );
}
