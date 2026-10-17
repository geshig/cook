import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";
import { CONTACT_EMAIL, SOCIALS } from "@/lib/site";
import { SocialIcon } from "./SocialIcon";

const PAY = ["Visa", "Mastercard", "Apple Pay", "Google Pay", "Revolut Pay"];

export function SiteFooter() {
  const socials = SOCIALS.filter((s) => s.href);
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link href="/" className="footer-logo">
            КУХНЯТА НА ГЕША
          </Link>
          <p>
            Високопротеинови рецепти с калориите и макросите на всяка порция.
            Сготвени и снимани от мен.
          </p>
          <div className="footer-social">
            {socials.map((s) => (
              <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                <SocialIcon id={s.id} />
              </a>
            ))}
            <a href={`mailto:${CONTACT_EMAIL}`} aria-label={`Имейл ${CONTACT_EMAIL}`}>
              <SocialIcon id="email" />
            </a>
          </div>
        </div>

        <nav className="footer-col" aria-label="Кухнята">
          <h3>Кухнята</h3>
          <Link href="/recipes">Рецептите</Link>
          <Link href="/menyuta">Дневни менюта</Link>
          <Link href="/produkti">Продуктите, с които готвя</Link>
          <Link href="/spisak">Списък за пазаруване</Link>
        </nav>

        <nav className="footer-col" aria-label="Помощ">
          <h3>Помощ</h3>
          <Link href="/#faq">Често задавани въпроси</Link>
          <Link href="/login">Вход</Link>
          <Link href="/account">Профил и абонамент</Link>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </nav>

        <div className="footer-col">
          <h3>Книгата</h3>
          <p className="footer-offer">100+ рецепти за 47 € и 3 месеца нови рецепти безплатно.</p>
          <CheckoutButton kind="book" className="btn footer-btn" source="футър">
            Купи книгата
          </CheckoutButton>
          <ul className="footer-pay" aria-label="Начини на плащане">
            {PAY.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Кухнята на Геша. Всички права запазени.</span>
        <span>
          <Link href="/usloviya">Условия за ползване</Link>
          <Link href="/poveritelnost">Поверителност</Link>
        </span>
      </div>
    </footer>
  );
}
