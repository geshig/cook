import { getAccess } from "@/lib/access";
import { getRecipesForViewer } from "@/lib/recipes";
import { CheckoutButton } from "@/components/CheckoutButton";
import { SiteHeader } from "@/components/SiteHeader";

export default async function LandingPage() {
  const access = await getAccess();
  // The recipe preview is decorative — if Supabase is briefly unreachable,
  // the funnel (lead form, checkout) should still render and take payments.
  const preview = await getRecipesForViewer(access)
    .then((recipes) => recipes.slice(0, 4))
    .catch((err) => {
      console.error("Failed to load recipe preview:", err);
      return [];
    });

  return (
    <>
      <SiteHeader />

      <section className="hero">
        <div className="eyebrow">Кухнята — рецепти с макроси</div>
        <h1 className="display">
          ВКУСНО.
          <br />
          БЪРЗО.
          <br />
          <span>С МАКРОСИТЕ.</span>
        </h1>
        <p>
          50+ рецепти с точни калории и макроси. Филтрираш по съставка, повод
          или време за готвене — без да гадаеш какво ядеш.
        </p>
        <a href="#pricing" className="btn">
          Купи книгата
        </a>
        <div className="hero-meta">
          <span>⏱ под 30 мин повечето</span>
          <span>📊 макроси на всяка</span>
        </div>
      </section>

      {preview.length > 0 && (
        <section className="preview">
          <h2>Какво има вътре</h2>
          <p>Малка извадка — пълният списък е в книгата.</p>
          <div className="pgrid">
            {preview.map((r) => (
              <div key={r.id} className={"pcard" + (r.isLocked ? " locked" : "")}>
                {r.isLocked && <span className="lock">🔒</span>}
                <h4>{r.title}</h4>
                <div className="meta">
                  {r.timeMinutes != null && `${r.timeMinutes} мин`}
                  {r.timeMinutes != null && r.kcal != null && " · "}
                  {r.kcal != null && `${r.kcal} kcal`}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="pricing" className="pricing">
        <div className="price-card">
          <div className="tag">Основна книга</div>
          <div className="amount">
            25€ <span>еднократно</span>
          </div>
          <ul>
            <li>50+ рецепти с макроси</li>
            <li>Тагове и филтриране по съставка</li>
            <li>Достъп в браузъра — на всяко устройство</li>
            <li>Расте — нови рецепти всяко тримесечие</li>
          </ul>
          <CheckoutButton kind="book" className="btn">
            Купи сега
          </CheckoutButton>
        </div>
        <div className="upsell-note">
          Искаш всичко ново веднага, без да чакаш?{" "}
          <CheckoutButtonLink />
        </div>
      </section>

      <section className="faq">
        <h2 style={{ fontSize: 26, marginBottom: 10 }}>Въпроси</h2>
        <div className="faq-item">
          <h4>Как получавам достъп?</h4>
          <p>
            Веднага след плащане получаваш линк по имейл — отваря се в
            браузъра, без инсталация.
          </p>
        </div>
        <div className="faq-item">
          <h4>Трябва ли ми кухненска везна?</h4>
          <p>
            Не е задължително — всяка рецепта има и обичайни мерни единици
            покрай грамажа.
          </p>
        </div>
        <div className="faq-item">
          <h4>Какво ако не ми хареса?</h4>
          <p>Пиши ми в рамките на 7 дни — връщам парите без въпроси.</p>
        </div>
      </section>

      <footer>
        Кухнята © 2026 · <a href="#">Условия</a> ·{" "}
        <a href="#">Поверителност</a>
      </footer>
    </>
  );
}

function CheckoutButtonLink() {
  return (
    <CheckoutButton kind="subscription" className="upsell-link">
      Виж абонамента →
    </CheckoutButton>
  );
}
