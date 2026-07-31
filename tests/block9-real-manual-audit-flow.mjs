import assert from "node:assert/strict";
import baseExercises from "../app/data/exercises.js";
import moreExercises from "../app/data/moreExercises.js";
import genesisExercise from "../app/data/genesisExercise.js";
import secondaryExercises from "../app/data/secondaryExercises.js";
import { auditExerciseContent } from "../lib/contentCalibration.js";
import { normalizeExerciseQuestions, normalizeQuestionLevel } from "../lib/questionClassification.js";
import {
  buildManualAuditExport,
  criterionCounts,
  manualAuditWarnings,
  normalizeManualAuditStore
} from "../lib/manualPedagogicalAudit.js";

function uniqueExercises(items) {
  const seen = new Set();
  return items.filter((exercise) => {
    if (!exercise?.id || seen.has(exercise.id)) return false;
    seen.add(exercise.id);
    return true;
  });
}

const exercises = uniqueExercises([
  ...baseExercises,
  ...moreExercises,
  genesisExercise,
  ...secondaryExercises
]).map(normalizeExerciseQuestions);

let checks = 0;
function equal(actual, expected, message) {
  checks += 1;
  assert.equal(actual, expected, message);
}
function ok(value, message) {
  checks += 1;
  assert.ok(value, message);
}
function deepEqual(actual, expected, message) {
  checks += 1;
  assert.deepEqual(actual, expected, message);
}

// Étapes 2 et 3 — ouvrir l’audit et choisir un vrai texte de 6e.
const exercise = exercises.find((item) => normalizeQuestionLevel(item.level) === "6e");
ok(exercise, "un texte réel de 6e doit être disponible");
equal(normalizeQuestionLevel(exercise.level), "6e", "le texte choisi appartient bien à la 6e");

const automaticBefore = auditExerciseContent(exercise);
const automaticSnapshotBefore = JSON.parse(JSON.stringify(automaticBefore));
let store = normalizeManualAuditStore(null, exercises);
let entry = store.audits[exercise.id];
equal(entry.status, "pending", "le statut initial est À valider");
equal(criterionCounts(entry).pending, 19, "les 19 critères sont initialement non évalués");

// Étapes 4 à 8 — quelques critères conformes, un critère non évalué,
// statut Prêt, avertissement, initiales et note.
entry = {
  ...entry,
  status: "ready",
  reviewer: "MP",
  notes: "Validation partielle : poursuivre la vérification du vocabulaire.",
  criteria: {
    ...entry.criteria,
    text: {
      ...entry.criteria.text,
      levelAppropriate: "pass",
      lengthAcceptable: "pass",
      vocabularyAdapted: "pending"
    },
    questions: {
      ...entry.criteria.questions,
      clearWording: "pass"
    },
    simulation: {
      ...entry.criteria.simulation,
      noContentHelp: "pass"
    }
  },
  updatedAt: new Date().toISOString()
};
store = {
  ...store,
  audits: {
    ...store.audits,
    [exercise.id]: entry
  }
};

const countsBeforeExport = criterionCounts(entry);
equal(countsBeforeExport.pass, 4, "quatre critères sont conformes");
ok(countsBeforeExport.pending > 0, "au moins un critère demeure non évalué");
equal(entry.status, "ready", "le statut manuel est Prêt");
equal(entry.reviewer, "MP", "les initiales sont conservées");
ok(entry.notes.includes("Validation partielle"), "la note est conservée");
const warnings = manualAuditWarnings(entry);
ok(warnings.some((warning) => warning.includes("non évalués")), "le statut Prêt incomplet produit un avertissement");

// Persistance locale simulée par sérialisation/désérialisation du magasin.
const restoredStore = normalizeManualAuditStore(JSON.parse(JSON.stringify(store)), exercises);
equal(restoredStore.audits[exercise.id].status, "ready", "le statut survit à la persistance locale");
equal(restoredStore.audits[exercise.id].reviewer, "MP", "les initiales survivent à la persistance locale");
equal(restoredStore.audits[exercise.id].notes, entry.notes, "la note survit à la persistance locale");

