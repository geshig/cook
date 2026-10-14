import Link from "next/link";
import { getAccess, isAdmin } from "@/lib/access";

export async function SiteHeader() {
  const access = await getAccess();

  return (
    <div className="site-header">
      <Link href="/" className="display logo">
        КУХНЯТА НА ГЕША
      </Link>
      <nav aria-label="Основна навигация">
        {access.email ? (
          <>
            {isAdmin(access) && <Link href="/admin">Админ</Link>}
            <Link href="/recipes">Рецепти</Link>
            <Link href="/menyuta">Менюта</Link>
            <Link href="/produkti">Продукти</Link>
            <Link href="/spisak">Списък</Link>
            <Link href="/account">Профил</Link>
          </>
        ) : (
          <>
            <Link href="/menyuta">Менюта</Link>
            <Link href="/produkti">Продукти</Link>
            <Link href="/login">Вход</Link>
          </>
        )}
      </nav>
    </div>
  );
}
