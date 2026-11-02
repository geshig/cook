import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { GROUP_INVITE } from "@/lib/email";
import { COMMUNITY } from "@/lib/site";
import { GroupInviteButton } from "@/components/GroupInviteButton";

export const dynamic = "force-dynamic";

export default async function AdminEmails() {
  const admin = createAdminClient();
  const admins = new Set(
    (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  );
  const [{ data: buyers }, { data: sentRow }] = await Promise.all([
    admin.from("subscribers").select("email").eq("purchased_book", true),
    admin.from("site_settings").select("value").eq("key", "group_invite_sent").maybeSingle(),
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
        Имейл „Всичко наред ли е?“
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
    </section>
  );
}
