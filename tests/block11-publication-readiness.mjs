import assert from "node:assert/strict";
import {
  PUBLICATION_REVIEW_CONFIRMATION,
  buildPublicationReadiness,
  buildPublicationReviewRecord,
  minimumPublishableWords
} from "../lib/publicationReadiness.js";
import { emptyManualCriteria } from "../lib/manualPedagogicalAudit.js";

let checks = 0;
function ok(value, message) {
  checks += 1;
  assert.ok(value, message);
}
function equal(actual, expected, message) {
  checks += 1;
  assert.equal(actual, expected, message);
}

function longText(words = 420) {
  const sentence = "Les élèves observent un jardin communautaire et expliquent comment les plantes, les bénévoles et les voisins transforment progressivement leur quartier.";
  const values = [];
  while (values.join(" ").split(/\s+/).length < words) values.push(sentence);
  return values.join(" ");
}

function question(id, dimension, questionType = "implicite", proofRequired = true) {
  return {
    id,
    prompt: dimension === "comprendre"
      ? "Quel changement est expliqué dans le texte?"
      : "Que peut-on déduire de l’engagement des bénévoles?",
    dimension,
    questionType,
    proofRequired,
    justificationRequired: dimension !== "comprendre",
    minimumExpectedElements: dimension === "comprendre" ? 1 : 2,
    points: 2,
    expectedAnswer: "Une réponse administrateur structurée.",
    acceptableAnswers: [],
    isPersonalAnswer: false,
    recommendedProofTool: dimension === "comprendre" ? "explicite" : "inference"
  };
}

function exercise(overrides = {}) {
  return {
    id: "local-publication-test",
    title: "Le jardin du quartier",
    level: "6e année",
    textType: "informatif",
    category: "texte documentaire",
    intention: "Comprendre les effets d’un projet communautaire et justifier ses réponses.",
    description: "Exercice de validation de la publication.",
    difficulty: "6e année",
    text: longText(),
    calibration: {
      version: "local-1.0",
      targetLevel: "6e",
      reviewStatus: "approved",
      intendedReadingMinutes: 6,
      difficultyFeatures: []
    },
    vocabulary: [],
    questions: [
      question("q1", "comprendre", "explicite"),
      question("q2", "inferer"),
      question("q3", "interpreter"),
      question("q4", "reagir", "opinion_justifiee")
    ],
    ...overrides
  };
}

function manualAudit(overrides = {}) {
  const criteria = emptyManualCriteria();
  for (const group of Object.values(criteria)) {
    for (const key of Object.keys(group)) group[key] = "pass";
  }
  return {
    exerciseId: "local-publication-test",
    exerciseTitle: "Le jardin du quartier",
    level: "6e année",
    textType: "informatif",
    status: "ready",
    reviewer: "MP",
    notes: "Relu et validé.",
    criteria,
    updatedAt: "2026-07-31T20:00:00.000Z",
    ...overrides
  };
}

const options = { finalPreviewReviewed: true, reviewerConfirmed: true };

equal(minimumPublishableWords("6e"), 175, "la 6e exige au moins la moitié de la cible de calibrage");
equal(minimumPublishableWords("sec1"), 275, "le secondaire 1 possède un minimum de publication propre");
equal(minimumPublishableWords("sec2"), 325, "le secondaire 2 possède un minimum de publication propre");

const ready = buildPublicationReadiness(exercise(), manualAudit(), options);
ok(ready.canPublish, "un exercice complet, relu et aperçu peut être publié");
equal(ready.blockers.length, 0, "aucun blocage ne demeure pour l’exercice prêt");
ok(ready.checklist.every((item) => item.state === "pass"), "toute la checklist est conforme pour l’exercice prêt");

const noPreview = buildPublicationReadiness(exercise(), manualAudit(), { reviewerConfirmed: true });
ok(!noPreview.canPublish, "la publication est bloquée sans aperçu final vérifié");
ok(noPreview.blockers.some((item) => item.includes("aperçu final")), "le blocage d’aperçu est explicite");

const noConfirmation = buildPublicationReadiness(exercise(), manualAudit(), { finalPreviewReviewed: true });
ok(!noConfirmation.canPublish, "la publication est bloquée sans confirmation de relecture");
ok(noConfirmation.blockers.some((item) => item.includes(PUBLICATION_REVIEW_CONFIRMATION)), "la phrase exacte de confirmation est exigée");

const emptyText = buildPublicationReadiness(exercise({ text: "" }), manualAudit(), options);
ok(!emptyText.canPublish, "un texte vide bloque la publication");
ok(emptyText.blockers.some((item) => item.includes("texte est vide")), "le texte vide est nommé");

