"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteRecipeButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleClick() {
    if (!confirm(`Изтрий "${title}"? Не може да се отмени.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/recipes/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setDeleting(false);
      alert("Грешка при изтриване.");
    }
  }

  return (
    <button
      className="btn btn-ghost"
      style={{ padding: "6px 16px", fontSize: 12, color: "var(--rust)" }}
      onClick={handleClick}
      disabled={deleting}
    >
      {deleting ? "…" : "Изтрий"}
    </button>
  );
}
