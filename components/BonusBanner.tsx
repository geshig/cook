import { CheckoutButton } from "@/components/CheckoutButton";

/** Shown to book owners who haven't activated their 3 free months yet. */
export function BonusBanner() {
  return (
    <div className="bonus">
      <div className="bonus-text">
        <b>🎁 Твоят бонус: 3 месеца новите рецепти безплатно</b>
        <span>
          Всеки месец добавяме нови рецепти. Активирай бонуса и ги получаваш,
          щом излязат. После 5,99 € на месец, спираш с един клик от „Профил“.
          Рецептите от книгата остават твои.
        </span>
      </div>
      <CheckoutButton kind="subscription" className="btn">
        Активирай бонуса
      </CheckoutButton>
    </div>
  );
}
