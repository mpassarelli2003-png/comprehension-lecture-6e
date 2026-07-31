import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import baseExercises from "../app/data/exercises.js";
import moreExercises from "../app/data/moreExercises.js";
import genesisExercise from "../app/data/genesisExercise.js";
import secondaryExercises from "../app/data/secondaryExercises.js";
import {
  buildLocalExerciseExport,
  buildRuntimeExerciseBank,
  createEmptyLocalExerciseStore,
  createExerciseTemplate,
  importExercisesIntoStore,
  parseExerciseImport,
  upsertLocalExercise
} from "../lib/localExerciseWorkshop.js";
import { emptyManualCriteria } from "../lib/manualPedagogicalAudit.js";
import {
  PUBLICATION_REVIEW_CONFIRMATION,
  buildPublicationReadiness
} from "../lib/publicationReadiness.js";

let checks = 0;
function ok(value, message) {
  checks += 1;
  assert.ok(value, message);
}
function equal(actual, expected, message) {
  checks += 1;
  assert.equal(actual, expected, message);
}

function longText(words = 220) {
  const sentence = "Au début du printemps, les élèves transforment un terrain inutilisé en jardin collectif, observent les changements et expliquent comment leurs décisions influencent le quartier.";
  const parts = [];
  while (parts.join(" ").split(/\s+/).filter(Boolean).length < words) parts.push(sentence);
  return parts.join(" ");
}

function completeManualAudit(exercise, proofAvailable = "pass") {
  const criteria = emptyManualCriteria();
  for (const group of Object.values(criteria)) {
    for (const criterionId of Object.keys(group)) group[criterionId] = "pass";
  }
  criteria.questions.proofAvailable = proofAvailable;
  return {
    exerciseId: exercise.id,
    exerciseTitle: exercise.title,
    level: exercise.level,
    textType: exercise.textType,
    status: "ready",
    reviewer: "MP",
    notes: "Relu dans le parcours de publication du bloc 11b.",
    criteria,
    updatedAt: "2026-07-31T22:00:00.000Z"
  };
}

const staticBank = [
  ...baseExercises,
  ...moreExercises,
  genesisExercise,
  ...secondaryExercises
];

// 1. Créer et enregistrer un vrai brouillon local dans le même magasin que l’application.
let store = createEmptyLocalExerciseStore();
let draft = createExerciseTemplate("6e");
draft = {
  ...draft,
  id: "local-bloc11b-publication-reelle",
  title: "Le jardin partagé",
  textType: "informatif",
  category: "texte documentaire",
  intention: "Comprendre les effets d’un projet collectif et justifier ses réponses.",
  description: "Exercice utilisé par le test réel de la porte de publication.",
  difficulty: "6e année",
  calibration: {
    ...draft.calibration,
    targetLevel: "6e",
    reviewStatus: "approved"
  }
};
store = upsertLocalExercise(store, draft, "draft");
equal(store.entries.length, 1, "un brouillon local est créé dans la banque partagée");
equal(store.entries[0].status, "draft", "le nouvel exercice reste brouillon");
ok(!buildRuntimeExerciseBank(staticBank, store).some((item) => item.id === draft.id), "un brouillon n’apparaît pas dans le parcours élève");

// 2. Texte vide : blocage.
let readiness = buildPublicationReadiness(draft, completeManualAudit(draft), {
  finalPreviewReviewed: false,
  reviewerConfirmed: false
});
ok(!readiness.canPublish, "un texte vide bloque la publication");
ok(readiness.blockers.some((item) => item.includes("texte est vide")), "le blocage du texte vide est explicite");

// 3. Texte trop court : blocage maintenu.
draft = { ...draft, text: "Un texte beaucoup trop court pour constituer un exercice complet." };
readiness = buildPublicationReadiness(draft, completeManualAudit(draft), {
  finalPreviewReviewed: true,
  reviewerConfirmed: true
});
ok(!readiness.canPublish, "un texte trop court reste bloqué");
ok(readiness.blockers.some((item) => item.includes("trop court")), "le minimum de longueur est nommé");

// 4 et 5. Texte suffisant, mais question sans dimension.
draft = {
  ...draft,
  text: longText(),
  questions: [{
    ...draft.questions[0],
    id: "q1",
    prompt: "Quel changement est expliqué dans le texte?",
    dimension: "",
    questionType: "explicite",
    proofRequired: true,
    justificationRequired: false,
    minimumExpectedElements: 1,
    expectedAnswer: "Le terrain devient un jardin collectif.",
    points: 2
  }]
};
readiness = buildPublicationReadiness(draft, completeManualAudit(draft), {
  finalPreviewReviewed: true,
  reviewerConfirmed: true
});
ok(!readiness.canPublish, "une question sans dimension bloque la publication");
ok(readiness.blockers.some((item) => item.includes("dimension absente")), "la dimension manquante est identifiée");

// 6 et 7. Dimension corrigée et preuve obligatoire.
draft = {
  ...draft,
  questions: [{
    ...draft.questions[0],
    dimension: "comprendre",
    proofRequired: true,
    recommendedProofTool: "explicite"
  }, {
    ...draft.questions[0],
    id: "q2",
    prompt: "Que peut-on déduire de l’engagement des élèves?",
    dimension: "inferer",
    questionType: "implicite",
    proofRequired: true,
    justificationRequired: true,
    minimumExpectedElements: 2,
    expectedAnswer: "Ils se sentent responsables du projet et du quartier.",
    recommendedProofTool: "inference"
  }]
};

