import assert from "node:assert/strict";
import fs from "node:fs";

const packageJson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const config = fs.readFileSync(new URL("../playwright.config.mjs", import.meta.url), "utf8");
const browserTest = fs.readFileSync(new URL("./browser/block17-browser-accessibility.spec.mjs", import.meta.url), "utf8");
const workflow = fs.readFileSync(new URL("../.github/workflows/block17-browser-recipe.yml", import.meta.url), "utf8");
const layout = fs.readFileSync(new URL("../app/layout.jsx", import.meta.url), "utf8");
const accessibleLabels = fs.readFileSync(new URL("../app/AccessibleFormLabels.jsx", import.meta.url), "utf8");
const adminLoginRoute = fs.readFileSync(new URL("../app/api/admin/login/route.js", import.meta.url), "utf8");

let checks = 0;
function ok(value, message) {
  checks += 1;
  assert.ok(value, message);
}

ok(packageJson.devDependencies?.["@playwright/test"], "Playwright est une dépendance de développement explicite");
ok(packageJson.scripts?.["test:block17"], "le script navigateur du bloc 17 est déclaré");
ok(packageJson.scripts?.["test:block17:static"], "l’audit statique du bloc 17 est déclaré");
ok(packageJson.scripts.prebuild.includes("test:block17:static"), "l’intégration du bloc 17 reste vérifiée avant compilation");
ok(!packageJson.scripts.prebuild.includes("test:block17 &&"), "les navigateurs ne sont pas téléchargés dans le prébuild Vercel");

for (const route of ["/", "/ecriture", "/parcours", "/progression", "/guide", "/admin/login"]) {
  ok(browserTest.includes(`path: "${route}"`), `la route ${route} fait partie de la recette`);
}

for (const subject of [
  "navigation principale fonctionne entièrement au clavier",
  "choix principaux peuvent être activés au clavier",
  "admin demeure protégé",
  "sauvegarde administrative reste locale",
  "lecture en simulation masque les aides",
  "écriture en simulation affiche seulement les cinq autoévaluations",
  "guide ne crée aucun lien vers une route inexistante",
  "routes principales restent utilisables sur un écran mobile"
]) {
  ok(browserTest.includes(subject), `le scénario « ${subject} » est conservé`);
}

ok(browserTest.includes("expectFormLabels"), "les champs visibles sont vérifiés pour leur libellé accessible");
ok(browserTest.includes("expectInteractiveNames"), "les boutons et liens sont vérifiés pour leur nom accessible");
ok(browserTest.includes("expectNoHorizontalOverflow"), "le débordement horizontal est vérifié");
ok(browserTest.includes("pageerror") && browserTest.includes("console.error"), "les erreurs d’exécution du navigateur sont capturées");
ok(browserTest.includes("lecture_local_exercise_backups_v1"), "la sauvegarde locale réelle est contrôlée");
ok(browserTest.includes("fetch\", \"xhr"), "les appels de données inattendus sont surveillés");
ok(browserTest.includes("navigation.getByRole"), "les liens de navigation sont vérifiés dans leur région propre");
ok(browserTest.includes("/^Simulation\\b/i"), "le nom accessible complet du mode simulation est accepté");

ok(layout.includes("AccessibleFormLabels"), "le correctif d’association des libellés est monté globalement");
ok(accessibleLabels.includes('label:not([for])'), "seuls les libellés sans association sont traités");
ok(accessibleLabels.includes('label.querySelector("input, select, textarea")'), "les libellés qui enveloppent déjà un champ sont préservés");
ok(accessibleLabels.includes("label.htmlFor = control.id"), "une association sémantique for/id est créée");
ok(accessibleLabels.includes("MutationObserver"), "les formulaires rendus dynamiquement sont aussi couverts");

ok(config.includes("Desktop Chrome"), "la recette utilise Chromium avec un profil de navigateur réel");
ok(config.includes("trace: \"retain-on-failure\""), "les traces sont conservées en cas d’échec");
ok(config.includes("screenshot: \"only-on-failure\""), "les captures d’écran sont conservées en cas d’échec");
ok(config.includes("video: \"retain-on-failure\""), "les vidéos sont conservées en cas d’échec");
ok(config.includes("ADMIN_PASSWORD") && config.includes("ADMIN_SESSION_SECRET"), "l’admin est configuré uniquement pour la recette locale de CI");
ok(config.includes('ADMIN_INSECURE_COOKIE_FOR_LOCAL_TESTS: "true"'), "la dérogation de cookie est limitée au serveur Playwright local");
ok(adminLoginRoute.includes('process.env.ADMIN_INSECURE_COOKIE_FOR_LOCAL_TESTS === "true"'), "la dérogation exige une variable explicite");
ok(adminLoginRoute.includes('process.env.NODE_ENV === "production" && !localBrowserRecipe'), "le cookie reste sécurisé en production normale");

ok(workflow.includes("npx playwright install --with-deps chromium"), "Chromium et ses dépendances sont installés dans le workflow");
ok(workflow.includes("npm run build"), "la compilation complète précède la recette navigateur");
ok(workflow.includes("npm run test:block17"), "la recette réelle est exécutée dans GitHub Actions");
ok(workflow.includes("playwright-report"), "le rapport de diagnostic est conservé comme artefact");
ok(workflow.includes("if: always()"), "le rapport est téléversé même après un échec");
ok(!workflow.includes("curl ") && !workflow.includes("wget "), "le workflow n’ajoute aucun transfert applicatif externe");

console.log(`Bloc 17 — intégration de la recette navigateur : ${checks} contrôles réussis.`);
