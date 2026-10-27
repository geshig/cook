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
  // What each part would cost on its own, from real market prices (Oct 2026):
  // a 4-week meal plan from a dietitian ~40 €, a month of a calorie app with
  // a meal planner ~25 €, 100+ recipes with macros 50 €, our own 5,99 €/month.
  const bonusPrice = bonusMonths === 3 ? 18 : 6;
  const value: [string, string, number | null][] = [
    ["100+ рецепти с калориите и макросите", "вечери за семейството, обеди в кутии, десерти", 50],
    ["Меню по твоите калории", "вместо хранителен режим от диетолог", 40],
    ["Калкулатор, меню планер и списък за пазаруване", "вместо месечен абонамент за приложение", 25],
    [
      bonusMonths === 3 ? "3 месеца нови рецепти" : "1 месец нови рецепти",
      bonusMonths === 3 ? `по 2–4 нови всяка седмица, за първите ${firstBuyers}` : "по 2–4 нови всяка седмица",
      bonusPrice,
    ],
    ["Общност в Skool", "питаш и ти отговарям лично", null],
  ];
  const total = value.reduce((sum, [, , p]) => sum + (p ?? 0), 0);
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
        <p className="pdp-kicker">Онлайн готварска книга</p>
        <h2 className="pdp-title">Кухнята на Геша</h2>
        <p className="pdp-sub">
          100+ високопротеинови рецепти. На всяка порция: калории, протеин,
          въглехидрати и мазнини.
        </p>

        <div className="pdp-value">
          <p className="pdp-value-head">
            <span>Какво получаваш</span>
            <span>Струва отделно</span>
          </p>
          <ul>
            {value.map(([head, note, price]) => (
              <li key={head}>
                <span>
                  <b>{head}</b>
                  <small>{note}</small>
                </span>
                {price ? <s>{price} €</s> : <em>включено</em>}
              </li>
            ))}
          </ul>
          <p className="pdp-value-total">
            <span>Ако го купуваш поотделно</span>
            <s>{total} €</s>
          </p>
        </div>

        <div className="pdp-price">
          <b>47 €</b>
          <span>еднократно, с достъп завинаги</span>
        </div>
        <p className="pdp-save">
          Спестяваш {total - 47} € <span>({Math.round(((total - 47) / total) * 100)}%)</span>
        </p>

        <CheckoutButton kind="book" className="btn pdp-btn" source="продукт">
          Купи книгата
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
        </ul>

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