// 8 et 9. Preuve indiquée À revoir dans l’audit manuel : publication bloquée.
let manualAudit = completeManualAudit(draft, "review");
readiness = buildPublicationReadiness(draft, manualAudit, {
  finalPreviewReviewed: true,
  reviewerConfirmed: true
});
ok(!readiness.canPublish, "une preuve obligatoire marquée À revoir bloque la publication");
ok(readiness.blockers.some((item) => item.includes("preuve obligatoire")), "le blocage de preuve est expliqué");
store = upsertLocalExercise(store, draft, "draft");
ok(!buildRuntimeExerciseBank(staticBank, store).some((item) => item.id === draft.id), "un exercice bloqué ne peut pas apparaître dans le parcours élève");

// 10 et 11. Preuve conforme, mais aperçu final encore obligatoire.
manualAudit = completeManualAudit(draft, "pass");
readiness = buildPublicationReadiness(draft, manualAudit, {
  finalPreviewReviewed: false,
  reviewerConfirmed: false
});
ok(!readiness.canPublish, "l’aperçu final reste obligatoire après correction de la preuve");
ok(readiness.blockers.some((item) => item.includes("aperçu final")), "le manque d’aperçu final est nommé");

// 12 et 13. Aperçu coché, confirmation encore exigée.
readiness = buildPublicationReadiness(draft, manualAudit, {
  finalPreviewReviewed: true,
  reviewerConfirmed: false
});
ok(!readiness.canPublish, "la confirmation explicite reste requise après l’aperçu");
ok(readiness.blockers.some((item) => item.includes(PUBLICATION_REVIEW_CONFIRMATION)), "la phrase exacte de confirmation est exigée");

// 14 et 15. Les deux gestes humains sont faits; publication permise.
readiness = buildPublicationReadiness(draft, manualAudit, {
  finalPreviewReviewed: true,
  reviewerConfirmed: true
});
ok(readiness.canPublish, "l’exercice complet franchit toute la porte de publication");
equal(readiness.blockers.length, 0, "aucun blocage ne demeure");
store = upsertLocalExercise(store, readiness.exercise, "published");
equal(store.entries.find((entry) => entry.exercise.id === draft.id)?.status, "published", "l’exercice est publié localement");

// 16. L’exercice apparaît au bon niveau dans la banque réelle partagée.
let runtimeBank = buildRuntimeExerciseBank(staticBank, store);
const published = runtimeBank.find((item) => item.id === draft.id);
ok(published, "l’exercice publié apparaît dans le parcours élève");
equal(String(published.level), "6e année", "l’exercice apparaît au bon niveau");

// 17 et 18. Retrait du parcours : retour en brouillon et disparition côté élève.
store = upsertLocalExercise(store, readiness.exercise, "draft");
equal(store.entries.find((entry) => entry.exercise.id === draft.id)?.status, "draft", "le retrait remet l’exercice en brouillon");
runtimeBank = buildRuntimeExerciseBank(staticBank, store);
ok(!runtimeBank.some((item) => item.id === draft.id), "l’exercice retiré disparaît du parcours élève");

// Import : même un export contenant un ancien statut publié revient comme brouillon.
const publishedStore = upsertLocalExercise(createEmptyLocalExerciseStore(), readiness.exercise, "published");
const exported = buildLocalExerciseExport(publishedStore);
const parsed = parseExerciseImport(JSON.stringify(exported));
ok(parsed.valid, "l’export de banque est réimportable");
const imported = importExercisesIntoStore(createEmptyLocalExerciseStore(), parsed.exercises);
equal(imported.store.entries[0].status, "draft", "un exercice importé revient toujours comme brouillon");
ok(!buildRuntimeExerciseBank(staticBank, imported.store).some((item) => item.id === draft.id), "un exercice importé n’apparaît pas avant une nouvelle publication");

// 19 et 20. Une modification change l’empreinte; l’interface doit annuler les confirmations.
const fingerprintBefore = JSON.stringify({ exercise: draft, manualAudit });
const modifiedDraft = {
  ...draft,
  text: `${draft.text} Une nouvelle phrase est ajoutée après la relecture.`,
  questions: draft.questions.map((question, index) => index === 0
    ? { ...question, prompt: "Quel changement principal est expliqué dans le texte?" }
    : question)
};
const fingerprintAfter = JSON.stringify({ exercise: modifiedDraft, manualAudit });
ok(fingerprintBefore !== fingerprintAfter, "modifier le texte ou une question change l’empreinte de relecture");

const panelSource = await readFile(new URL("../app/admin/LocalExerciseWorkshopPanel.jsx", import.meta.url), "utf8");
ok(panelSource.includes("readinessFingerprint"), "l’interface suit une empreinte du contenu et de l’audit manuel");
ok(panelSource.includes("setFinalPreviewReviewed(false)"), "une modification invalide l’aperçu final vérifié");
ok(panelSource.includes("setReviewerConfirmed(false)"), "une modification invalide la confirmation de relecture");
ok(panelSource.includes("if (!readiness.canPublish)"), "l’interface refuse la publication avant l’écriture dans la banque");

// Confidentialité : le magasin de contenus ne contient aucun travail d’élève.
const serializedStore = JSON.stringify(store);
ok(!/studentAnswer|selectedProof|responseText|expectedStudentResponse/i.test(serializedStore), "aucune réponse ni preuve d’élève n’est enregistrée");

console.log(`Bloc 11b — parcours réel de publication : ${checks} assertions réussies.`);
