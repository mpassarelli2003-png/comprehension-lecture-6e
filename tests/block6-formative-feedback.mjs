import assert from "node:assert/strict";
import {
  evaluateExerciseSubmission,
  evaluateReadingAnswer,
  estimateAnswerElements
} from "../lib/formativeFeedback.js";
import { detectQuestionWord, normalizeQuestion } from "../lib/questionClassification.js";

const scope = { exerciseId: "texte-a", modeId: "training", levelId: "6e" };
const proof = (questionId, text = "Un passage précis du texte montre cette information.") => ({ questionId, text });
const evidence = (questionId, text, overrides = {}) => ({
  proofs: [proof(questionId, text)],
  exerciseId: "texte-a",
  modeId: "training",
  ...overrides
});

function question(overrides = {}) {
  return normalizeQuestion({
    id: "q1",
    prompt: "Quelle information est donnée dans le texte ?",
    dimension: "comprendre",
    questionType: "explicite",
    proofRequired: true,
    justificationRequired: false,
    minimumExpectedElements: 1,
    targetLevel: "6e",
    ...overrides
  });
}

let checks = 0;
function check(label, fn) {
  fn();
  checks += 1;
  console.log(`✓ ${label}`);
}

check("explicite — réponse vide", () => {
  const result = evaluateReadingAnswer(question(), "", evidence("q1"), scope);
  assert.equal(result.status, "missing");
  assert.equal(result.canContinue, false);
  assert.ok(result.missing.some((item) => item.code === "answer"));
});

check("explicite — réponse présente sans preuve", () => {
  const result = evaluateReadingAnswer(question(), "La réponse nomme une information du texte.", { proofs: [], exerciseId: "texte-a", modeId: "training" }, scope);
  assert.equal(result.status, "partial");
  assert.ok(result.missing.some((item) => item.code === "evidence"));
});

check("explicite — preuve présente", () => {
  const result = evaluateReadingAnswer(question(), "Le texte donne une information claire.", evidence("q1"), scope);
  assert.ok(["acceptable", "strong"].includes(result.status));
  assert.equal(result.canContinue, true);
});

check("explicite — preuve ancienne refusée", () => {
  const result = evaluateReadingAnswer(question(), "Le texte donne une information claire.", evidence("q1", undefined, { exerciseId: "ancien-texte" }), scope);
  assert.equal(result.canContinue, false);
  assert.equal(result.diagnostics.validEvidenceCount, 0);
});

check("explicite — preuve d’un autre mode refusée", () => {
  const result = evaluateReadingAnswer(question(), "Le texte donne une information claire.", evidence("q1", undefined, { modeId: "simulation" }), scope);
  assert.equal(result.canContinue, false);
  assert.equal(result.diagnostics.validEvidenceCount, 0);
});

check("explicite — preuve d’une autre question refusée", () => {
  const result = evaluateReadingAnswer(question(), "Le texte donne une information claire.", evidence("q2"), scope);
  assert.equal(result.canContinue, false);
  assert.equal(result.diagnostics.validEvidenceCount, 0);
});

const inference = question({
  prompt: "Que peux-tu déduire ? Explique avec un indice.",
  dimension: "inferer",
  questionType: "implicite",
  justificationRequired: true,
  minimumExpectedElements: 2
});

check("inférence — idée sans indice", () => {
  const result = evaluateReadingAnswer(inference, "Je comprends que le personnage est inquiet parce que la situation change.", { proofs: [], exerciseId: "texte-a", modeId: "training" }, scope);
  assert.equal(result.canContinue, false);
  assert.ok(result.missing.some((item) => item.code === "evidence"));
});

check("inférence — indice sans explication", () => {
  const result = evaluateReadingAnswer(inference, "Le personnage semble inquiet.", evidence("q1"), scope);
  assert.equal(result.canContinue, false);
  assert.ok(result.missing.some((item) => item.code === "justification"));
});

