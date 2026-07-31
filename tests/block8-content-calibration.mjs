import assert from "node:assert/strict";
import baseExercises from "../app/data/exercises.js";
import moreExercises from "../app/data/moreExercises.js";
import genesisExercise from "../app/data/genesisExercise.js";
import {
  CONTENT_LEVEL_PROFILES,
  auditExerciseContent,
  summarizeContentBank,
  validateContentBank
} from "../lib/contentCalibration.js";
import { registerCalibratedExercises, secondaryExercises } from "../lib/exerciseBankRegistration.js";
import { normalizeExerciseQuestions } from "../lib/questionClassification.js";

const before = moreExercises.length;
registerCalibratedExercises(moreExercises);
registerCalibratedExercises(moreExercises);
assert.equal(moreExercises.length, before, "L’enregistrement doit être idempotent.");

const exercises = [...baseExercises, ...moreExercises, genesisExercise].map(normalizeExerciseQuestions);
const summary = summarizeContentBank(exercises);
const validation = validateContentBank(exercises);

assert.equal(validation.valid, true, validation.message);
assert.equal(summary.errors.length, 0, "La banque ne doit contenir aucune erreur bloquante.");
assert.ok(summary.byLevel["6e"] >= 2, "La 6e doit conserver au moins deux textes.");
assert.ok(summary.byLevel.sec1 >= 2, "Le secondaire 1 doit contenir au moins deux textes.");
assert.ok(summary.byLevel.sec2 >= 2, "Le secondaire 2 doit contenir au moins deux textes.");
assert.equal(summary.balancedSecondaryBank, true, "Les niveaux secondaires doivent couvrir au moins deux types de texte.");

const ids = exercises.map((exercise) => exercise.id);
assert.equal(new Set(ids).size, ids.length, "Les identifiants de textes doivent être uniques.");

const expectedSecondaryIds = [
  "sec1-bibliotheque-objets",
  "sec1-arbres-ville",
  "sec2-notifications-ecole",
  "sec2-lettre-silence"
];
expectedSecondaryIds.forEach((id) => assert.ok(ids.includes(id), `${id} doit être publié dans la banque commune.`));
assert.equal(secondaryExercises.length, 4);

for (const exercise of secondaryExercises) {
  const audit = auditExerciseContent(exercise);
  assert.equal(audit.errors.length, 0, `${exercise.id} contient une erreur bloquante.`);
  assert.equal(exercise.calibration?.reviewStatus, "approved", `${exercise.id} doit être approuvé.`);
  assert.ok(exercise.intention?.length > 20, `${exercise.id} doit avoir une intention de lecture précise.`);
  assert.ok(audit.wordCount >= 400, `${exercise.id} est trop court pour une lecture secondaire.`);
  assert.ok(audit.questionCount >= CONTENT_LEVEL_PROFILES[audit.levelId].questionRange[0], `${exercise.id} contient trop peu de questions.`);
  assert.ok(audit.dimensions.comprendre >= 1, `${exercise.id} doit conserver du repérage.`);
  assert.ok(audit.dimensions.inferer + audit.dimensions.interpreter >= 2, `${exercise.id} doit travailler l’inférence ou l’interprétation.`);
  assert.ok(audit.dimensions.reagir + audit.dimensions.apprecier >= 2, `${exercise.id} doit travailler la réaction ou l’appréciation.`);
}

const sec1Questions = exercises.filter((exercise) => /secondaire 1/i.test(exercise.level)).flatMap((exercise) => exercise.questions);
const sec2Questions = exercises.filter((exercise) => /secondaire 2/i.test(exercise.level)).flatMap((exercise) => exercise.questions);
assert.ok(sec1Questions.filter((question) => ["inferer", "interpreter"].includes(question.dimension)).length >= 4);
assert.ok(sec2Questions.filter((question) => question.dimension === "apprecier").length >= 4);
assert.ok(sec2Questions.filter((question) => question.justificationRequired).length >= 10);

console.log(`Bloc 8 : ${summary.totalTexts} textes, ${summary.totalQuestions} questions, couverture 6e/sec1/sec2 validée.`);
