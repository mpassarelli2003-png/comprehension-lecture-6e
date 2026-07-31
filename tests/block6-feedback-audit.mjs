import assert from "node:assert/strict";
import baseExercises from "../app/data/exercises.js";
import moreExercises from "../app/data/moreExercises.js";
import genesisExercise from "../app/data/genesisExercise.js";
import {
  evaluateReadingAnswer,
  summarizeFeedbackCoverage,
  validateFeedbackCoverage
} from "../lib/formativeFeedback.js";
import { normalizeExerciseQuestions } from "../lib/questionClassification.js";

const exercises = [...baseExercises, ...moreExercises, genesisExercise].map(normalizeExerciseQuestions);
const coverage = summarizeFeedbackCoverage(exercises);
const validation = validateFeedbackCoverage(exercises);

assert.ok(coverage.total > 0, "La banque doit contenir des questions.");
assert.equal(coverage.evaluable, coverage.total, "Chaque question doit être évaluable.");
assert.equal(validation.valid, true, validation.message);
assert.equal(coverage.unclear.length, 0, "Aucune question ne doit rester sans règle claire.");

let audited = 0;
for (const exercise of exercises) {
  for (const question of exercise.questions) {
    const currentEvidence = {
      exerciseId: exercise.id,
      modeId: "training",
      proofs: [{ questionId: question.id, text: "Passage actuel suffisamment précis pour tester la structure." }]
    };
    const training = evaluateReadingAnswer(
      question,
      "Je formule une idée parce que le texte fournit un appui; ensuite, je précise le lien; enfin, je relis ma réponse.",
      currentEvidence,
      { exerciseId: exercise.id, modeId: "training", levelId: question.targetLevel }
    );
    const simulation = evaluateReadingAnswer(
      { ...question, expectedAnswer: "RÉPONSE ATTENDUE CONFIDENTIELLE" },
      "Réponse de simulation à vérifier.",
      { exerciseId: exercise.id, modeId: "simulation", proofs: [] },
      { exerciseId: exercise.id, modeId: "simulation", levelId: question.targetLevel }
    );

    assert.ok(["missing", "partial", "acceptable", "strong"].includes(training.status), `${exercise.id}/${question.id} : statut invalide.`);
    assert.ok(Array.isArray(training.missing), `${exercise.id}/${question.id} : missing doit être un tableau.`);
    assert.ok(Array.isArray(training.strengths), `${exercise.id}/${question.id} : strengths doit être un tableau.`);
    assert.ok(Array.isArray(training.criterionFeedback), `${exercise.id}/${question.id} : criterionFeedback doit être un tableau.`);
    assert.equal(typeof training.nextStep, "string", `${exercise.id}/${question.id} : nextStep manquant.`);
    assert.equal(typeof training.canContinue, "boolean", `${exercise.id}/${question.id} : canContinue invalide.`);
    assert.equal(typeof training.canSubmit, "boolean", `${exercise.id}/${question.id} : canSubmit invalide.`);

    const simulationText = JSON.stringify({
      missing: simulation.missing,
      strengths: simulation.strengths,
      nextStep: simulation.nextStep,
      criteria: simulation.criterionFeedback
    });
    assert.equal(simulation.procedureOnly, true, `${exercise.id}/${question.id} : simulation non procédurale.`);
    assert.doesNotMatch(simulationText, /RÉPONSE ATTENDUE CONFIDENTIELLE/);
    assert.doesNotMatch(simulationText, new RegExp(String(question.expectedAnswer || "a^"), "i"), `${exercise.id}/${question.id} : fuite de réponse attendue.`);

    const oldEvidence = evaluateReadingAnswer(
      question,
      "Une réponse est écrite parce qu’un appui est nécessaire.",
      { exerciseId: "autre-texte", modeId: "training", proofs: [{ questionId: question.id, text: "Ancienne preuve." }] },
      { exerciseId: exercise.id, modeId: "training", levelId: question.targetLevel }
    );
    assert.equal(oldEvidence.diagnostics.validEvidenceCount, 0, `${exercise.id}/${question.id} : ancienne preuve acceptée.`);

    audited += 1;
  }
}

console.log(`Bloc 6 : ${audited} question(s) auditées, ${coverage.proofRequired} avec preuve obligatoire, ${coverage.justificationRequired} avec justification obligatoire.`);
