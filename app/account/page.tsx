import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";
import { SiteHeader } from "@/components/SiteHeader";
import { ManageBillingButton } from "@/components/ManageBillingButton";
import { CommunityCard } from "@/components/CommunityCard";
import { GiftCard } from "@/components/GiftCard";
import { PendingGift } from "@/components/GiftRedeem";
import { giftsBoughtBy } from "@/lib/gifts";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [access, sp] = await Promise.all([getAccess(), searchParams]);

  if (!access.email) {
    redirect("/login");
  }

  return (
    <>
      <SiteHeader />
      <section style={{ paddingTop: 40 }}>
        <div className="eyebrow">Профил</div>
        <h1 className="display" style={{ fontSize: 40, color: "var(--amber)" }}>
          {access.email}
        </h1>

        <div className="account-card">
          <div className="account-row">
            <span>Книга</span>
            <span className={"status-pill " + (access.purchasedBook ? "on" : "off")}>
              {access.purchasedBook ? "Купена" : "Не е купена"}
            </span>
          </div>
          <div className="account-row">
            <span>Абонамент</span>
            <span
              className={"status-pill " + (access.subscriptionActive ? "on" : "off")}
            >
              {access.trialEndsAt
                ? `Безплатен до ${new Date(access.trialEndsAt).toLocaleDateString("bg-BG", { day: "numeric", month: "long" })}`
                : access.subscriptionActive
                  ? "Активен"
                  : "Неактивен"}
            </span>
          </div>
        </div>
        {access.trialEndsAt && (
          <p style={{ marginTop: 12, fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>
            Ако си платил книгата с карта, след безплатния бонус абонаментът продължава
            автоматично за 5,99 € на месец със същата карта. Спираш го по всяко време от
            „Добави карта или управлявай“ и преди края на бонуса не плащаш нищо. Без карта
            просто спира, без такси.
          </p>
        )}

        <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn" href="/recipes">
            Към рецептите
          </Link>
          {(access.purchasedBook || access.subscriptionActive) && (
            <ManageBillingButton label={access.trialEndsAt ? "Добави карта или управлявай" : "Управление на плащания"} />
          )}
        </div>
        {access.purchasedBook && (
          <div style={{ marginTop: 24, display: "grid", gap: 14 }}>
            <div className="community-card">
              <div>
                <b>Калкулатор за калории</b>
                <p>
                  Колко калории и протеин ти трябват, BMI и за колко време стигаш
                  желаното тегло. После меню точно за тези калории.
                </p>
              </div>
              <Link className="btn" href="/kalkulator">
                Отвори калкулатора
              </Link>
            </div>
            <CommunityCard />
          </div>
        )}
        {access.purchasedBook && (
          <GiftCard gifts={await giftsBoughtBy(access.email)} justBought={sp.gift === "success"} />
        )}
        <PendingGift />
        <form action="/auth/signout" method="post" style={{ marginTop: 28 }}>
          <button type="submit" className="link-btn">
            Изход от профила
          </button>
        </form>
      </section>
    </>
  );
}
