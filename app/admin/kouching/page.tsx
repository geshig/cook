import Link from "next/link";
import { listApplications } from "@/lib/coachingDb";
import { COACHING } from "@/lib/coaching";
import { getSiteUrl } from "@/lib/site";
import { CoachingAdmin } from "@/components/CoachingAdmin";

export default async function AdminCoaching() {
  const apps = await listApplications();
  const paid = apps?.filter((a) => a.status === "paid").length ?? 0;
  return (
    <section style={{ paddingTop: 32, maxWidth: 820 }}>
      <div className="admin-tabs">
        <Link href="/admin">Рецепти</Link>
        <Link href="/admin/otzivi">Отзиви</Link>
        <Link href="/admin/produkti">Продукти</Link>
        <Link href="/admin/video">Видео</Link>
        <Link href="/admin/podaraci">Подаръци</Link>
        <Link href="/admin/imeyli">Имейли</Link>
        <Link href="/admin/kouching" className="on">
          Коучинг
        </Link>
      </div>
      <h1 className="display" style={{ fontSize: 34, marginBottom: 6 }}>
        Коучинг · {paid} от {COACHING.spots} места
      </h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 18, lineHeight: 1.6 }}>
        „Одобри“ праща имейл с два линка за плащане (месечно и 3 месеца).
        „Откажи“ праща любезен отказ. Платилите се появяват в „Клиенти“
        сами, след плащането. Страницата: <a href="/treniray">/treniray</a>
      </p>
      {apps === null ? (
        <div className="empty-state">
          Таблицата я няма още. Пусни <code>supabase/coaching.sql</code> в Supabase → SQL Editor.
        </div>
      ) : (
        <CoachingAdmin apps={apps} site={getSiteUrl()} />
      )}
    </section>
  );
}