check("inférence — idée et indice expliqués", () => {
  const result = evaluateReadingAnswer(inference, "Je comprends que le personnage est inquiet parce que son comportement change; il hésite ensuite à avancer.", evidence("q1"), scope);
  assert.equal(result.canContinue, true);
});

const reaction = question({
  prompt: "Comment réagis-tu à cette décision ? Explique.",
  dimension: "reagir",
  questionType: "opinion_justifiee",
  justificationRequired: true,
  minimumExpectedElements: 2
});

check("réaction — opinion seule refusée", () => {
  const result = evaluateReadingAnswer(reaction, "Je trouve cette décision injuste parce qu’elle me dérange vraiment.", { proofs: [], exerciseId: "texte-a", modeId: "training" }, scope);
  assert.equal(result.canContinue, false);
  assert.ok(result.missing.some((item) => item.code === "evidence"));
});

check("réaction — texte seul refusé", () => {
  const result = evaluateReadingAnswer(reaction, "Dans le texte, le personnage quitte la pièce parce que la discussion se termine.", evidence("q1"), scope);
  assert.equal(result.canContinue, false);
  assert.ok(result.missing.some((item) => item.code === "personal"));
});

check("réaction — opinion et lien au texte acceptés", () => {
  const result = evaluateReadingAnswer(reaction, "Je trouve cette décision injuste parce que le personnage est laissé seul; dans le texte, son départ montre son malaise.", evidence("q1"), scope);
  assert.equal(result.canContinue, true);
});

const appreciation = question({
  prompt: "Qu’as-tu aimé dans ce texte ? Justifie ton appréciation.",
  dimension: "apprecier",
  questionType: "jugement_critique",
  justificationRequired: true,
  minimumExpectedElements: 3
});

check("appréciation — j’ai aimé seul refusé", () => {
  const result = evaluateReadingAnswer(appreciation, "J’ai aimé.", { proofs: [], exerciseId: "texte-a", modeId: "training" }, scope);
  assert.equal(result.canContinue, false);
  assert.ok(result.missing.some((item) => item.code === "criterion"));
});

check("appréciation — opinion et critère sans exemple partiels", () => {
  const result = evaluateReadingAnswer(appreciation, "J’ai aimé le personnage parce qu’il est intéressant; son évolution est réussie; le thème est clair.", { proofs: [], exerciseId: "texte-a", modeId: "training" }, scope);
  assert.equal(result.canContinue, false);
  assert.ok(result.missing.some((item) => item.code === "evidence"));
});

check("appréciation — opinion, critère et exemple acceptés", () => {
  const result = evaluateReadingAnswer(appreciation, "J’ai aimé le personnage parce que son évolution est convaincante; dans un passage, il aide son ami; ce geste soutient le thème de l’entraide.", evidence("q1"), scope);
  assert.equal(result.canContinue, true);
});

check("nombre d’éléments — deux demandés, un seul détecté", () => {
  const result = evaluateReadingAnswer(question({ proofRequired: false, minimumExpectedElements: 2 }), "Un seul élément est clairement nommé.", {}, { ...scope, allowUnscopedEvidence: true });
  assert.equal(result.canContinue, false);
  assert.ok(result.missing.some((item) => item.code === "elements"));
});

check("nombre d’éléments — trois éléments distincts", () => {
  const result = evaluateReadingAnswer(question({ proofRequired: false, minimumExpectedElements: 3 }), "Premièrement, un fait; deuxièmement, une cause; troisièmement, une conséquence.", {}, { ...scope, allowUnscopedEvidence: true });
  assert.equal(result.canContinue, true);
});

check("question à plusieurs parties — prudence du comptage", () => {
  const estimate = estimateAnswerElements("Une réponse courte sans séparation claire.");
  assert.equal(estimate.confidence, "low");
  const result = evaluateReadingAnswer(question({ proofRequired: false, minimumExpectedElements: 2 }), "Une réponse courte sans séparation claire.", {}, { ...scope, allowUnscopedEvidence: true });
  assert.equal(result.canContinue, false);
});

