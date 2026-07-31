import assert from "node:assert/strict";
import baseExercises from "../app/data/exercises.js";
import moreExercises from "../app/data/moreExercises.js";
import genesisExercise from "../app/data/genesisExercise.js";
import {
  evaluateExerciseSubmission,
  evaluateReadingAnswer
} from "../lib/formativeFeedback.js";
import { normalizeExerciseQuestions } from "../lib/questionClassification.js";

const exercises = [...baseExercises, ...moreExercises, genesisExercise].map(normalizeExerciseQuestions);
const bank = exercises.flatMap((exercise) => exercise.questions.map((question) => ({ exercise, question })));

function findDimension(dimension) {
  const match = bank.find((item) => item.question.dimension === dimension);
  assert.ok(match, `Une question ${dimension} doit exister dans la banque.`);
  return match;
}

function currentEvidence(exercise, question, modeId = "training") {
  return {
    exerciseId: exercise.id,
    modeId,
    proofs: [{ questionId: question.id, text: "Un passage actuel et suffisamment précis du texte est enregistré." }]
  };
}

const explicit = findDimension("comprendre");
const explicitResult = evaluateReadingAnswer(
  explicit.question,
  "Une information répond directement à la question; elle est formulée clairement; la réponse est relue.",
  currentEvidence(explicit.exercise, explicit.question),
  { exerciseId: explicit.exercise.id, modeId: "training", levelId: explicit.question.targetLevel }
);
assert.equal(explicitResult.canContinue, true, "La question explicite structurée doit être acceptable.");

const inference = findDimension("inferer");
const inferenceResult = evaluateReadingAnswer(
  inference.question,
  "Je déduis une idée parce qu’un indice du texte la soutient; ensuite, j’explique le lien; enfin, je relis.",
  currentEvidence(inference.exercise, inference.question),
  { exerciseId: inference.exercise.id, modeId: "training", levelId: inference.question.targetLevel }
);
assert.equal(inferenceResult.canContinue, true, "L’inférence avec indice expliqué doit être acceptable.");

const reaction = findDimension("reagir");
const reactionResult = evaluateReadingAnswer(
  reaction.question,
  "Je ressens de la surprise parce que le passage change la situation; dans le texte, un geste provoque ma réaction; ensuite, je l’explique.",
  currentEvidence(reaction.exercise, reaction.question),
  { exerciseId: reaction.exercise.id, modeId: "training", levelId: reaction.question.targetLevel }
);
assert.equal(reactionResult.canContinue, true, "La réaction personnelle liée au texte doit être acceptable.");

const appreciation = findDimension("apprecier");
const appreciationResult = evaluateReadingAnswer(
  appreciation.question,
  "J’ai aimé le personnage parce que son évolution est convaincante; un passage montre son changement; le thème renforce mon appréciation.",
  currentEvidence(appreciation.exercise, appreciation.question),
  { exerciseId: appreciation.exercise.id, modeId: "training", levelId: appreciation.question.targetLevel }
);
assert.equal(appreciationResult.canContinue, true, "L’appréciation avec opinion, critère et exemple doit être acceptable.");

const simulationExercise = exercises.find((exercise) => exercise.questions.length >= 2);
assert.ok(simulationExercise, "Un exercice avec plusieurs questions est requis.");
const firstQuestion = simulationExercise.questions[0];
const incompleteSimulation = evaluateExerciseSubmission(simulationExercise, {
  exerciseId: simulationExercise.id,
  learningMode: "simulation",
  answers: { [firstQuestion.id]: "Une seule réponse est écrite." },
  proofs: []
}, { modeId: "simulation" });
assert.equal(incompleteSimulation.readyToSubmit, false, "Une simulation incomplète doit rester bloquée.");
assert.ok(incompleteSimulation.missingQuestions >= 1 || incompleteSimulation.partialQuestions >= 1);

const simulationFeedback = evaluateReadingAnswer(
  appreciation.question,
  "J’ai aimé.",
  { exerciseId: appreciation.exercise.id, modeId: "simulation", proofs: [] },
  { exerciseId: appreciation.exercise.id, modeId: "simulation", levelId: appreciation.question.targetLevel }
);
const simulationText = JSON.stringify(simulationFeedback);
assert.equal(simulationFeedback.procedureOnly, true);
assert.match(simulationFeedback.nextStep, /Vérifie/);
assert.doesNotMatch(simulationText, /réponse attendue|expectedAnswer/i);

console.log("Bloc 6 : scénarios réels réussis — explicite, inférence, réaction, appréciation et simulation incomplète.");
