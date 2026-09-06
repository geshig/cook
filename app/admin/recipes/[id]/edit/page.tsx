import { notFound } from "next/navigation";
import { getAllTags, getRecipeForAdmin } from "@/lib/recipes";
import { RecipeForm } from "@/components/RecipeForm";

export default async function EditRecipePage(
  props: PageProps<"/admin/recipes/[id]/edit">
) {
  const { id } = await props.params;
  const recipeId = Number(id);
  if (Number.isNaN(recipeId)) notFound();

  const [tags, recipe] = await Promise.all([
    getAllTags(),
    getRecipeForAdmin(recipeId),
  ]);

  if (!recipe) notFound();

  return (
    <section style={{ paddingTop: 40, maxWidth: 640 }}>
      <div className="eyebrow">Админ</div>
      <h1 className="display" style={{ fontSize: 40, color: "var(--amber)", marginBottom: 24 }}>
        Редакция
      </h1>
      <RecipeForm tags={tags} recipeId={recipe.id} initial={recipe} />
    </section>
  );
}