check("niveau 6e — une seule prochaine action concrète", () => {
  const result = evaluateReadingAnswer(question(), "Une idée est présente.", { proofs: [], exerciseId: "texte-a", modeId: "training" }, scope);
  assert.match(result.nextStep, /Ajoute un appui du texte/);
  assert.ok(result.nextStep.length < 150);
});

check("secondaire 1 — précision et lien demandés", () => {
  const result = evaluateReadingAnswer(question({ targetLevel: "sec1" }), "Une idée est présente.", { proofs: [], exerciseId: "texte-a", modeId: "training" }, { ...scope, levelId: "sec1" });
  assert.match(result.nextStep, /indice précis|relie/i);
});

check("secondaire 2 — nuance et cohérence demandées", () => {
  const result = evaluateReadingAnswer(inference, "Une interprétation possible est proposée.", { proofs: [], exerciseId: "texte-a", modeId: "training" }, { ...scope, levelId: "sec2" });
  assert.match(result.nextStep, /indice|convaincant|précis/i);
});

check("simulation — seulement procédure et forme", () => {
  const secretQuestion = question({ expectedAnswer: "CONTENU SECRET À NE JAMAIS AFFICHER", dimension: "apprecier", minimumExpectedElements: 3 });
  const result = evaluateReadingAnswer(secretQuestion, "J’ai aimé.", { proofs: [], exerciseId: "texte-a", modeId: "simulation" }, { ...scope, modeId: "simulation" });
  const rendered = JSON.stringify({ missing: result.missing, strengths: result.strengths, nextStep: result.nextStep });
  assert.equal(result.procedureOnly, true);
  assert.doesNotMatch(rendered, /CONTENU SECRET/);
  assert.doesNotMatch(rendered, /personnage, le message ou le passage/);
  assert.match(result.nextStep, /Vérifie/);
});

check("détection — qui n’est pas trouvé dans équipe", () => {
  assert.equal(detectQuestionWord("Comment l’équipe réussit-elle son projet ?"), "comment");
});

check("détection — quoi n’est pas trouvé dans un mot plus long", () => {
  assert.equal(detectQuestionWord("Quels éléments sont importants ?"), "quel");
});

check("détection — où est reconnu", () => {
  assert.equal(detectQuestionWord("Où se déroule cette scène ?"), "où");
});

check("détection — Qu’est-ce que est classé comme quoi", () => {
  assert.equal(detectQuestionWord("Qu’est-ce que le personnage découvre ?"), "quoi");
});

const exercise = {
  id: "texte-a",
  level: "6e année",
  questions: [question(), { ...reaction, id: "q2" }]
};

check("remise finale — travail incomplet bloqué", () => {
  const summary = evaluateExerciseSubmission(exercise, {
    exerciseId: "texte-a",
    learningMode: "simulation",
    answers: { q1: "Une réponse écrite.", q2: "Je pense que cette décision est difficile." },
    proofs: []
  }, { modeId: "simulation" });
  assert.equal(summary.readyToSubmit, false);
  assert.ok(summary.missingEvidence >= 1);
});

check("réinitialisation — ancien état refusé", () => {
  const summary = evaluateExerciseSubmission(exercise, {
    exerciseId: "ancien-texte",
    learningMode: "training",
    answers: { q1: "Ancienne réponse complète.", q2: "Ancienne réaction complète parce que le texte le montre." },
    proofs: [proof("q1"), proof("q2")]
  }, { modeId: "training" });
  assert.equal(summary.scopeValid, false);
  assert.equal(summary.readyToSubmit, false);
  assert.equal(summary.completeQuestions, 0);
});

console.log(`Bloc 6 : ${checks} assertions ciblées réussies.`);
