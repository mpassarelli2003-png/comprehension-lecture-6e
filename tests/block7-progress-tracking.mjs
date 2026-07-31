import assert from "node:assert/strict";
import {
  PROGRESS_STORAGE_KEY,
  buildStudentProgressSummary,
  clearProgressRecords,
  latestProgressRecords,
  normalizeProgressRecord,
  progressRecordFromFeedback,
  readProgressRecords,
  summarizeProgress,
  upsertProgressRecord,
  validateProgressData,
  writeProgressRecord
} from "../lib/progressTracking.js";

function fakeStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

const base = {
  exerciseId: "texte-1",
  exerciseTitle: "Texte 1",
  questionId: "q1",
  questionOrder: 1,
  dimension: "comprendre",
  questionType: "explicite",
  levelId: "6e",
  modeId: "training",
  timestamp: "2026-07-31T15:00:00.000Z"
};

const missing = normalizeProgressRecord({ ...base, status: "missing", missingCodes: ["answer", "evidence"] });
assert.equal(missing.statusBucket, "missing");
assert.deepEqual(missing.missingCodes, ["answer", "evidence"]);
assert.equal(Object.hasOwn(missing, "answer"), false, "Le suivi ne doit pas stocker la réponse.");
assert.equal(Object.hasOwn(missing, "evidenceText"), false, "Le suivi ne doit pas stocker le passage.");

const partial = normalizeProgressRecord({
  ...base,
  timestamp: "2026-07-31T15:01:00.000Z",
  status: "partial",
  missingCodes: ["justification"],
  validEvidenceCount: 1
});
const complete = normalizeProgressRecord({
  ...base,
  timestamp: "2026-07-31T15:02:00.000Z",
  status: "acceptable",
  missingCodes: [],
  validEvidenceCount: 1,
  canContinue: true,
  canSubmit: true
});

let records = [];
records = upsertProgressRecord(records, missing);
records = upsertProgressRecord(records, partial);
records = upsertProgressRecord(records, complete);
assert.equal(records.length, 3);

const duplicate = { ...complete, timestamp: "2026-07-31T15:02:02.000Z" };
records = upsertProgressRecord(records, duplicate);
assert.equal(records.length, 3, "Un doublon identique à quelques secondes d’intervalle doit être ignoré.");

const simulationPartial = normalizeProgressRecord({
  ...base,
  questionId: "q2",
  questionOrder: 2,
  dimension: "inferer",
  questionType: "implicite",
  modeId: "simulation",
  status: "partial",
  missingCodes: ["evidence", "justification"],
  timestamp: "2026-07-31T15:03:00.000Z"
});
records = upsertProgressRecord(records, simulationPartial);

const reactionComplete = normalizeProgressRecord({
  ...base,
  questionId: "q3",
  questionOrder: 3,
  dimension: "reagir",
  questionType: "opinion_justifiee",
  status: "strong",
  missingCodes: [],
  timestamp: "2026-07-31T15:04:00.000Z"
});
records = upsertProgressRecord(records, reactionComplete);

const appreciationPartial = normalizeProgressRecord({
  ...base,
  questionId: "q4",
  questionOrder: 4,
  dimension: "apprecier",
  questionType: "jugement_critique",
  status: "partial",
  missingCodes: ["criterion"],
  timestamp: "2026-07-31T15:05:00.000Z"
});
records = upsertProgressRecord(records, appreciationPartial);

const latest = latestProgressRecords(records);
assert.equal(latest.length, 4, "Le dernier état par question et mode doit être conservé.");
assert.equal(latest.find((record) => record.questionId === "q1")?.status, "acceptable");

const summary = summarizeProgress(records);
assert.equal(summary.totals.total, 4);
assert.equal(summary.totals.complete, 2);
assert.equal(summary.totals.partial, 2);
assert.equal(summary.byDimension.comprendre.complete, 1);
assert.equal(summary.byDimension.inferer.partial, 1);
assert.equal(summary.byDimension.reagir.complete, 1);
assert.equal(summary.byDimension.apprecier.partial, 1);
assert.equal(summary.byMode.training.total, 3);
assert.equal(summary.byMode.simulation.total, 1);
assert.equal(summary.frequentNeeds.some((item) => item.code === "criterion"), true);
assert.equal(summary.frequentNeeds.some((item) => item.code === "evidence"), true);

const student = buildStudentProgressSummary(summary);
assert.match(student.title, /2 réponse\(s\) complète\(s\)/);
assert.match(student.modeComparison, /entraînement/);

const feedbackRecord = progressRecordFromFeedback({
  feedback: {
    status: "partial",
    missing: [{ code: "elements", message: "Deux éléments attendus." }],
    canContinue: false,
    canSubmit: false,
    question: { dimension: "comprendre", questionType: "explicite" },
    diagnostics: { validEvidenceCount: 1, rejectedEvidenceCount: 2 }
  },
  exercise: { id: "texte-2", title: "Texte 2" },
  question: { id: "q5", dimension: "comprendre", questionType: "explicite" },
  questionOrder: 1,
  levelId: "sec1",
  modeId: "training",
  timestamp: "2026-07-31T16:00:00.000Z"
});
assert.equal(feedbackRecord.missingCodes[0], "elements");
assert.equal(feedbackRecord.validEvidenceCount, 1);
assert.equal(feedbackRecord.rejectedEvidenceCount, 2);
assert.equal(Object.values(feedbackRecord).includes("Deux éléments attendus."), false, "Les messages détaillés ne doivent pas être stockés.");

const storage = fakeStorage();
writeProgressRecord(storage, missing);
writeProgressRecord(storage, partial);
assert.equal(readProgressRecords(storage).length, 2);
assert.ok(storage.getItem(PROGRESS_STORAGE_KEY));
clearProgressRecords(storage);
assert.equal(readProgressRecords(storage).length, 0);

const validation = validateProgressData(records);
assert.equal(validation.valid, true, validation.message);
assert.equal(validation.containsSensitiveText, false);

storage.setItem(PROGRESS_STORAGE_KEY, "JSON invalide");
assert.deepEqual(readProgressRecords(storage), [], "Un ancien stockage invalide doit être ignoré proprement.");

const unknownCodes = normalizeProgressRecord({ ...base, missingCodes: ["evidence", "code-inconnu"] });
assert.deepEqual(unknownCodes.missingCodes, ["evidence"]);

console.log("Bloc 7 : suivi par dimension, mode, statut et besoin validé sans stockage du contenu élève.");
