export type TagCategory =
  | "съставка"
  | "хранене"
  | "десерт"
  | "профил"
  | "ограничение"
  | "повод"
  | "скорост"
  | "метод";

export type Tag = {
  id: number;
  name: string;
  category: TagCategory;
};

/** Recipe shape sent to the client. Locked fields are `null` until the
 * viewer's access has been verified server-side — see lib/recipes.ts. */
export type RecipeCard = {
  id: number;
  title: string;
  timeMinutes: number | null;
  servings: number | null;
  kcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  photoUrl: string | null;
  isLocked: boolean;
  batchNumber: number | null;
  tags: string[];
  /** Populated only when the recipe is unlocked for the current viewer. */
  ingredients: string | null;
  steps: string | null;
  videoUrl: string | null;
};

export type Access = {
  email: string | null;
  purchasedBook: boolean;
  subscriptionActive: boolean;
};
