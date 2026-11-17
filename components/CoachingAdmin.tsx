"use client";

import { useState } from "react";
import { HEALTH_DOCTOR, type CoachingApp } from "@/lib/coaching";

const GROUPS: { title: string; statuses: CoachingApp["status"][]; open: boolean }[] = [
  { title: "Нови", statuses: ["new"], open: true },
  { title: "Чакат плащане", statuses: ["approved"], open: true },
  { title: "Клиенти", statuses: ["paid"], open: true },
  { title: "Приключили и отказани", statuses: ["ended", "rejected"], open: false },
];

/** Bulgarian mobile number → international digits for WhatsApp/Viber links. */
function intl(phone: string | null): string {
  const d = (phone ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) return d.slice(2);
  if (d.startsWith("0")) return "359" + d.slice(1);
  return d;
}

function chatLink(app: CoachingApp): string | null {
  const n = intl(app.phone);
  if (!n) return null;
  if (app.contact_app === "WhatsApp") return `https://wa.me/${n}`;
  if (app.contact_app === "Viber") return `viber://chat?number=%2B${n}`;
  if (app.contact_app === "Telegram") return `https://t.me/+${n}`;
  return `tel:+${n}`;
}

const bg = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("bg-BG", { day: "numeric", month: "short", timeZone: "Europe/Sofia" }) : "";

export function CoachingAdmin({ apps: initial, site }: { apps: CoachingApp[]; site: string }) {
  const [apps, setApps] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function act(app: CoachingApp, action: "approve" | "reject" | "end") {
    const ask = {
      approve: `Да пратя линкове за плащане на ${app.name}?`,
      reject: `Да пратя отказ на ${app.name}?`,
      end: `${app.name} приключва и мястото се освобождава?`,
    }[action];
    if (!window.confirm(ask)) return;
    setBusy(app.id);
    setMsg(null);
    const res = await fetch("/api/admin/coaching", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: app.id, action }),
    });
    const data = (await res.json().catch(() => ({}))) as { status?: CoachingApp["status"]; error?: string; sent?: boolean };
    setBusy(null);
    if (!res.ok || !data.status) {
      setMsg(data.error ?? "Не стана.");
      return;
    }
    if (data.sent === false) setMsg("Записано, но имейлът не тръгна. Прати линка ръчно.");
    // A new token may have been created on approve: reload to get it.
    if (action === "approve") return window.location.reload();
    setApps((list) => list.map((a) => (a.id === app.id ? { ...a, status: data.status! } : a)));
  }

  return (
    <div className="coach-admin">
      {msg && <p className="coach-admin-msg">{msg}</p>}
      {GROUPS.map((g) => {
        const list = apps.filter((a) => g.statuses.includes(a.status));
        return (
          <details key={g.title} open={g.open && list.length > 0} className="coach-group">
            <summary>
              {g.title} <span>({list.length})</span>
            </summary>
            {list.length === 0 && <p className="coach-empty">Няма.</p>}
            {list.map((a) => {
              const flags = a.health ?? [];
              const doctor = flags.some((f) => HEALTH_DOCTOR.has(f));
              const link = chatLink(a);
              const pay = a.pay_token ? `${site}/api/coaching/pay?t=${a.pay_token}&plan=` : null;
              return (
                <article key={a.id} className={"coach-card" + (doctor ? " warn" : "")}>
                  <header>
                    <b>{a.name}</b>
                    <span>
                      {bg(a.created_at)}
                      {a.paid_plan && ` · платено: ${a.paid_plan === "three" ? "3 месеца" : "месечно"} (${bg(a.paid_at)})`}
                    </span>
                  </header>
                  <p className="coach-facts">
                    {[a.goal, a.sex, a.age && `${a.age} г.`, a.height_cm && `${a.height_cm} см`, a.weight_kg && `${a.weight_kg} кг`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <dl>
                    {a.activity && (
                      <>
                        <dt>Движение</dt>
                        <dd>{a.activity}</dd>
                      </>
                    )}
                    {a.train_where && (
                      <>
                        <dt>Тренировки</dt>
                        <dd>
                          {a.train_where}
                          {a.train_days != null && `, ${a.train_days}× седмично`}
                        </dd>
                      </>
                    )}
                    {a.dislikes && (
                      <>
                        <dt>Не яде</dt>
                        <dd>{a.dislikes}</dd>
                      </>
                    )}
                    {a.tried && (
                      <>
                        <dt>Пробвал/а</dt>
                        <dd>{a.tried}</dd>
                      </>
                    )}
                    <dt>Здраве</dt>
                    <dd className={flags.length ? "coach-flag" : ""}>
                      {flags.length ? flags.join(", ") : "нищо отметнато"}
                      {a.health_note && ` · ${a.health_note}`}
                    </dd>
                    <dt>Иска</dt>
                    <dd>{a.plan === "three" ? "3 месеца" : a.plan === "month" ? "месечно" : "не знае"}</dd>
                    <dt>Връзка</dt>
                    <dd>
                      <a href={`mailto:${a.email}`}>{a.email}</a>
                      {a.phone && " · "}
                      {a.phone && (link ? <a href={link}>{a.phone} ({a.contact_app ?? "тел."})</a> : a.phone)}
                    </dd>
                  </dl>
                  {doctor && a.status === "new" && (
                    <p className="coach-doctor">⚠️ Преди да одобриш: поискай „да“ от лекар за този режим.</p>
                  )}
                  <div className="coach-actions">
                    {(a.status === "new" || a.status === "rejected") && (
                      <button className="btn" disabled={busy === a.id} onClick={() => act(a, "approve")}>
                        Одобри
                      </button>
                    )}
                    {a.status === "new" && (
                      <button className="btn btn-ghost" disabled={busy === a.id} onClick={() => act(a, "reject")}>
                        Откажи
                      </button>
                    )}
                    {a.status === "approved" && pay && (
                      <>
                        <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(pay + "three")}>
                          Копирай линк 3 месеца
                        </button>
                        <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(pay + "month")}>
                          Копирай линк месечно
                        </button>
                      </>
                    )}
                    {a.status === "paid" && (
                      <button className="btn btn-ghost" disabled={busy === a.id} onClick={() => act(a, "end")}>
                        Приключи
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </details>
        );
      })}
    </div>
  );
}
