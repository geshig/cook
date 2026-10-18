"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  type ShoppingEntry,
  mergeShopping,
  onShoppingChange,
  readMergedChecked,
  readShopping,
  shoppingAsText,
  writeMergedChecked,
  writeShopping,
} from "@/lib/shopping";

export function ShoppingList() {
  const [list, setList] = useState<ShoppingEntry[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [merged, setMerged] = useState(false);
  const [mergedChecked, setMergedChecked] = useState<string[]>([]);

  useEffect(() => {
    const load = () => {
      setList(readShopping());
      setMergedChecked(readMergedChecked());
    };
    load();
    return onShoppingChange(load);
  }, []);

  if (list === null) return null;

  if (list.length === 0) {
    return (
      <div className="shop-empty">
        <p>Списъкът е празен. Отвори рецепта и натисни „🛒 В списъка“: продуктите влизат тук с избраните порции.</p>
        <Link className="btn" href="/recipes">
          Към рецептите
        </Link>
      </div>
    );
  }

  const total = list.reduce((n, e) => n + e.lines.filter((l) => !l.group).length, 0);
  const done = list.reduce((n, e) => n + e.checked.length, 0);

  function update(next: ShoppingEntry[]) {
    setList(next);
    writeShopping(next);
  }

  function toggle(recipeId: number, i: number) {
    update(
      list!.map((e) =>
        e.recipeId !== recipeId
          ? e
          : { ...e, checked: e.checked.includes(i) ? e.checked.filter((x) => x !== i) : [...e.checked, i] }
      )
    );
  }

  const mergedLines = merged ? mergeShopping(list) : [];

  function toggleMerged(key: string) {
    const next = mergedChecked.includes(key) ? mergedChecked.filter((k) => k !== key) : [...mergedChecked, key];
    setMergedChecked(next);
    writeMergedChecked(next);
  }

  async function share() {
    const body = merged
      ? mergedLines.map((l) => `${mergedChecked.includes(l.key) ? "✓" : "•"} ${l.amount ? l.amount + " " : ""}${l.name}`).join("\n")
      : shoppingAsText(list!);
    const text = "Списък за пазаруване\n\n" + body;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Списък за пазаруване", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setNote("Копирано. Постави го във Viber или бележките.");
    } catch {
      // Share sheet dismissed.
    }
  }

  return (
    <>
      <div className="shop-bar">
        <span className="count">
          Взети {done} от {total}
        </span>
        <div className="shop-tools">
          <button type="button" className="chip-btn" onClick={share}>
            Сподели
          </button>
          <button
            type="button"
            className="link-btn"
            onClick={() => update(list.map((e) => ({ ...e, checked: [] })))}
          >
            Махни отметките
          </button>
        </div>
      </div>
      {note && <p className="shop-note">{note}</p>}

      {list.length > 1 && (
        <div className="seg" role="group" aria-label="Изглед на списъка">
          <button type="button" aria-pressed={!merged} className={!merged ? "on" : ""} onClick={() => setMerged(false)}>
            По рецепти
          </button>
          <button type="button" aria-pressed={merged} className={merged ? "on" : ""} onClick={() => setMerged(true)}>
            Общ списък
          </button>
        </div>
      )}

      {merged && (
        <div className="shop-recipe">
          <ul className="shop-lines">
            {mergedLines.map((l) => (
              <li key={l.key}>
                <label className={mergedChecked.includes(l.key) ? "got" : undefined}>
                  <input type="checkbox" checked={mergedChecked.includes(l.key)} onChange={() => toggleMerged(l.key)} />
                  {l.amount && <span className="ing-amount">{l.amount}</span>}
                  <span>
                    {l.name}
                    {l.from.length > 1 && <small className="shop-from"> · за {l.from.length} рецепти</small>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!merged && list.map((e) => (
        <div key={e.recipeId} className="shop-recipe">
          <div className="shop-head">
            {e.recipeId > 0 ? (
              <Link href={`/recipes?r=${e.recipeId}`} className="shop-title">
                {e.title}
              </Link>
            ) : (
              <span className="shop-title">{e.title}</span>
            )}
            {e.recipeId > 0 && (
              <span className="shop-portions">
                {e.portions} {e.portions === 1 ? "порция" : "порции"}
              </span>
            )}
            <button
              type="button"
              className="link-btn"
              onClick={() => update(list.filter((x) => x.recipeId !== e.recipeId))}
              aria-label={`Махни ${e.title} от списъка`}
            >
              Махни
            </button>
          </div>
          <ul className="shop-lines">
            {e.lines.map((l, i) =>
              l.group ? (
                <li key={i} className="shop-group">
                  {l.text}
                </li>
              ) : (
                <li key={i}>
                  <label className={e.checked.includes(i) ? "got" : undefined}>
                    <input
                      type="checkbox"
                      checked={e.checked.includes(i)}
                      onChange={() => toggle(e.recipeId, i)}
                    />
                    {l.amount && <span className="ing-amount">{l.amount}</span>}
                    <span>{l.text}</span>
                  </label>
                </li>
              )
            )}
          </ul>
        </div>
      ))}

      <button
        type="button"
        className="close"
        onClick={() => {
          update([]);
          setMergedChecked([]);
          writeMergedChecked([]);
          setNote(null);
        }}
      >
        Изчисти целия списък
      </button>
    </>
  );
}
