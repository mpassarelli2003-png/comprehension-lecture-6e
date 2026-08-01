import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

let checks = 0;
function ok(value, message) { checks += 1; assert.ok(value, message); }

const historySource = await readFile(new URL("../lib/writingRevisionHistory.js", import.meta.url), "utf8");
const engineSource = await readFile(new URL("../lib/writingMinistryFeedback.js", import.meta.url), "utf8");
const panelSource = await readFile(new URL("../app/ecriture/WritingMinistryFeedbackPanel.jsx", import.meta.url), "utf8");
const writingPageSource = await readFile(new URL("../app/ecriture/page.jsx", import.meta.url), "utf8");
const progressionPageSource = await readFile(new URL("../app/progression/page.jsx", import.meta.url), "utf8");
const studentSummarySource = await readFile(new URL("../app/progression/WritingRevisionHistorySummary.jsx", import.meta.url), "utf8");
const adminSource = await readFile(new URL("../app/admin/AdminWritingRevisionHistory.jsx", import.meta.url), "utf8");
const adminMountSource = await readFile(new URL("../app/admin/ContentCalibrationAdminMount.jsx", import.meta.url), "utf8");
const layoutSource = await readFile(new URL("../app/layout.jsx", import.meta.url), "utf8");
const packageSource = await readFile(new URL("../package.json", import.meta.url), "utf8");

// Le moteur de rétroaction du bloc 13 reste indépendant et inchangé dans sa responsabilité.
ok(!engineSource.includes("writingRevisionHistory"), "le moteur de rétroaction n’importe pas l’historique");
ok(!engineSource.includes("localStorage"), "le moteur de rétroaction ne stocke rien");
ok(!engineSource.includes("fetch("), "le moteur de rétroaction n’effectue aucun appel distant");

// Enregistrement sur les actions réelles.
ok(panelSource.includes("recordWritingAnalysisEvent"), "le lancement de l’analyse crée un événement minimal");
ok(panelSource.includes("recordWritingSelfAssessmentEvent"), "la cinquième case crée l’événement d’autoévaluation complète");
ok(panelSource.includes("!wasComplete && isComplete"), "l’autoévaluation est enregistrée seulement au passage à cinq cases");
ok(panelSource.includes("setFeedback(nextFeedback)"), "la rétroaction visible reste gérée séparément de l’historique");
ok(!panelSource.includes("localStorage"), "le panneau ne sérialise pas lui-même le brouillon ou la rétroaction");
ok(writingPageSource.includes("recordWritingSimulationEvent"), "le passage réel en simulation crée un événement");
ok(writingPageSource.includes("if (nextMode)"), "seule l’entrée en simulation est enregistrée");

// Le schéma reste fermé et local.
ok(historySource.includes('WRITING_REVISION_HISTORY_STORAGE_KEY = "lecture_writing_revision_history_v1"'), "une clé locale dédiée est utilisée");
ok(historySource.includes("MAX_WRITING_REVISION_EVENTS = 300"), "la limite de 300 événements est explicite");
ok(historySource.includes("WRITING_REVISION_DEDUPE_MS = 5000"), "le dédoublonnage rapproché est explicite");
ok(historySource.includes("normalizeWritingRevisionEvent"), "chaque événement passe par un normaliseur fermé");
ok(historySource.includes("sanitizeWritingRevisionHistory"), "la lecture locale assainit les données");
ok(historySource.includes("buildWritingRevisionHistoryExport"), "l’export JSON utilise un constructeur dédié");
ok(historySource.includes("clearWritingRevisionHistory"), "l’effacement local est disponible");
ok(!historySource.includes("fetch("), "l’historique ne fait aucun appel réseau");
ok(!historySource.includes("indexedDB"), "aucune base IndexedDB n’est créée");
ok(!historySource.includes("firebase"), "aucune base distante Firebase n’est ajoutée");
ok(!historySource.includes("supabase"), "aucune base distante Supabase n’est ajoutée");

// Interface élève.
ok(progressionPageSource.includes("WritingRevisionHistorySummary"), "la page de progression monte le résumé d’écriture");
ok(studentSummarySource.includes("Historique de révision d’écriture"), "le titre demandé apparaît côté élève");
ok(studentSummarySource.includes("Analyses lancées"), "le nombre d’analyses est affiché");
ok(studentSummarySource.includes("Simulations vérifiées"), "le nombre de simulations vérifiées est affiché");
ok(studentSummarySource.includes("Critère le plus travaillé"), "le critère fréquent est affiché");
ok(studentSummarySource.includes("Prochaine priorité générale"), "la prochaine priorité générale est affichée");
ok(studentSummarySource.includes("Effacer l’historique d’écriture"), "l’élève peut effacer uniquement cet historique");
ok(!studentSummarySource.includes("draft"), "la vue élève ne demande jamais un brouillon");
ok(!studentSummarySource.includes("finalText"), "la vue élève ne demande jamais une version finale");

// Interface admin.
ok(adminMountSource.includes("AdminWritingRevisionHistory"), "la section admin est montée dans /admin");
ok(adminSource.includes("Historique local d’écriture"), "le titre demandé apparaît côté admin");
ok(adminSource.includes("Répartition par critère"), "la répartition par critère est affichée");
ok(adminSource.includes("Entraînement et simulation"), "la répartition par mode est affichée");
ok(adminSource.includes("Types de textes travaillés"), "les types de textes sont affichés");
ok(adminSource.includes("Exporter le JSON"), "l’export JSON est accessible à l’admin");
ok(adminSource.includes("Effacer l’historique"), "l’effacement est accessible à l’admin");
ok(!adminSource.includes("fetch("), "la vue admin n’envoie aucune donnée à un serveur");

// Styles et prébuild.
ok(layoutSource.includes('import "./writingRevisionHistory.css"'), "les styles du bloc 14 sont chargés");
ok(packageSource.includes('"test:block14"'), "une suite de tests propre au bloc 14 est déclarée");
ok(packageSource.includes("npm run test:block13b && npm run test:block14"), "le bloc 14 s’exécute après tous les tests précédents");

console.log(`Bloc 14 — audit d’intégration : ${checks} contrôles réussis.`);
