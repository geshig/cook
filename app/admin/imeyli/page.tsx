import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { GROUP_INVITE } from "@/lib/email";
import { COMMUNITY } from "@/lib/site";
import { GroupInviteButton } from "@/components/GroupInviteButton";
import { TestEmailButton } from "@/components/TestEmailButton";
import { recentEmails } from "@/lib/emailLog";

const STATUS: Record<string, string> = {
  delivered: "✓ получен",
  opened: "✓ отворен",
  clicked: "✓ натиснат линк",
  sent: "изпратен",
  bounced: "✗ върнат",
  complained: "✗ спам",
  failed: "✗ не тръгна",
  delivery_delayed: "забавен",
  queued: "в опашка",
};

export const dynamic = "force-dynamic";

export default async function AdminEmails() {
  const admin = createAdminClient();
  const admins = new Set(
    (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  );
  const [{ data: buyers }, { data: sentRow }, log] = await Promise.all([
    admin.from("subscribers").select("email").eq("purchased_book", true),
    admin.from("site_settings").select("value").eq("key", "group_invite_sent").maybeSingle(),
    recentEmails(100),
  ]);
  const count = new Set(
    (buyers ?? []).map((b) => String(b.email).toLowerCase()).filter((e) => !admins.has(e))
  ).size;
  let sent: { at: string; sent: number; failed: string[] } | null = null;
  try {
    sent = sentRow?.value ? JSON.parse(sentRow.value) : null;
  } catch {}

  return (
    <section style={{ paddingTop: 32, maxWidth: 820 }}>
      <div className="admin-tabs">
        <Link href="/admin">Рецепти</Link>
        <Link href="/admin/otzivi">Отзиви</Link>
        <Link href="/admin/produkti">Продукти</Link>
        <Link href="/admin/video">Видео</Link>
        <Link href="/admin/podaraci">Подаръци</Link>
        <Link href="/admin/imeyli" className="on">
          Имейли
        </Link>
      </div>
      <h1 className="display" style={{ fontSize: 34, marginBottom: 6 }}>
        Имейли
      </h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 18, lineHeight: 1.6 }}>
        Отива веднъж до всички, които имат книгата, с линк към групата във
        Facebook. Новите купувачи получават линка към групата в имейла за достъп.
      </p>

      <div className="community-card" style={{ display: "block", marginBottom: 22 }}>
        <p style={{ margin: "0 0 10px" }}>
          <b>Тема:</b> {GROUP_INVITE.subject}
        </p>
        {GROUP_INVITE.lines.map((l) => (
          <p key={l} style={{ margin: "0 0 10px", lineHeight: 1.6 }}>
            {l}
          </p>
        ))}
        <p style={{ margin: "0 0 10px" }}>
          <a href={COMMUNITY.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700 }}>
            [{GROUP_INVITE.button}]
          </a>
        </p>
        <p style={{ margin: 0 }}>{GROUP_INVITE.sign}</p>
      </div>

      {sent ? (
        <p style={{ fontWeight: 700 }}>
          ✓ Изпратен на {sent.sent} души на{" "}
          {new Date(sent.at).toLocaleString("bg-BG", { timeZone: "Europe/Sofia" })}.
          {sent.failed?.length ? ` Не тръгнаха: ${sent.failed.join(", ")}` : ""}
        </p>
      ) : (
        <GroupInviteButton count={count} />
      )}

      <h2 style={{ fontSize: 22, margin: "40px 0 8px" }}>Работи ли hello@geshapov.com?</h2>
      <p style={{ color: "var(--text-dim)", marginBottom: 14, lineHeight: 1.6 }}>
        Пращам тестов имейл до hello@geshapov.com. Ако дойде в geshbdo@gmail.com,
        работят и изпращането от сайта, и препращането.
      </p>
      <TestEmailButton />

      <h2 style={{ fontSize: 22, margin: "40px 0 8px" }}>Последни изпратени имейли</h2>
      <p style={{ color: "var(--text-dim)", marginBottom: 14, lineHeight: 1.6 }}>
        Тук виждаш дали са тръгнали имейлът за достъп, „Какво сготви?“ (7 дни след
        покупката), напомнянето за 5,99 € и останалите.
        {log.source === "log" && " Записват се от днес нататък; по-старите са в Resend → Emails."}
      </p>
      {log.rows.length === 0 ? (
        <p style={{ color: "var(--text-dim)" }}>
          {log.source === "none" ? "Още няма записи. Пусни email-log.sql в Supabase." : "Още няма."}
        </p>
      ) : (
        <div className="gift-table">
          {log.rows.map((r, i) => (
            <div key={i} className="gift-made-row">
              <span>
                {r.at ? new Date(r.at).toLocaleString("bg-BG", { timeZone: "Europe/Sofia", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
              </span>
              <code>
                {r.to} · {r.subject}
              </code>
              <em className={r.status && /bounced|complained|failed/.test(r.status) ? "free" : "taken"}>
                {(r.status && STATUS[r.status]) ?? r.status ?? ""}
              </em>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
