import Link from "next/link";
import { getProducts } from "@/lib/products";
import { ProductForm, ProductAdminItem } from "@/components/ProductForm";

export default async function AdminProducts() {
  const items = await getProducts();
  return (
    <section style={{ paddingTop: 32, maxWidth: 720 }}>
      <div className="admin-tabs">
        <Link href="/admin">Рецепти</Link>
        <Link href="/admin/otzivi">Отзиви</Link>
        <Link href="/admin/produkti" className="on">
          Продукти
        </Link>
        <Link href="/admin/video">Видео</Link>
        <Link href="/admin/podaraci">Подаръци</Link>
      </div>
      <h1 className="display" style={{ fontSize: 34, marginBottom: 6 }}>
        Продукти ({items.length})
      </h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 18, lineHeight: 1.6 }}>
        По-особените продукти от рецептите: какво са и откъде ги купуваш.
        Показват се на <Link href="/produkti">/produkti</Link>. Червеното
        означава, че още не си написал къде го купуваш.
      </p>
      <div style={{ display: "grid", gap: 12, marginBottom: 28 }}>
        {items.map((p) => (
          <ProductAdminItem key={p.id} item={p} />
        ))}
      </div>
      <h2 style={{ fontSize: 22, marginBottom: 10 }}>Нов продукт</h2>
      <ProductForm />
    </section>
  );
}
