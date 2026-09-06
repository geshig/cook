import { getAllTags } from "@/lib/recipes";
import { RecipeForm } from "@/components/RecipeForm";

export default async function NewRecipePage() {
  const tags = await getAllTags();

  return (
    <section style={{ paddingTop: 40, maxWidth: 640 }}>
      <div className="eyebrow">Админ</div>
      <h1 className="display" style={{ fontSize: 40, color: "var(--amber)", marginBottom: 24 }}>
        Нова рецепта
      </h1>
      <RecipeForm tags={tags} />
    </section>
  );
}