const shortText = buildPublicationReadiness(exercise({ text: "Texte beaucoup trop court pour constituer un exercice complet." }), manualAudit(), options);
ok(!shortText.canPublish, "un texte trop court bloque la publication");
ok(shortText.blockers.some((item) => item.includes("trop court")), "le minimum de longueur est expliqué");

const noQuestions = buildPublicationReadiness(exercise({ questions: [] }), manualAudit(), options);
ok(!noQuestions.canPublish, "l’absence de question bloque la publication");
ok(noQuestions.blockers.some((item) => item.includes("Aucune question")), "l’absence de question est nommée");

const noDimensionExercise = exercise();
noDimensionExercise.questions[1] = { ...noDimensionExercise.questions[1], dimension: "" };
const noDimension = buildPublicationReadiness(noDimensionExercise, manualAudit(), options);
ok(!noDimension.canPublish, "une question sans dimension bloque la publication");
ok(noDimension.blockers.some((item) => item.includes("dimension absente")), "la question sans dimension est identifiée");

const missingCritical = buildPublicationReadiness(exercise({ intention: "", category: "" }), manualAudit(), options);
ok(!missingCritical.canPublish, "un champ critique vide bloque la publication");
ok(missingCritical.blockers.some((item) => item.includes("Intention de lecture")), "l’intention vide est identifiée");
ok(missingCritical.blockers.some((item) => item.includes("Catégorie")), "la catégorie vide est identifiée");

const blockedManual = buildPublicationReadiness(exercise(), manualAudit({ status: "blocked" }), options);
ok(!blockedManual.canPublish, "le statut manuel Bloqué empêche la publication");
ok(blockedManual.blockers.some((item) => item.includes("indique Bloqué")), "le blocage manuel est expliqué");

const proofCriteria = emptyManualCriteria();
for (const group of Object.values(proofCriteria)) {
  for (const key of Object.keys(group)) group[key] = "pass";
}
proofCriteria.questions.proofAvailable = "review";
const impossibleProof = buildPublicationReadiness(exercise(), manualAudit({ criteria: proofCriteria }), options);
ok(!impossibleProof.canPublish, "une preuve obligatoire impossible bloque la publication");
ok(impossibleProof.blockers.some((item) => item.includes("preuve obligatoire")), "l’impossibilité de preuve est nommée");

const pendingCriteria = emptyManualCriteria();
pendingCriteria.text.levelAppropriate = "pass";
const incompleteManual = buildPublicationReadiness(exercise(), manualAudit({ status: "pending", criteria: pendingCriteria }), options);
ok(incompleteManual.canPublish, "un audit manuel incomplet produit un avertissement, pas un blocage");
ok(incompleteManual.warnings.some((item) => item.includes("n’est pas terminé")), "l’audit incomplet est signalé");

const explicitExercise = exercise({
  questions: [
    question("e1", "comprendre", "explicite"),
    question("e2", "comprendre", "explicite"),
    question("e3", "comprendre", "explicite"),
    question("e4", "inferer")
  ]
});
const explicitWarning = buildPublicationReadiness(explicitExercise, manualAudit(), options);
ok(explicitWarning.canPublish, "la domination explicite avertit sans bloquer");
ok(explicitWarning.warnings.some((item) => item.includes("Trop de questions explicites")), "la proportion explicite est signalée");

const noInferenceExercise = exercise({
  questions: [
    question("c1", "comprendre", "explicite"),
    question("c2", "comprendre", "explicite"),
    question("c3", "reagir", "opinion_justifiee"),
    question("c4", "apprecier", "jugement_critique")
  ]
});
const noInference = buildPublicationReadiness(noInferenceExercise, manualAudit(), options);
ok(noInference.canPublish, "l’absence d’inférence avertit sans bloquer");
ok(noInference.warnings.some((item) => item.includes("Aucune question d’inférence")), "l’absence d’inférence ou d’interprétation est signalée");

const record = buildPublicationReviewRecord(ready, options);
ok(record, "un enregistrement de relecture est produit pour une publication valide");
equal(record.confirmationText, PUBLICATION_REVIEW_CONFIRMATION, "la confirmation exacte est conservée dans le relevé");
equal(record.finalPreviewReviewed, true, "l’aperçu final vérifié est inscrit");
equal(buildPublicationReviewRecord(noPreview, options), null, "aucun relevé n’est produit pour un exercice bloqué");

console.log(`Bloc 11 — porte de publication : ${checks} assertions réussies.`);
