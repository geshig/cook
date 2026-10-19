import { ActivateTrialButton } from "@/components/ActivateTrialButton";
import { ManageBillingButton } from "@/components/ManageBillingButton";

function bgDate(iso: string) {
  return new Date(iso).toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Book owners: the free months of new recipes, either running or waiting to be
 * claimed. Claiming opens a Stripe page with 0 € today and the price after it.
 */
export function BonusBanner({
  trialEndsAt,
  months = 3,
  justClaimed = false,
}: {
  trialEndsAt: string | null;
  months?: 3 | 1;
  /** Back from Stripe; the webhook may need a few seconds to confirm. */
  justClaimed?: boolean;
}) {
  const period = months === 3 ? "3 месеца" : "1 месец";
  if (trialEndsAt) {
    return (
      <div className="bonus" id="bonus">
        <div className="bonus-text">
          <b>🎁 Новите рецепти са безплатни за теб до {bgDate(trialEndsAt)}</b>
          <span>
            Всяка седмица добавям 2–4 нови рецепти и ги виждаш веднага. След {bgDate(trialEndsAt)} абонаментът е
            5,99 € на месец, ако не го спреш. Спираш го с едно натискане от „Управлявай“.
          </span>
        </div>
        <ManageBillingButton label="Управлявай" className="btn" />
      </div>
    );
  }
  if (justClaimed) {
    return (
      <div className="bonus" id="bonus">
        <div className="bonus-text">
          <b>🎉 Бонусът ти е взет</b>
          <span>Активира се до минута. Презареди страницата, ако още не виждаш новите рецепти.</span>
        </div>
      </div>
    );
  }
  return (
    <div className="bonus bonus-claim" id="bonus">
      <div className="bonus-text">
        <b>🎁 Вземи {period} нови рецепти безплатно</b>
        <span>
          Всяка седмица 2–4 нови рецепти. Днес плащаш 0 €. След безплатния период е 5,99 € на месец, а
          ако не искаш, го спираш по всяко време.
        </span>
      </div>
      <ActivateTrialButton>Вземи ги безплатно</ActivateTrialButton>
    </div>
  );
}
