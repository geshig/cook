import Link from "next/link";
import { getAccess, isAdmin } from "@/lib/access";
import { SiteHeader } from "@/components/SiteHeader";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const access = await getAccess();

  if (!access.email) {
    return (
      <>
        <SiteHeader />
        <div className="gate">
          <div className="lock-big">🔒</div>
          <h1 className="display">Само за админи</h1>
          <p>Влез с имейла, който е в ADMIN_EMAILS, за да управляваш рецептите.</p>
          <Link className="btn" href="/login">
            Вход
          </Link>
        </div>
      </>
    );
  }

  if (!isAdmin(access)) {
    return (
      <>
        <SiteHeader />
        <div className="gate">
          <div className="lock-big">🔒</div>
          <h1 className="display">Няма достъп</h1>
          <p>{access.email} не е в списъка с администратори.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
