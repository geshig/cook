import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccess } from "@/lib/access";
import { SiteHeader } from "@/components/SiteHeader";
import { ManageBillingButton } from "@/components/ManageBillingButton";

export default async function AccountPage() {
  const access = await getAccess();

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
              {access.subscriptionActive ? "Активен" : "Неактивен"}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn" href="/recipes">
            Към рецептите
          </Link>
          {(access.purchasedBook || access.subscriptionActive) && (
            <ManageBillingButton />
          )}
        </div>
      </section>
    </>
  );
}
