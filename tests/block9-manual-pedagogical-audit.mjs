import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../lib/manualPedagogicalAudit.js", import.meta.url), "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const audit = await import(moduleUrl);

const {
  MANUAL_AUDIT_CRITERIA,
  MANUAL_AUDIT_STATUSES,
  MANUAL_CRITERION_VALUES,
  buildManualAuditExport,
  criterionCounts,
  createEmptyManualAudit,
  manualAuditWarnings,
  normalizeManualAuditStore,
  sanitizeManualAuditEntry,
  summarizeManualAudits
} = audit;

let checks = 0;
function equal(actual, expected, message) {
  checks += 1;
  assert.equal(actual, expected, message);
}
function ok(value, message) {
  checks += 1;
  assert.ok(value, message);
}

const criteriaCounts = Object.fromEntries(
  Object.entries(MANUAL_AUDIT_CRITERIA).map(([id, group]) => [id, Object.keys(group.items).length])
);
equal(criteriaCounts.text, 8, "huit critères pour le texte");
equal(criteriaCounts.questions, 7, "sept critères pour les questions");
equal(criteriaCounts.simulation, 4, "quatre critères pour la simulation");
equal(Object.values(criteriaCounts).reduce((sum, value) => sum + value, 0), 19, "dix-neuf critères au total");
equal(Object.keys(MANUAL_AUDIT_STATUSES).length, 4, "quatre statuts manuels");
equal(Object.keys(MANUAL_CRITERION_VALUES).length, 3, "trois états par critère");

const exercises = [
  { id: "texte-a", title: "Texte A", level: "6e année", textType: "narratif", category: "texte littéraire", intention: "Lire pour comprendre.", text: "Contenu intégral à ne pas exporter", questions: [{ expectedAnswer: "Réponse privée" }] },
  { id: "texte-b", title: "Texte B", level: "Secondaire 1", textType: "informatif", category: "texte explicatif", intention: "Lire pour expliquer." }
];

const empty = createEmptyManualAudit(exercises[0]);
equal(empty.status, "pending");
equal(empty.exerciseId, "texte-a");
const emptyCounts = criterionCounts(empty);
equal(emptyCounts.total, 19);
equal(emptyCounts.pending, 19);
equal(emptyCounts.pass, 0);

const sanitized = sanitizeManualAuditEntry({
  status: "inconnu",
  reviewer: "  AB  ",
  notes: "  Une note  ",
  criteria: {
    text: { levelAppropriate: "pass", lengthAcceptable: "valeur-invalide" },
    questions: { clearWording: "review" }
  }
}, exercises[0]);
equal(sanitized.status, "pending", "statut inconnu ramené à valider");
equal(sanitized.reviewer, "AB");
equal(sanitized.notes, "Une note");
equal(sanitized.criteria.text.levelAppropriate, "pass");
equal(sanitized.criteria.text.lengthAcceptable, "pending");
equal(sanitized.criteria.questions.clearWording, "review");

const store = normalizeManualAuditStore({
  audits: {
    "texte-a": {
      status: "ready",
      criteria: {
        text: { levelAppropriate: "pass" },
        questions: { clearWording: "review" }
      }
    }
  }
}, exercises);
equal(Object.keys(store.audits).length, 2, "un audit par exercice");
equal(store.audits["texte-a"].status, "ready");
equal(store.audits["texte-b"].status, "pending");

const warnings = manualAuditWarnings(store.audits["texte-a"]);
ok(warnings.some((item) => item.includes("non évalués")), "prêt incomplet signalé");
ok(warnings.some((item) => item.includes("À revoir")), "prêt avec réserve signalé");

const blocked = { ...store.audits["texte-b"], status: "blocked", notes: "" };
ok(manualAuditWarnings(blocked).some((item) => item.includes("blocage")), "blocage sans note signalé");

const summary = summarizeManualAudits(store, exercises);
equal(summary.totalExercises, 2);
equal(summary.statuses.ready, 1);
equal(summary.statuses.pending, 1);
ok(summary.totalCriteria === 38, "dix-neuf critères par texte");
ok(summary.completionRate > 0 && summary.completionRate < 100, "taux de complétion calculé");

const exported = buildManualAuditExport(store, exercises, {
  "texte-a": { status: "ready", wordCount: 500 }
});
equal(exported.exportType, "audit-pedagogique-manuel");
equal(exported.storageScope, "local-browser");
equal(exported.automaticAuditPreserved, true);
equal(exported.exercises.length, 2);
equal(exported.exercises[0].automaticAudit.wordCount, 500);
equal(exported.exercises[0].manualAudit.status, "ready");
ok(!Object.hasOwn(exported.exercises[0], "text"), "le texte intégral n’est pas exporté");
ok(!Object.hasOwn(exported.exercises[0], "questions"), "les questions et réponses attendues ne sont pas exportées");
const serialized = JSON.stringify(exported);
ok(!serialized.includes("Réponse privée"), "aucune réponse attendue dans l’export");
ok(!serialized.includes("Contenu intégral à ne pas exporter"), "aucun texte intégral dans l’export");

console.log(`Bloc 9 — audit manuel : ${checks} assertions réussies.`);
