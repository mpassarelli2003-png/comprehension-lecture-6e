import assert from "node:assert/strict";
import baseExercises from "../app/data/exercises.js";
import moreExercises from "../app/data/moreExercises.js";
import genesisExercise from "../app/data/genesisExercise.js";
import secondaryExercises from "../app/data/secondaryExercises.js";
import { normalizeQuestionLevel } from "../lib/questionClassification.js";
import {
  MANUAL_AUDIT_CRITERIA,
  buildManualAuditExport,
  normalizeManualAuditStore,
  summarizeManualAudits
} from "../lib/manualPedagogicalAudit.js";

function unique(items) {
  const seen = new Set();
  return items.filter((item) => item?.id && !seen.has(item.id) && seen.add(item.id));
}

const exercises = unique([...baseExercises, ...moreExercises, genesisExercise, ...secondaryExercises]);
const store = normalizeManualAuditStore(null, exercises);
const summary = summarizeManualAudits(store, exercises);
const exported = buildManualAuditExport(store, exercises, {});

assert.equal(Object.keys(store.audits).length, exercises.length, "Chaque texte doit avoir un audit manuel.");
assert.equal(summary.totalExercises, exercises.length, "Le résumé doit couvrir toute la banque.");
assert.equal(exported.exercises.length, exercises.length, "L’export doit couvrir toute la banque.");
assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, exercises.length, "Aucun texte ne doit être dupliqué.");
assert.ok(exercises.some((exercise) => normalizeQuestionLevel(exercise.level) === "6e"), "La 6e est couverte.");
assert.ok(exercises.some((exercise) => normalizeQuestionLevel(exercise.level) === "sec1"), "Le secondaire 1 est couvert.");
assert.ok(exercises.some((exercise) => normalizeQuestionLevel(exercise.level) === "sec2"), "Le secondaire 2 est couvert.");
assert.equal(Object.keys(MANUAL_AUDIT_CRITERIA.text.items).length, 8);
assert.equal(Object.keys(MANUAL_AUDIT_CRITERIA.questions.items).length, 7);
assert.equal(Object.keys(MANUAL_AUDIT_CRITERIA.simulation.items).length, 4);

for (const exercise of exercises) {
  const entry = store.audits[exercise.id];
  assert.equal(entry.exerciseTitle, exercise.title, `${exercise.id} conserve son titre.`);
  assert.equal(entry.level, exercise.level, `${exercise.id} conserve son niveau.`);
  assert.equal(entry.status, "pending", `${exercise.id} commence à valider.`);
}

console.log(`Bloc 9 — couverture réelle : ${exercises.length} textes possèdent une grille locale complète.`);