// Étapes 9 et 10 — export individuel sans texte intégral ni réponses attendues.
const automaticAudits = {
  [exercise.id]: {
    status: automaticBefore.status,
    levelId: automaticBefore.levelId,
    wordCount: automaticBefore.wordCount,
    paragraphCount: automaticBefore.paragraphCount,
    questionCount: automaticBefore.questionCount,
    dimensions: automaticBefore.dimensions,
    ratios: automaticBefore.ratios,
    errors: automaticBefore.errors,
    warnings: automaticBefore.warnings
  }
};
const exported = buildManualAuditExport(restoredStore, [exercise], automaticAudits);
equal(exported.exportType, "audit-pedagogique-manuel", "le bon type d’export est produit");
equal(exported.exercises.length, 1, "l’export individuel contient un seul texte");
equal(exported.exercises[0].manualAudit.status, "ready", "le statut manuel est présent dans l’export");
equal(exported.exercises[0].manualAudit.reviewer, "MP", "les initiales sont présentes dans l’export");
equal(exported.exercises[0].automaticAudit.wordCount, automaticBefore.wordCount, "l’aperçu automatique est inclus en lecture seule");

const serialized = JSON.stringify(exported);
const textExcerpt = String(exercise.text || "").replace(/\s+/g, " ").trim().slice(0, 100);
ok(textExcerpt.length > 40, "le texte de contrôle possède un extrait significatif");
ok(!serialized.includes(textExcerpt), "le texte intégral n’est pas inclus dans l’export");
for (const question of exercise.questions || []) {
  const expected = String(question.expectedAnswer || "").trim();
  if (expected.length >= 12) {
    ok(!serialized.includes(expected), `la réponse attendue de ${question.id} n’est pas exportée`);
  }
}
ok(!serialized.includes("expectedAnswer"), "la clé expectedAnswer n’est pas exportée");
ok(!serialized.includes("acceptableAnswers"), "les réponses acceptables ne sont pas exportées");

// Étapes 11 et 12 — réinitialiser seulement l’audit manuel.
const resetEntry = normalizeManualAuditStore(null, [exercise]).audits[exercise.id];
const resetStore = {
  ...restoredStore,
  audits: {
    ...restoredStore.audits,
    [exercise.id]: {
      ...resetEntry,
      updatedAt: new Date().toISOString()
    }
  }
};
const resetCounts = criterionCounts(resetStore.audits[exercise.id]);
equal(resetStore.audits[exercise.id].status, "pending", "la réinitialisation remet le statut À valider");
equal(resetStore.audits[exercise.id].reviewer, "", "les initiales sont effacées");
equal(resetStore.audits[exercise.id].notes, "", "la note est effacée");
equal(resetCounts.pending, 19, "les 19 critères redeviennent non évalués");
equal(resetCounts.pass, 0, "aucun critère conforme ne reste après réinitialisation");
equal(resetCounts.review, 0, "aucun critère À revoir ne reste après réinitialisation");

const automaticAfter = auditExerciseContent(exercise);
deepEqual(automaticAfter, automaticSnapshotBefore, "l’audit automatique reste strictement inchangé");
equal(automaticAfter.wordCount, automaticBefore.wordCount, "le nombre de mots automatique reste inchangé");
equal(automaticAfter.questionCount, automaticBefore.questionCount, "le nombre de questions automatique reste inchangé");
deepEqual(automaticAfter.errors, automaticBefore.errors, "les erreurs automatiques restent inchangées");
deepEqual(automaticAfter.warnings, automaticBefore.warnings, "les avertissements automatiques restent inchangés");

console.log(`Bloc 9 — parcours manuel réel : ${checks} assertions réussies sur « ${exercise.title} ».`);
