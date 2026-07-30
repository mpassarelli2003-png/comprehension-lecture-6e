import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isAdminConfigured, verifyAdminToken } from "../../../lib/adminAuth";

export const dynamic = "force-dynamic";

export default function AdminLoginPage({ searchParams }) {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (verifyAdminToken(token)) redirect("/admin");

  const error = searchParams?.error;
  const configured = isAdminConfigured();

  return (
    <main className="page narrowPage">
      <section className="card adminLoginCard">
        <p className="eyebrow">Administration</p>
        <h1>Accès protégé</h1>
        <p>Entre le mot de passe administrateur pour gérer les niveaux, les modes et les contenus.</p>

        {!configured && (
          <div className="statusBox warningBox" role="alert">
            <b>Configuration requise.</b>
            <p>Ajoute les variables ADMIN_PASSWORD et ADMIN_SESSION_SECRET dans les variables d’environnement du déploiement.</p>
          </div>
        )}

        {error === "invalid" && (
          <p className="statusBox errorBox" role="alert">Mot de passe incorrect.</p>
        )}
        {error === "config" && (
          <p className="statusBox errorBox" role="alert">L’espace admin n’est pas encore configuré sur le serveur.</p>
        )}

        <form action="/api/admin/login" method="post">
          <label htmlFor="password"><b>Mot de passe administrateur</b></label>
          <input id="password" name="password" type="password" autoComplete="current-password" required disabled={!configured} />
          <button className="violet primaryButton" type="submit" disabled={!configured}>Ouvrir l’espace admin</button>
        </form>
        <a className="textLink" href="/">Retour à l’application</a>
      </section>
    </main>
  );
}
