import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = {
  model: await readFile(new URL("../lib/integratedJourney.js", import.meta.url), "utf8"),
  page: await readFile(new URL("../app/parcours/page.jsx", import.meta.url), "utf8"),
  admin: await readFile(new URL("../app/admin/AdminIntegratedJourneys.jsx", import.meta.url), "utf8"),
  mount: await readFile(new URL("../app/admin/ContentCalibrationAdminMount.jsx", import.meta.url), "utf8"),
  layout: await readFile(new URL("../app/layout.jsx", import.meta.url), "utf8"),
  css: await readFile(new URL("../app/integratedJourney.css", import.meta.url), "utf8"),
  packageJson: await readFile(new URL("../package.json", import.meta.url), "utf8")
};

let checks = 0;
function ok(value, message) { checks += 1; assert.ok(value, message); }

for (const text of [
  "Parcours complet lecture → écriture",
  "Ce que je garde pour écrire",
  "Ouvrir ou reprendre la lecture",
  "Passer à la planification et à l’écriture",
  "Terminer et enregistrer le bilan minimal"
]) ok(files.page.includes(text), `l’interface élève contient « ${text} »`);

for (const text of [
  "Parcours lecture-écriture",
  "Associe un texte de lecture à une tâche d’écriture",
  "Intention de lecture",
  "Intention d’écriture",
  "Exporter le JSON du parcours",
  "Historique minimal"
]) ok(files.admin.includes(text), `l’admin contient « ${text} »`);

ok(files.mount.includes("AdminIntegratedJourneys"), "la vue admin est montée dans /admin");
ok(files.layout.includes('href="/parcours"'), "la navigation mène au parcours intégré");
ok(files.layout.includes('import "./integratedJourney.css"'), "les styles sont chargés globalement");
ok(files.css.includes("journeyTwoColumns"), "les styles du parcours sont présents");

for (const symbol of [
  "BUILT_IN_INTEGRATED_JOURNEYS",
  "validateIntegratedJourney",
  "buildReadingWorkForJourney",
  "buildJourneyNoteSheet",
  "buildWritingWorkForJourney",
  "synchronizeIntegratedJourney",
  "completeIntegratedJourney",
  "buildIntegratedJourneyHistoryExport",
  "validateIntegratedJourneyHistory"
]) ok(files.model.includes(`export function ${symbol}`) || files.model.includes(`export const ${symbol}`), `${symbol} est exporté`);

for (const key of [
  "lecture_integrated_journey_active_v1",
  "lecture_integrated_journey_notes_v1",
  "lecture_integrated_journey_history_v1",
  "lecture_integrated_journey_custom_v1"
]) ok(files.model.includes(key), `la clé locale ${key} est déclarée`);

for (const forbidden of [
  "containsStudentAnswers: false",
  "containsSelectedProofs: false",
  "containsWritingDrafts: false",
  "containsFinalTexts: false",
  "containsPersonalizedFeedback: false",
  "containsGrades: false"
]) ok(files.model.includes(forbidden), `la déclaration de confidentialité contient ${forbidden}`);

ok(files.page.includes("Aucune aide de contenu n’a été ajoutée"), "la simulation indique l’absence d’aide de contenu");
ok(files.page.includes("Aucune question-guide" ) === false, "l’interface n’ajoute pas de faux message de question-guide");
ok(files.page.includes("L’écriture sans lecture préparatoire demeure possible, mais elle est clairement signalée"), "l’écriture sans préparation est signalée sans être bloquée");
ok(files.admin.includes("niveau") && files.model.includes("ne correspond pas au niveau du texte"), "les incohérences de niveau sont contrôlées");

for (const source of [files.model, files.page, files.admin]) {
  ok(!/\bfetch\s*\(/.test(source), "aucun appel réseau fetch n’est ajouté");
  ok(!/firebase|supabase|prisma|mongodb|postgres|mysql/i.test(source), "aucune base de données n’est ajoutée");
}

const packageValue = JSON.parse(files.packageJson);
ok(packageValue.scripts["test:block15"], "le script test:block15 est déclaré");
ok(packageValue.scripts.prebuild.includes("test:block15"), "le bloc 15 est obligatoire avant build");

console.log(`Bloc 15 — audit d’intégration : ${checks} contrôles réussis.`);
