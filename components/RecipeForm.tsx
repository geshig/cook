"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { RecipeCard, Tag } from "@/lib/types";
import { formatIngredients, formatSteps, parseIngredients, parseSteps } from "@/lib/recipeText";

const CATEGORY_LABELS: Record<Tag["category"], string> = {
  съставка: "Осн. съставка",
  хранене: "Тип хранене",
  десерт: "Десерт — вид",
  профил: "Цел / профил",
  ограничение: "Диетични ограничения",
  повод: "Повод / контекст",
  скорост: "Скорост / трудност",
  метод: "Метод на готвене",
};

type Props = {
  tags: Tag[];
  recipeId?: number;
  initial?: RecipeCard & { tagIds: number[] };
};

function numOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function RecipeForm({ tags, recipeId, initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [timeMinutes, setTimeMinutes] = useState(initial?.timeMinutes?.toString() ?? "");
  const [servings, setServings] = useState(initial?.servings?.toString() ?? "");
  const [kcal, setKcal] = useState(initial?.kcal?.toString() ?? "");
  const [proteinG, setProteinG] = useState(initial?.proteinG?.toString() ?? "");
  const [carbsG, setCarbsG] = useState(initial?.carbsG?.toString() ?? "");
  const [fatG, setFatG] = useState(initial?.fatG?.toString() ?? "");
  const [ingredients, setIngredients] = useState(
    parseIngredients(initial?.ingredients ?? null).join("\n")
  );
  const [steps, setSteps] = useState(parseSteps(initial?.steps ?? null).join("\n"));
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [isLocked, setIsLocked] = useState(initial?.isLocked ?? false);
  const [batchNumber, setBatchNumber] = useState(initial?.batchNumber?.toString() ?? "1");
  const [tagIds, setTagIds] = useState<Set<number>>(new Set(initial?.tagIds ?? []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byCategory = new Map<Tag["category"], Tag[]>();
  for (const tag of tags) {
    if (!byCategory.has(tag.category)) byCategory.set(tag.category, []);
    byCategory.get(tag.category)!.push(tag);
  }

  function toggleTag(id: number) {
    setTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title,
      timeMinutes: numOrNull(timeMinutes),
      servings: numOrNull(servings),
      kcal: numOrNull(kcal),
      proteinG: numOrNull(proteinG),
      carbsG: numOrNull(carbsG),
      fatG: numOrNull(fatG),
      ingredients: formatIngredients(ingredients.split("\n")) || null,
      steps: formatSteps(steps.split("\n")) || null,
      videoUrl: videoUrl.trim() || null,
      photoUrl: photoUrl.trim() || null,
      isLocked,
      batchNumber: numOrNull(batchNumber),
      tagIds: Array.from(tagIds),
    };

    try {
      const res = await fetch(
        recipeId ? `/api/admin/recipes/${recipeId}` : "/api/admin/recipes",
        {
          method: recipeId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Грешка при запис");
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Грешка при запис");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Field label="Заглавие">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <Field label="Време (мин)">
          <input
            type="number"
            value={timeMinutes}
            onChange={(e) => setTimeMinutes(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Порции">
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Kcal/порция">
          <input
            type="number"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Batch #">
          <input
            type="number"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <Field label="Протеин (г)">
          <input
            type="number"
            value={proteinG}
            onChange={(e) => setProteinG(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Въглехидрати (г)">
          <input
            type="number"
            value={carbsG}
            onChange={(e) => setCarbsG(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Мазнини (г)">
          <input
            type="number"
            value={fatG}
            onChange={(e) => setFatG(e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>

      <Field label="Продукти (един ред = един продукт)">
        <textarea
          rows={5}
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          style={textareaStyle}
          placeholder={"2 пилешки гърди\n2 сладки картофа\nзехтин"}
        />
      </Field>

      <Field label="Стъпки (един ред = една стъпка, номерирането е автоматично)">
        <textarea
          rows={6}
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          style={textareaStyle}
          placeholder={"Наряжи картофите на кубчета...\nПека на 200° за 25 мин..."}
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Видео линк">
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            style={inputStyle}
            placeholder="https://..."
          />
        </Field>
        <Field label="Снимка линк">
          <input
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            style={inputStyle}
            placeholder="https://..."
          />
        </Field>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
        <input
          type="checkbox"
          checked={isLocked}
          onChange={(e) => setIsLocked(e.target.checked)}
        />
        Заключена (само за абонати)
      </label>

      <div>
        <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--sage)", marginBottom: 10 }}>
          Тагове
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Array.from(byCategory.entries()).map(([category, categoryTags]) => (
            <div key={category}>
              <div style={{ fontSize: 12, color: "var(--sage)", marginBottom: 6 }}>
                {CATEGORY_LABELS[category]}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {categoryTags.map((tag) => (
                  <div
                    key={tag.id}
                    className={"tag" + (tagIds.has(tag.id) ? " active" : "")}
                    style={{ transform: "none" }}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <div style={{ color: "var(--rust)", fontSize: 13 }}>{error}</div>}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Запазване…" : recipeId ? "Запази промените" : "Създай рецепта"}
        </button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 14,
  fontFamily: "inherit",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  lineHeight: 1.6,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
      <span style={{ color: "var(--sage)" }}>{label}</span>
      {children}
    </label>
  );
}
