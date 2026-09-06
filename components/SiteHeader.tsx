import Link from "next/link";
import { getAccess, isAdmin } from "@/lib/access";

export async function SiteHeader() {
  const access = await getAccess();

  return (
    <div className="site-header">
      <Link href="/" className="display logo">
        КУХНЯТА
      </Link>
      <nav>
        {access.email ? (
          <>
            {isAdmin(access) && <Link href="/admin">Админ</Link>}
            <Link href="/account">{access.email}</Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  font: "inherit",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Изход
              </button>
            </form>
          </>
        ) : (
          <Link href="/login">Вход</Link>
        )}
      </nav>
    </div>
  );
}
