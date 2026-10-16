import Link from "next/link";
import Image from "next/image";
import type { MenuRow } from "@/lib/menuMath";

/** The list of meals in a day (shared by the sample menus and the generator). */
export function MenuRows({ rows }: { rows: MenuRow[] }) {
  return (
    <ul className="menu-rows">
      {rows.map((r, i) => {
        const body = (
          <>
            <span className="menu-meal">{r.meal}</span>
            <span className={"menu-thumb" + (r.photoUrl ? "" : " plain")}>
              {r.photoUrl ? <Image src={r.photoUrl} alt="" fill sizes="52px" /> : <span aria-hidden="true">🍎</span>}
            </span>
            <span className="menu-name">
              {r.label}
              {r.note && <em> · {r.note}</em>}
            </span>
            <span className="menu-kcal">
              {r.kcal} kcal · {r.protein} g протеин
            </span>
          </>
        );
        return (
          <li key={i}>
            {r.href ? (
              <Link href={r.href} className="menu-row">
                {body}
              </Link>
            ) : (
              <div className="menu-row">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
