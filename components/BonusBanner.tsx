import { ActivateTrialButton } from "@/components/ActivateTrialButton";
import { ManageBillingButton } from "@/components/ManageBillingButton";

function bgDate(iso: string) {
  return new Date(iso).toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric" });
}

/** Book owners: their 3 free months, either running or ready to start with one click. */
export function BonusBanner({ trialEndsAt }: { trialEndsAt: string | null }) {
  if (trialEndsAt) {
    return (
      <div className="bonus">
        <div className="bonus-text">
          <b>🎁 Твоите безплатни нови рецепти са активни до {bgDate(trialEndsAt)}</b>
          <span>
            Всяка седмица добавям 2–4 нови рецепти и ги виждаш веднага. Ако си платил
            книгата с карта, след {bgDate(trialEndsAt)} абонаментът продължава за 5,99 € на
            месец със същата карта, а ако не искаш, спри го от „Управлявай“ преди това.
            Без карта просто спира, без такси.
          </span>
        </div>
        <ManageBillingButton label="Управлявай" className="btn" />
      </div>
    );
  }
  return (
    <div className="bonus">
      <div className="bonus-text">
        <b>🎁 Твоят бонус: новите рецепти безплатно</b>
        <span>
          Всяка седмица 2–4 нови рецепти. Активира се с един клик, без карта. След бонуса
          продължаваш за 5,99 € на месец само ако добавиш карта.
        </span>
      </div>
      <ActivateTrialButton>Активирай бонуса</ActivateTrialButton>
    </div>
  );
}
