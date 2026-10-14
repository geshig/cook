"use client";

import { useState } from "react";
import Link from "next/link";
import { DeleteRecipeButton } from "@/components/DeleteRecipeButton";

type Row = { id: number; title: string; isLocked: boolean; videoUrl: string | null };

export function AdminRecipeList({ recipes }: { recipes: Row[] }) {
  const [q, setQ] = useState("");
  const [noVideo, setNoVideo] = useState(false);
  const list = recipes.filter(
    (r) => r.title.toLowerCase().includes(q.trim().toLowerCase()) && (!noVideo || !r.videoUrl)
  );
  const withVideo = recipes.filter((r) => r.videoUrl).length;

  return (
    <>
      <div className="search" style={{ margin: "0 0 10px" }}>
        <span aria-hidden="true">🔍</span>
        <input id="admin-search" type="search" placeholder="Намери рецепта…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Намери рецепта" />
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--text-dim)", marginBottom: 12 }}>
        <input type="checkbox" checked={noVideo} onChange={(e) => setNoVideo(e.target.checked)} />
        Само без видео ({recipes.length - withVideo} от {recipes.length})
      </label>
      <div className="account-card" style={{ padding: 0 }}>
        {list.map((r) => (
          <div key={r.id} className="account-row" style={{ padding: "12px 16px", alignItems: "center", gap: 10 }}>
            <span style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
              {r.isLocked && <span title="Само за абонати">🔒</span>}
              <span title={r.videoUrl ? "Има видео" : "Няма видео"}>{r.videoUrl ? "🎬" : "·"}</span>
              <span style={{ minWidth: 0 }}>{r.title}</span>
            </span>
            <span style={{ display: "flex", gap: 8, flex: "0 0 auto" }}>
              <Link className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }} href={`/admin/recipes/${r.id}/edit`}>
                Редакция
              </Link>
              <DeleteRecipeButton id={r.id} title={r.title} />
            </span>
          </div>
        ))}
        {list.length === 0 && <div className="empty-state">Нищо не намерих.</div>}
      </div>
    </>
  );
}
