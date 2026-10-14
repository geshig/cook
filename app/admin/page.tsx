import Link from "next/link";
import { getAllRecipesForAdmin } from "@/lib/recipes";
import { AdminRecipeList } from "@/components/AdminRecipeList";

export default async function AdminPage() {
  const recipes = await getAllRecipesForAdmin();

  return (
    <section style={{ paddingTop: 32, maxWidth: 720 }}>
      <div className="admin-tabs">
        <Link href="/admin" className="on">
          Рецепти
        </Link>
        <Link href="/admin/otzivi">Отзиви</Link>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 className="display" style={{ fontSize: 34 }}>
          Рецепти ({recipes.length})
        </h1>
        <Link className="btn" href="/admin/recipes/new">
          + Нова рецепта
        </Link>
      </div>

      {recipes.length === 0 && (
        <div className="empty-state">Още няма рецепти — добави първата.</div>
      )}
      <AdminRecipeList
        recipes={recipes.map((r) => ({ id: r.id, title: r.title, isLocked: r.isLocked, videoUrl: r.videoUrl }))}
      />
    </section>
  );
}
