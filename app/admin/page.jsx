import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "../../lib/adminAuth";
import AdminWorkspace from "./AdminWorkspace";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifyAdminToken(token)) redirect("/admin/login");

  return (
    <main className="page">
      <div className="adminHeader">
        <div>
          <p className="eyebrow">Administration protégée</p>
          <h1>Tableau de bord</h1>
        </div>
        <form action="/api/admin/logout" method="post">
          <button type="submit">Se déconnecter</button>
        </form>
      </div>
      <AdminWorkspace />
    </main>
  );
}
