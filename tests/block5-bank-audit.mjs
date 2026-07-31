import assert from "node:assert/strict";
import baseExercises from "../app/data/exercises.js";
import moreExercises from "../app/data/moreExercises.js";
import genesisExercise from "../app/data/genesisExercise.js";
import {
  buildQuestionBank,
  normalizeExerciseQuestions,
  summarizeQuestionBank,
  validateQuestionSchema
} from "../lib/questionClassification.js";

const exercises = [...baseExercises, ...moreExercises, genesisExercise].map(normalizeExerciseQuestions);
const bank = buildQuestionBank(exercises);
const summary = summarizeQuestionBank(exercises);

let checks = 0;
function ok(value, message) {
  checks += 1;
  assert.ok(value, message);
}
function equal(actual, expected, message) {
  checks += 1;
  assert.equal(actual, expected, message);
}

ok(exercises.length >= 14, "au moins quatorze textes intégrés");
ok(bank.length >= 100, "banque suffisamment fournie");
equal(summary.total, bank.length, "total cohérent");
ok(summary.byLevel["6e"] > 0, "questions de 6e présentes");
ok(summary.byLevel.sec1 >= 16, "questions de secondaire 1 présentes");
ok(summary.byLevel.sec2 >= 18, "questions de secondaire 2 présentes");

const allowedWords = new Set(["qui", "quoi", "où", "quand", "combien", "comment", "pourquoi", "quel"]);
const allowedDimensions = new Set(["comprendre", "inferer", "interpreter", "reagir", "apprecier"]);
const allowedTypes = new Set(["explicite", "implicite", "opinion_justifiee", "jugement_critique"]);
const allowedLevels = new Set(["6e", "sec1", "sec2"]);

for (const question of bank) {
  const validation = validateQuestionSchema(question);
  ok(validation.valid, `${question.exerciseTitle} — ${question.id} doit être valide : ${validation.errors.join(", ")}`);
  ok(Boolean(question.prompt), `${question.exerciseTitle} — question avec texte`);
  ok(allowedWords.has(question.questionWord), `${question.exerciseTitle} — mot-question permis`);
  ok(allowedDimensions.has(question.dimension), `${question.exerciseTitle} — dimension permise`);
  ok(allowedTypes.has(question.questionType), `${question.exerciseTitle} — type permis`);
  ok(allowedLevels.has(question.targetLevel), `${question.exerciseTitle} — niveau cible permis`);
  ok(Number.isInteger(question.minimumExpectedElements) && question.minimumExpectedElements >= 1 && question.minimumExpectedElements <= 8, `${question.exerciseTitle} — minimum valide`);
  ok(Array.isArray(question.validationProfile?.checklist) && question.validationProfile.checklist.length >= 2, `${question.exerciseTitle} — grille de validation`);
  ok(!JSON.stringify(question.validationProfile).includes(String(question.expectedAnswer || "__aucune__")), `${question.exerciseTitle} — aucune réponse finale dans la grille`);

  if (question.dimension === "comprendre") equal(question.questionType, "explicite", `${question.exerciseTitle} — compréhension explicite`);
  if (["inferer", "interpreter"].includes(question.dimension)) equal(question.questionType, "implicite", `${question.exerciseTitle} — raisonnement implicite`);
  if (question.dimension === "reagir") equal(question.questionType, "opinion_justifiee", `${question.exerciseTitle} — réaction justifiée`);
  if (question.dimension === "apprecier") equal(question.questionType, "jugement_critique", `${question.exerciseTitle} — appréciation critique`);

  const normalizedPrompt = question.prompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (normalizedPrompt.includes("equipe") && !/\bqui\b/.test(normalizedPrompt)) {
    ok(question.questionWord !== "qui", `${question.exerciseTitle} — qui absent du mot équipe`);
  }
}

ok(summary.byDimension.comprendre > 0, "questions de compréhension présentes");
ok(summary.byDimension.interpreter + summary.byDimension.inferer > 0, "questions implicites présentes");
ok(summary.byDimension.reagir > 0, "questions de réaction présentes");
ok(summary.byDimension.apprecier > 0, "questions d’appréciation présentes");
equal(summary.proofRequired, bank.length, "la banque exige un appui du texte pour chaque question");
ok(summary.justificationRequired > 0 && summary.justificationRequired < bank.length, "justification appliquée de façon sélective");

console.log(`Bloc 5 — banque complète : ${checks} assertions réussies sur ${bank.length} questions et trois niveaux.`);
