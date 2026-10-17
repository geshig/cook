import Link from "next/link";
import { listManualGifts, giftLink } from "@/lib/gifts";
import { GiftMaker } from "@/components/GiftMaker";

export default async function AdminGifts() {
  const gifts = await listManualGifts();
  return (
    <section style={{ paddingTop: 32, maxWidth: 820 }}>
      <div className="admin-tabs">
        <Link href="/admin">Рецепти</Link>
        <Link href="/admin/otzivi">Отзиви</Link>
        <Link href="/admin/produkti">Продукти</Link>
        <Link href="/admin/video">Видео</Link>
        <Link href="/admin/podaraci" className="on">
          Подаръци
        </Link>
      </div>
      <h1 className="display" style={{ fontSize: 34, marginBottom: 6 }}>
        Безплатен достъп
      </h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 18, lineHeight: 1.6 }}>
        Пиши имейлите на хората, на които даваш книгата. Всеки получава свой
        линк: отваря го, влиза със своя имейл и получава книгата и 3 месеца
        нови рецепти. Всеки линк важи само веднъж.
      </p>
      <GiftMaker />

      <h2 style={{ fontSize: 22, margin: "34px 0 10px" }}>Дадени досега ({gifts.length})</h2>
      {gifts.length === 0 ? (
        <p style={{ color: "var(--text-dim)" }}>Още няма.</p>
      ) : (
        <div className="gift-table">
          {gifts.map((g) => (
            <div key={g.code} className="gift-made-row">
              <span>{g.note}</span>
              <code>{giftLink(g.code).replace(/^https?:\/\//, "")}</code>
              <em className={g.redeemedBy ? "taken" : "free"}>
                {g.redeemedBy ? `✓ взет от ${g.redeemedBy}` : "чака"}
              </em>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
