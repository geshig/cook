import Link from "next/link";
import Image from "next/image";
import { getTestimonials } from "@/lib/testimonials";
import { TestimonialForm, DeleteTestimonial } from "@/components/TestimonialForm";

export default async function AdminTestimonials() {
  const items = await getTestimonials();
  return (
    <section style={{ paddingTop: 32, maxWidth: 720 }}>
      <div className="admin-tabs">
        <Link href="/admin">Рецепти</Link>
        <Link href="/admin/otzivi" className="on">
          Отзиви
        </Link>
        <Link href="/admin/produkti">Продукти</Link>
        <Link href="/admin/video">Видео</Link>
        <Link href="/admin/podaraci">Подаръци</Link>
      </div>
      <h1 className="display" style={{ fontSize: 34, marginBottom: 6 }}>
        Отзиви ({items.length})
      </h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 18, lineHeight: 1.6 }}>
        Снимка, име и няколко думи. Показват се на лендинга в „Сготвено от вас“,
        най-новите първи. Снимката се смалява автоматично.
      </p>
      <TestimonialForm />
      <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
        {items.map((t) => (
          <div key={t.id} className="admin-review">
            <div className="admin-review-photo">
              <Image src={t.photo} alt="" fill sizes="80px" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <b>{t.name}</b> {t.recipe && <span style={{ color: "var(--sage)" }}>· {t.recipe}</span>}
              <p style={{ fontSize: 14, color: "var(--text-dim)" }}>„{t.text}“</p>
            </div>
            {t.id && <DeleteTestimonial id={t.id} />}
          </div>
        ))}
      </div>
    </section>
  );
}
