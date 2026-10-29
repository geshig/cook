import Image from "next/image";
import { Price } from "@/components/Price";
import { CheckoutButton } from "@/components/CheckoutButton";
import { PayBadges } from "@/components/PayBadges";

/**
 * Everything the book gives, in one screen: short tiles a person gets at a
 * glance, then the price and the buy button. Used on the landing page right
 * under the hero and under the free recipes (/pile).
 */
export function ValueStack({
  bonusMonths,
  source,
  title = "Какво получаваш",
}: {
  bonusMonths: 3 | 1;
  source: string;
  title?: string;
}) {
  const bonus = bonusMonths === 3 ? "3 месеца" : "1 месец";
  const items: [string, string, string][] = [
    ["📖", "100+ рецепти", "Снимка, калории и макроси на всяка"],
    ["⚖️", "Порциите се смятат сами", "За 1 или за 6 души, с едно +"],
    ["🔥", "Калкулатор за калории", "Казва ти колко да ядеш за целта ти"],
    ["📅", "Меню за целия ден", "По твоите калории, с едно натискане"],
    ["🛒", "Списък за пазаруване", "Продуктите влизат с едно натискане"],
    ["🥡", "16 кутии за работа", "Готвиш веднъж за няколко дни"],
    ["⏱️", "Бързо", "Половината стават за до 30 минути"],
    ["💬", "Общност в Skool", "Питаш и ти отговарям лично"],
  ];
  return (
    <div className="value">
      <h2 className="display">{title}</h2>
      <ul className="value-grid">
        {items.map(([icon, head, text]) => (
          <li key={head}>
            <span className="value-ico" aria-hidden="true">
              {icon}
            </span>
            <span>
              <b>{head}</b>
              {text}
            </span>
          </li>
        ))}
      </ul>
      <p className="value-note">Не е PDF: отваря се в телефона като приложение, без да теглиш нищо.</p>
      <div className="value-buy">
        <Image className="value-cover" src="/book-cover-v3.png" alt="Книгата „Кухнята на Геша“ с Хоуми на корицата" width={1020} height={1320} sizes="90px" />
        <div className="value-price">
          <b><Price /></b>
          <span>еднократно, достъп завинаги</span>
        </div>
        <CheckoutButton kind="book" className="btn value-btn" source={source}>
          Купи книгата
        </CheckoutButton>
      </div>
      <p className="value-bonus">
        🎁 <b>Бонус:</b> {bonus} нови рецепти безплатно, по 2–4 всяка седмица
      </p>
      <PayBadges />
    </div>
  );
}
