import { GiftBuy } from "./GiftBuy";
import { CopyLink } from "./CopyLink";
import type { Gift } from "@/lib/gifts";
import { giftLink } from "@/lib/gifts";

/** On /account for book owners: buy a gift for a friend and see the links. */
export function GiftCard({ gifts, justBought }: { gifts: Gift[]; justBought: boolean }) {
  return (
    <div className="gift-card">
      <h2>Подари книгата на приятел</h2>
      <p>
        Двамата излизате <b>74 € вместо 94 €</b>, спестявате 20 €. Доплащаш
        само за втория, получаваш линк, пращаш го и човекът влиза със своя
        имейл: 100+ рецепти и бонуса с нови рецепти, точно като теб.
      </p>
      {justBought && gifts.length === 0 && (
        <p className="gift-msg">Плащането мина. Линкът ще се появи тук до минута (и идва на имейла ти).</p>
      )}
      {gifts.length > 0 && (
        <ul className="gift-list">
          {gifts.map((g) => (
            <li key={g.code}>
              <code>{g.code}</code>
              {g.redeemedBy ? (
                <span className="gift-used">Взет от {g.redeemedBy}</span>
              ) : (
                <CopyLink url={giftLink(g.code)} />
              )}
            </li>
          ))}
        </ul>
      )}
      <GiftBuy />
    </div>
  );
}
