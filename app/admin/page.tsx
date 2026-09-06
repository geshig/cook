import Link from "next/link";
import { getAllRecipesForAdmin } from "@/lib/recipes";
import { DeleteRecipeButton } from "@/components/DeleteRecipeButton";

export default async function AdminPage() {
  const recipes = await getAllRecipesForAdmin();

  return (
    <section style={{ paddingTop: 40, maxWidth: 720 }}>
      <div className="eyebrow">Админ</div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 className="display" style={{ fontSize: 40, color: "var(--amber)" }}>
          Рецепти ({recipes.length})
        </h1>
        <Link className="btn" href="/admin/recipes/new">
          + Нова рецепта
        </Link>
      </div>

      {recipes.length === 0 && (
        <div className="empty-state">Още няма рецепти — добави първата.</div>
      )}

      <div className="account-card" style={{ padding: 0 }}>
        {recipes.map((r) => (
          <div
            key={r.id}
            className="account-row"
            style={{ padding: "14px 20px", alignItems: "center" }}
          >
            <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {r.isLocked && <span title="Заключена">🔒</span>}
              {r.title}
              <span style={{ color: "var(--sage)", fontSize: 12 }}>
                batch {r.batchNumber ?? "—"}
              </span>
            </span>
            <span style={{ display: "flex", gap: 10 }}>
              <Link
                className="btn btn-ghost"
                style={{ padding: "6px 16px", fontSize: 12 }}
                href={`/admin/recipes/${r.id}/edit`}
              >
                Редакция
              </Link>
              <DeleteRecipeButton id={r.id} title={r.title} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
