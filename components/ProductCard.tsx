import Image from "next/image";
import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";

/**
 * The buy block on the landing page, laid out like a shop product page:
 * a big cover, the price, one big button, wallets, trust lines, then the
 * details folded into short accordions so the page stays short on a phone.
 */
export function ProductCard({
  bonusMonths,
  firstBuyers,
  ownsBook,
}: {
  bonusMonths: 3 | 1;
  firstBuyers: number;
  ownsBook: boolean;
}) {
  const bonus = bonusMonths === 3 ? `3 месеца нови рецепти безплатно за първите ${firstBuyers} закупили` : "1 месец нови рецепти безплатно";
  return (
    <section id="pricing" className="pdp">
      <div className="pdp-media">
        <Image
          className="pdp-cover"
          src="/book-cover-v3.png"
          alt="Книгата „Кухнята на Геша“ с Хоуми на корицата"
          width={1020}
          height={1320}
          sizes="(min-width: 900px) 380px, 62vw"
        />
        <span className="pdp-flag">🎁 + {bonusMonths === 3 ? "3 месеца" : "1 месец"} нови рецепти</span>
      </div>

      <div className="pdp-info">
        <h2 className="pdp-title">Кухнята на Геша</h2>
        <p className="pdp-sub">Онлайн готварска книга: 100+ високопротеинови рецепти с калориите и макросите на всяка порция</p>

        <div className="pdp-price">
          <b>47 €</b>
          <span>еднократно · достъп завинаги</span>
        </div>

        <ul className="pdp-checks">
          <li><b>100+ рецепти</b> със снимка, калории и макроси</li>
          <li><b>Вечери за семейството</b> и кутии за работа за няколко дни</li>
          <li><b>Порциите се смятат сами</b>: за 1 или за 6 души</li>
          <li><b>Меню по твоите калории</b> и списък за пазаруване</li>
          <li><b>Общност в Skool</b>, където отговарям лично</li>
        </ul>

        <CheckoutButton kind="book" className="btn pdp-btn" source="продукт">
          Купи книгата · 47 €
        </CheckoutButton>

        <ul className="pdp-wallets" aria-label="Начини на плащане">
          <li>Apple Pay</li>
          <li>G Pay</li>
          <li>Revolut</li>
          <li>Карта</li>
        </ul>

        <ul className="pdp-trust">
          <li>⚡ Достъп веднага</li>
          <li>📱 Като приложение, не PDF</li>
          <li>🔒 Защитено през Stripe</li>
        </ul>

        <p className="pdp-bonus">
          🎁 <b>Бонус:</b> {bonus}, по 2–4 всяка седмица
        </p>

        <div className="pdp-two">
          <span>
            <b>Готвите двама?</b> <s>94 €</s> 74 € за двама
          </span>
          <CheckoutButton kind="book" forTwo className="pdp-two-btn" source="за двама">
            Купи за двама →
          </CheckoutButton>
        </div>

        <div className="pdp-acc">
          <details>
            <summary>Какво има вътре</summary>
            <p>
              16 рецепти за кутии за работа, 12 с пилешко, 12 с телешко, свинско и
              риба, 11 салати, 10 соса и мариновки, 8 десерта, закуски, супи,
              тортили, пици и гарнитури. На всяка: снимка, продукти, стъпки,
              време и макроси на порция. Плюс калкулатор за калории, дневни
              менюта, режим за готвене с таймери и филтри по съставка.
            </p>
          </details>
          <details>
            <summary>Как получавам достъп</summary>
            <p>
              Веднага след плащането влизаш с имейла, с който си платил, без
              парола. Отваря се в браузъра на телефона и компютъра. Можеш да го
              добавиш на началния екран и се отваря като приложение.
            </p>
          </details>
          <details>
            <summary>Бонусът с новите рецепти</summary>
            <p>
              Всяка седмица добавям 2–4 нови рецепти. Бонуса го активираш след
              покупката с едно натискане: днес 0 €, след безплатния период 5,99 €
              на месец, ако не го спреш. Спираш го по всяко време от „Профил“ и
              ти напомням 7 дни преди първото плащане. Книгата си остава твоя.
            </p>
          </details>
        </div>

        {ownsBook && (
          <p className="pdp-owner">
            Вече имаш книгата? Бонусът ти чака.{" "}
            <Link href="/recipes#bonus">Вземи го</Link>
          </p>
        )}
      </div>
    </section>
  );
}
