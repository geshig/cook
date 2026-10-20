import Link from "next/link";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

type Row = { started: number; paid: number; abandoned: number; open: number; withEmail: number; revenue: number };
const empty = (): Row => ({ started: 0, paid: 0, abandoned: 0, open: 0, withEmail: 0, revenue: 0 });

function kindOf(s: Stripe.Checkout.Session): "book" | "gift" | "bonus" {
  if (s.mode === "subscription") return "bonus";
  return s.metadata?.kind === "gift" ? "gift" : "book";
}

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "—");
const eur = (c: number) => `${(c / 100).toFixed(2).replace(".", ",")} €`;

/**
 * Checkout funnel from Stripe itself: every "Купи" click creates a Checkout
 * Session, so started vs paid vs expired gives the drop-off on the payment
 * page. Sessions stay "open" for 24 h before Stripe marks them expired.
 */
export default async function AdminStats({ searchParams }: PageProps<"/admin/statistika">) {
  const sp = await searchParams;
  const days = [1, 7, 30].includes(Number(sp.d)) ? Number(sp.d) : 7;
  const since = Math.floor(Date.now() / 1000) - days * 86400;

  const rows = { book: empty(), gift: empty(), bonus: empty() };
  const byDay = new Map<string, Row>();
  let error: string | null = null;
  try {
    let n = 0;
    for await (const s of getStripe().checkout.sessions.list({ created: { gte: since }, limit: 100 })) {
      if (++n > 3000) break;
      const r = rows[kindOf(s)];
      const day = new Date(s.created * 1000).toLocaleDateString("bg-BG", { day: "numeric", month: "short", timeZone: "Europe/Sofia" });
      const d = byDay.get(day) ?? empty();
      for (const x of kindOf(s) === "book" ? [r, d] : [r]) {
        x.started++;
        if (s.status === "complete") {
          x.paid++;
          x.revenue += s.amount_total ?? 0;
        } else if (s.status === "expired") {
          x.abandoned++;
          if (s.customer_details?.email) x.withEmail++;
        } else x.open++;
      }
      byDay.set(day, d);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const card = (title: string, hint: string, r: Row) => (
    <div className="stat-card">
      <h2>{title}</h2>
      <p className="stat-hint">{hint}</p>
      <div className="stat-big">
        <div>
          <b>{r.started}</b>
          <span>започнали</span>
        </div>
        <div>
          <b>{r.paid}</b>
          <span>платили</span>
        </div>
        <div>
          <b>{pct(r.paid, r.paid + r.abandoned)}</b>
          <span>довършват</span>
        </div>
        <div>
          <b>{pct(r.abandoned, r.paid + r.abandoned)}</b>
          <span>се отказват</span>
        </div>
      </div>
      <p className="stat-small">
        Отказали се: {r.abandoned} (от тях {r.withEmail} са написали имейл) · Още отворени: {r.open}
        {r.revenue > 0 && <> · Приход: {eur(r.revenue)}</>}
      </p>
    </div>
  );

  return (
    <section style={{ paddingTop: 32, maxWidth: 900 }}>
      <div className="admin-tabs">
        <Link href="/admin">Рецепти</Link>
        <Link href="/admin/otzivi">Отзиви</Link>
        <Link href="/admin/produkti">Продукти</Link>
        <Link href="/admin/video">Видео</Link>
        <Link href="/admin/podaraci">Подаръци</Link>
        <Link href="/admin/statistika" className="on">
          Статистика
        </Link>
      </div>
      <h1 className="display" style={{ fontSize: 34, marginBottom: 6 }}>
        Плащания: колко довършват
      </h1>
      <div className="stat-periods">
        {[1, 7, 30].map((d) => (
          <Link key={d} href={`/admin/statistika?d=${d}`} className={d === days ? "on" : ""}>
            {d === 1 ? "Днес (24 ч)" : `${d} дни`}
          </Link>
        ))}
      </div>
      {error ? (
        <p className="stat-hint">Stripe не отговори: {error}</p>
      ) : (
        <>
          {card("Книгата", "Всеки клик на „Купи“ отваря страница на Stripe. Тук е колко от тях са платили.", rows.book)}
          {card("Бонус с нови рецепти", "Взели ли са 3-те безплатни месеца след покупката.", rows.bonus)}
          {rows.gift.started > 0 && card("Подаръци", "Покупки на книгата за приятел.", rows.gift)}
          {byDay.size > 0 && (
            <div className="stat-card">
              <h2>Книгата по дни</h2>
              <table className="stat-table">
                <thead>
                  <tr>
                    <th>Ден</th>
                    <th>Започнали</th>
                    <th>Платили</th>
                    <th>Отказали се</th>
                    <th>Довършват</th>
                  </tr>
                </thead>
                <tbody>
                  {[...byDay.entries()].map(([day, r]) => (
                    <tr key={day}>
                      <td>{day}</td>
                      <td>{r.started}</td>
                      <td>{r.paid}</td>
                      <td>{r.abandoned}</td>
                      <td>{pct(r.paid, r.paid + r.abandoned)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="stat-small">
            „Се отказват“ брои само страниците, които Stripe вече е затворил (след 24 часа без плащане). Отворените
            от последното денонощие още не са броени като отказ.
          </p>
        </>
      )}
    </section>
  );
}
