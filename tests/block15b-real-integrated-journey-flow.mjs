import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import baseExercises from "../app/data/exercises.js";
import moreExercises from "../app/data/moreExercises.js";
import genesisExercise from "../app/data/genesisExercise.js";
import secondaryExercises from "../app/data/secondaryExercises.js";
import {
  BUILT_IN_INTEGRATED_JOURNEYS,
  INTEGRATED_JOURNEY_ACTIVE_KEY,
  INTEGRATED_JOURNEY_HISTORY_KEY,
  INTEGRATED_JOURNEY_NOTES_KEY,
  JOURNEY_HISTORY_DEDUPE_MS,
  MAX_INTEGRATED_JOURNEY_HISTORY,
  READING_WORK_STORAGE_KEY,
  WRITING_WORK_STORAGE_KEY,
  addIntegratedJourneyHistoryEvent,
  buildIntegratedJourneyHistoryExport,
  buildJourneyNoteSheet,
  buildReadingWorkForJourney,
  buildWritingWorkForJourney,
  completeIntegratedJourney,
  inspectReadingWork,
  inspectWritingWork,
  readActiveIntegratedJourney,
  readIntegratedJourneyHistory,
  readJourneyNoteSheet,
  sanitizeIntegratedJourneyHistory,
  startIntegratedJourney,
  synchronizeIntegratedJourney,
  validateIntegratedJourney,
  validateIntegratedJourneyHistory,
  writeJourneyNoteSheet
} from "../lib/integratedJourney.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    clear() { values.clear(); },
    keys() { return [...values.keys()]; }
  };
}

function uniqueExercises(values) {
  const seen = new Set();
  return values.filter((exercise) => {
    if (!exercise?.id || seen.has(exercise.id)) return false;
    seen.add(exercise.id);
    return true;
  });
}

const exercises = uniqueExercises([...baseExercises, ...moreExercises, genesisExercise, ...secondaryExercises]);
const journeyPageSource = readFileSync(new URL("../app/parcours/page.jsx", import.meta.url), "utf8");
const step5Source = readFileSync(new URL("../app/ecriture/Step5Revision.jsx", import.meta.url), "utf8");
const ministryPanelSource = readFileSync(new URL("../app/ecriture/WritingMinistryFeedbackPanel.jsx", import.meta.url), "utf8");
const adminSource = readFileSync(new URL("../app/admin/AdminIntegratedJourneys.jsx", import.meta.url), "utf8");
const modelSource = readFileSync(new URL("../lib/integratedJourney.js", import.meta.url), "utf8");

let checks = 0;
function ok(value, message) { checks += 1; assert.ok(value, message); }
function equal(actual, expected, message) { checks += 1; assert.equal(actual, expected, message); }
function deepEqual(actual, expected, message) { checks += 1; assert.deepEqual(actual, expected, message); }

function sourceSection(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  ok(start >= 0, `la source contient ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  ok(end > start, `la source contient la fin de section ${endMarker}`);
  return source.slice(start, end);
}

// 1. Parcours réel en entraînement : choix, lecture, questions, notes, écriture, révision et bilan.
const trainingJourney = BUILT_IN_INTEGRATED_JOURNEYS.find((journey) => journey.levelId === "6e" && journey.writingTypeId === "explicatif");
ok(trainingJourney, "un parcours explicatif de 6e existe");
const trainingAudit = validateIntegratedJourney(trainingJourney, exercises);
equal(trainingAudit.valid, true, "le parcours de 6e est valide");
ok(trainingAudit.exercise, "le texte associé est présent dans la banque réelle");
equal(trainingAudit.exercise.id, trainingJourney.exerciseId, "le parcours ouvre le texte attendu");
ok(String(trainingAudit.exercise.text || "").length > 500, "le texte associé contient un contenu de lecture réel");
ok(Array.isArray(trainingAudit.exercise.questions) && trainingAudit.exercise.questions.length >= 6, "le texte possède une série réelle de questions");

const trainingStorage = memoryStorage();
const activeTraining = startIntegratedJourney(trainingJourney, "training", trainingStorage);
equal(activeTraining.modeId, "training", "le parcours démarre en entraînement");
equal(activeTraining.stage, "reading", "la première étape est la lecture");
equal(readActiveIntegratedJourney(trainingStorage).journeyId, trainingJourney.id, "le parcours actif est repris depuis sa clé locale");
ok(trainingStorage.keys().includes(INTEGRATED_JOURNEY_ACTIVE_KEY), "l’état actif utilise une clé locale dédiée");
ok(trainingStorage.keys().includes(INTEGRATED_JOURNEY_HISTORY_KEY), "le début du parcours crée uniquement un historique minimal");

const initialReading = buildReadingWorkForJourney(trainingJourney, trainingAudit.exercise, "training");
equal(initialReading.exerciseId, trainingJourney.exerciseId, "la sauvegarde de lecture pointe vers le texte associé");
equal(initialReading.selectedLevel, "6e", "le niveau 6e est transmis au module de lecture");
equal(initialReading.learningMode, "training", "le mode entraînement est transmis au module de lecture");
equal(Object.keys(initialReading.answers).length, 0, "aucune réponse n’est générée automatiquement");

const questions = trainingAudit.exercise.questions.slice(0, 3);
const answerSamples = [
  "Réponse locale sur la formation du phénomène.",
  "Réponse locale sur les couleurs observées.",
  "Réponse locale sur une conséquence possible."
];
const readingWork = {
  ...initialReading,
  step: 6,
  answers: Object.fromEntries(questions.map((question, index) => [question.id, answerSamples[index]])),
  notes: {
    0: "Le phénomène dépend de particules chargées.",
    2: "Les couleurs varient selon les gaz et l’altitude."
  },
  proofs: [
    { id: "preuve-1", questionId: questions[0].id, text: "Passage local retenu par l’élève.", kind: "important" }
  ]
};
trainingStorage.setItem(READING_WORK_STORAGE_KEY, JSON.stringify(readingWork));
const readingInspection = inspectReadingWork(readingWork, trainingAudit.exercise);
equal(readingInspection.questionsCompleted, 3, "les trois réponses simulées sont comptées");
equal(readingInspection.noteCount, 3, "les deux notes et le passage retenu sont comptés");
equal(readingInspection.readyForWriting, true, "la lecture préparatoire permet le passage vers l’écriture");

const noteSheet = buildJourneyNoteSheet(readingWork, trainingAudit.exercise, "training");
equal(noteSheet.modeId, "training", "la feuille de notes conserve le mode entraînement");
ok(noteSheet.rows.some((row) => row.sourceType === "reading-note"), "les notes de lecture alimentent la feuille active");
ok(noteSheet.rows.some((row) => row.sourceType === "selected-passage"), "le passage retenu alimente la feuille active");
ok(noteSheet.rows.some((row) => row.sourceType === "question"), "les questions complétées fournissent des repères sans copier les réponses");
const noteSheetSerialized = JSON.stringify(noteSheet);
answerSamples.forEach((answer) => ok(!noteSheetSerialized.includes(answer), "la feuille guidée ne copie pas les réponses complètes"));

const historyBeforeNoteSave = readIntegratedJourneyHistory(trainingStorage);
const savedNoteSheet = writeJourneyNoteSheet({ ...noteSheet, journeyId: trainingJourney.id }, trainingStorage);
equal(readJourneyNoteSheet(trainingStorage).journeyId, trainingJourney.id, "la feuille locale peut être reprise");
ok(trainingStorage.keys().includes(INTEGRATED_JOURNEY_NOTES_KEY), "la feuille active utilise une clé distincte");
equal(readIntegratedJourneyHistory(trainingStorage).length, historyBeforeNoteSave.length, "sauvegarder les notes actives ne les ajoute pas à l’historique");
ok(JSON.stringify(savedNoteSheet).includes("Passage local retenu"), "le travail actif conserve le passage nécessaire à la reprise locale");

const writingWork = buildWritingWorkForJourney(trainingJourney, savedNoteSheet, "training");
equal(writingWork.situationId, trainingJourney.writingTypeId, "le type d’écriture est transmis");
equal(writingWork.purpose, trainingJourney.writingIntention, "l’intention d’écriture est transmise");
equal(writingWork.textId, trainingJourney.exerciseId, "le texte source reste associé à l’écriture");
equal(writingWork.examMode, false, "l’écriture demeure en entraînement");
equal(writingWork.draft, "", "aucun brouillon n’est généré automatiquement");
equal(writingWork.finalText, "", "aucune version finale n’est générée automatiquement");
ok(writingWork.examNotes.length >= 3, "la feuille de notes est transmise au module d’écriture");
trainingStorage.setItem(WRITING_WORK_STORAGE_KEY, JSON.stringify(writingWork));

const notesTransition = synchronizeIntegratedJourney(
  activeTraining,
  readingWork,
  writingWork,
  trainingAudit.exercise,
  savedNoteSheet,
  trainingStorage
);
equal(notesTransition.active.stage, "notes", "la transition « Ce que je garde pour écrire » est reconnue");

const revisionWork = {
  ...writingWork,
  step: 5,
  draft: "Brouillon sensible conservé uniquement dans la sauvegarde de travail.",
  checks: {
    "ministere-ecriture-adaptation": true,
    "ministere-ecriture-coherence": true,
    "ministere-ecriture-vocabulaire": true,
    "ministere-ecriture-phrases": true,
    "ministere-ecriture-orthographe": true
  }
};
trainingStorage.setItem(WRITING_WORK_STORAGE_KEY, JSON.stringify(revisionWork));
const revisionInspection = inspectWritingWork(revisionWork);
equal(revisionInspection.reviewReached, true, "l’étape réelle de révision est reconnue");
equal(revisionInspection.criteriaWorkedCount, 5, "les cinq critères ministériels sont comptés");
const reviewTransition = synchronizeIntegratedJourney(
  notesTransition.active,
  readingWork,
  revisionWork,
  trainingAudit.exercise,
  savedNoteSheet,
  trainingStorage
);
equal(reviewTransition.active.stage, "review", "le parcours atteint la révision");
equal(reviewTransition.active.questionsCompleted, 3, "le bilan actif conserve seulement le nombre de questions");
equal(reviewTransition.active.criteriaWorkedCount, 5, "le bilan actif conserve seulement le nombre de critères");
const completedTraining = completeIntegratedJourney(reviewTransition.active, trainingStorage);
equal(completedTraining.stage, "completed", "le parcours peut être terminé après la révision");

// 2. Bilan minimal et séparation stricte des données.
const trainingHistory = readIntegratedJourneyHistory(trainingStorage);
ok(trainingHistory.some((event) => event.eventType === "journey_started"), "l’historique contient le début du parcours");
ok(trainingHistory.some((event) => event.eventType === "review_reached"), "l’historique contient l’atteinte de la révision");
ok(trainingHistory.some((event) => event.eventType === "journey_completed"), "l’historique contient la fin du parcours");
equal(validateIntegratedJourneyHistory(trainingHistory).valid, true, "l’historique réel respecte le schéma minimal");

const allowedHistoryKeys = [
  "criteriaWorkedCount", "eventType", "id", "journeyId", "levelId", "modeId",
  "noteCount", "occurredAt", "questionCount", "questionsCompleted", "stage",
  "version", "writingStep"
].sort();
trainingHistory.forEach((event) => {
  deepEqual(Object.keys(event).sort(), allowedHistoryKeys, "chaque événement ne contient que les métadonnées autorisées");
});

const historyExport = buildIntegratedJourneyHistoryExport(trainingHistory, [trainingJourney]);
const historyExportSerialized = JSON.stringify(historyExport);
for (const forbiddenContent of [
  ...answerSamples,
  "Passage local retenu par l’élève.",
  "Le phénomène dépend de particules chargées.",
  "Les couleurs varient selon les gaz et l’altitude.",
  "Brouillon sensible conservé uniquement",
  "finalText",
  "studentAnswer",
  "proofText",
  "personalizedFeedback",
  "correctedText",
  "rewrittenText",
  "replacementText"
]) {
  ok(!historyExportSerialized.includes(forbiddenContent), `l’export minimal exclut « ${forbiddenContent} »`);
}
equal(historyExport.privacy.containsStudentAnswers, false, "l’export déclare l’absence de réponses");
equal(historyExport.privacy.containsSelectedProofs, false, "l’export déclare l’absence de preuves");
equal(historyExport.privacy.containsWritingDrafts, false, "l’export déclare l’absence de brouillons");
equal(historyExport.privacy.containsFinalTexts, false, "l’export déclare l’absence de versions finales");
equal(historyExport.privacy.containsPersonalizedFeedback, false, "l’export déclare l’absence de rétroaction personnalisée");

// 3. Parcours réel en simulation.
const simulationJourney = BUILT_IN_INTEGRATED_JOURNEYS.find((journey) => journey.levelId === "sec2");
ok(simulationJourney, "un parcours de secondaire 2 existe pour la simulation");
const simulationAudit = validateIntegratedJourney(simulationJourney, exercises);
equal(simulationAudit.valid, true, "le parcours de simulation est valide");
const simulationStorage = memoryStorage();
const activeSimulation = startIntegratedJourney(simulationJourney, "simulation", simulationStorage);
equal(activeSimulation.modeId, "simulation", "le parcours démarre en simulation");
const initialSimulationReading = buildReadingWorkForJourney(simulationJourney, simulationAudit.exercise, "simulation");
equal(initialSimulationReading.learningMode, "simulation", "le mode simulation est transmis à la lecture");

const simulationReading = {
  ...initialSimulationReading,
  step: 6,
  answers: {
    [simulationAudit.exercise.questions[0].id]: "Réponse de simulation qui ne doit jamais être recopiée."
  },
  notes: Object.fromEntries(Array.from({ length: 6 }, (_, index) => [index, `Note personnelle ${index + 1}`])),
  proofs: Array.from({ length: 3 }, (_, index) => ({
    id: `passage-${index + 1}`,
    questionId: simulationAudit.exercise.questions[0].id,
    text: `Passage personnel ${index + 1}`,
    kind: "important"
  }))
};
const simulationSheet = buildJourneyNoteSheet(simulationReading, simulationAudit.exercise, "simulation");
equal(simulationSheet.modeId, "simulation", "la feuille conserve le mode simulation");
ok(simulationSheet.rows.length <= 5, "la feuille de simulation est limitée à cinq lignes");
ok(simulationSheet.rows.every((row) => row.sourceType !== "question"), "aucune question-guide n’est ajoutée");
ok(simulationSheet.rows.every((row) => !row.sourceLabel.includes("Question complétée")), "aucun repère de contenu lié aux questions n’est ajouté");
ok(!JSON.stringify(simulationSheet).includes("Réponse de simulation"), "la réponse de simulation n’est jamais copiée dans la feuille");

const simulationWriting = buildWritingWorkForJourney(simulationJourney, simulationSheet, "simulation");
equal(simulationWriting.examMode, true, "examMode est transmis au module d’écriture");
equal(simulationWriting.situationId, simulationJourney.writingTypeId, "le type d’écriture de simulation est transmis");
equal(simulationWriting.purpose, simulationJourney.writingIntention, "l’intention de simulation est transmise");
equal(simulationWriting.draft, "", "aucune réponse finale n’est fournie en simulation");
equal(simulationWriting.finalText, "", "aucune version finale n’est fournie en simulation");
ok(simulationWriting.examNotes.length <= 5, "la limite de la feuille est conservée dans l’écriture");

const simulationBranch = sourceSection(step5Source, "if (examMode) {", "\n\n  return (");
ok(simulationBranch.includes("WritingMinistryFeedbackPanel"), "la simulation affiche la liste ministérielle");
ok(!simulationBranch.includes("Tableau de bord de révision"), "la simulation masque le tableau de bord analytique");
ok(!simulationBranch.includes("revisionCriteria.map"), "la simulation masque les questions de révision propres au type");
ok(!simulationBranch.includes("successCriteria.map"), "la simulation masque les critères de réussite guidés");
ok(!simulationBranch.includes("Actions de révision possibles"), "la simulation masque les suggestions de révision");
ok(!simulationBranch.includes("Voir mon plan pour comparer"), "la simulation masque la comparaison guidée avec le plan");

const ministrySimulationBranch = sourceSection(ministryPanelSource, "if (examMode) {", "\n\n  return (");
ok(ministrySimulationBranch.includes("cinq critères d’écriture"), "la simulation présente les cinq autoévaluations ministérielles");
ok(ministrySimulationBranch.includes("Aucune analyse ciblée ni suggestion de contenu"), "la limite de la simulation est explicitement annoncée");
ok(!ministrySimulationBranch.includes("onClick={analyze}"), "aucun bouton d’analyse automatisée n’est présent dans la branche simulation");
ok(!ministrySimulationBranch.includes("feedback.criteria.map"), "aucune rétroaction personnalisée n’est rendue dans la branche simulation");

// 4. Garde-fous pédagogiques.
const standaloneStorage = memoryStorage();
equal(readActiveIntegratedJourney(standaloneStorage), null, "la lecture autonome n’exige aucun parcours actif");
const standaloneReading = inspectReadingWork({ step: 1, answers: {}, notes: {}, proofs: [] }, trainingAudit.exercise);
equal(standaloneReading.readingStarted, false, "une lecture autonome vide reste valide");

const emptyPreparation = inspectReadingWork(initialReading, trainingAudit.exercise);
equal(emptyPreparation.readyForWriting, false, "une écriture sans lecture préparatoire est détectée");
ok(emptyPreparation.warning.includes("aucune lecture préparatoire"), "l’écriture sans préparation est signalée explicitement");
ok(journeyPageSource.includes("Ouvrir tout de même l’écriture?"), "l’interface permet néanmoins de poursuivre après confirmation");

const levelMismatch = validateIntegratedJourney({ ...trainingJourney, id: "niveau-incompatible", levelId: "sec2" }, exercises);
equal(levelMismatch.valid, false, "un niveau incompatible est bloqué");
ok(levelMismatch.errors.some((error) => error.includes("ne correspond pas")), "le motif du blocage de niveau est visible");

const incompleteLocalJourney = validateIntegratedJourney({
  id: "parcours-local-incomplet",
  title: "",
  exerciseId: trainingJourney.exerciseId,
  levelId: "6e",
  readingTextType: "informatif",
  readingIntention: "",
  writingTypeId: "explicatif",
  writingIntention: "",
  status: "draft",
  source: "local"
}, exercises);
equal(incompleteLocalJourney.valid, false, "un parcours local incomplet n’est pas valide");
ok(incompleteLocalJourney.errors.length >= 3, "les champs incomplets sont signalés");
const invalidGuardIndex = adminSource.indexOf("if (!audit.valid)");
const writeLocalIndex = adminSource.indexOf("writeCustomIntegratedJourney", invalidGuardIndex);
ok(invalidGuardIndex >= 0 && writeLocalIndex > invalidGuardIndex, "l’admin bloque le parcours incomplet avant son enregistrement");
ok(adminSource.slice(invalidGuardIndex, writeLocalIndex).includes("return;"), "le garde-fou interrompt réellement la publication locale");

// 5. Dédoublonnage, limite maximale et export JSON.
const fixedEvent = {
  occurredAt: "2026-08-02T00:00:00.000Z",
  journeyId: trainingJourney.id,
  levelId: "6e",
  modeId: "training",
  eventType: "journey_started",
  stage: "reading"
};
let deduped = addIntegratedJourneyHistoryEvent([], fixedEvent);
deduped = addIntegratedJourneyHistoryEvent(deduped, {
  ...fixedEvent,
  occurredAt: new Date(new Date(fixedEvent.occurredAt).getTime() + JOURNEY_HISTORY_DEDUPE_MS - 1).toISOString()
});
equal(deduped.length, 1, "deux événements identiques dans la fenêtre sont dédoublonnés");
const outsideWindow = addIntegratedJourneyHistoryEvent(deduped, {
  ...fixedEvent,
  occurredAt: new Date(new Date(fixedEvent.occurredAt).getTime() + JOURNEY_HISTORY_DEDUPE_MS + 1).toISOString()
});
equal(outsideWindow.length, 2, "un événement identique hors fenêtre est conservé");

const oversizedHistory = Array.from({ length: MAX_INTEGRATED_JOURNEY_HISTORY + 37 }, (_, index) => ({
  ...fixedEvent,
  id: `historique-${index}`,
  occurredAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
  questionsCompleted: index
}));
equal(sanitizeIntegratedJourneyHistory(oversizedHistory).length, MAX_INTEGRATED_JOURNEY_HISTORY, "l’historique respecte sa limite maximale");

// 6. Vérification de la chaîne visible et de l’absence d’infrastructure distante.
for (const expectedText of [
  "Parcours complet lecture → écriture",
  "Ce que je garde pour écrire",
  "Préparer ma feuille de notes",
  "Passer à la planification et à l’écriture",
  "Progression lecture + écriture",
  "Terminer et enregistrer le bilan minimal"
]) {
  ok(journeyPageSource.includes(expectedText), `la route /parcours affiche « ${expectedText} »`);
}
ok(journeyPageSource.includes("window.location.href = \"/\""), "le parcours renvoie vers le module réel de lecture");
ok(journeyPageSource.includes("window.location.href = \"/ecriture\""), "le parcours renvoie vers le module réel d’écriture");
ok(journeyPageSource.includes("buildWritingWorkForJourney"), "le transfert vers l’écriture utilise le modèle commun");
ok(journeyPageSource.includes("synchronizeIntegratedJourney"), "le bilan se synchronise avec les sauvegardes réelles");
ok(journeyPageSource.includes("Ce bilan ne conserve ni réponses de lecture"), "la limite du bilan est visible pour l’élève");
ok(adminSource.includes("Il exclut les réponses, preuves, notes actives, brouillons, versions finales et rétroactions personnalisées"), "la distinction avec les notes actives demeure visible dans l’admin");

const remoteInfrastructurePattern = /\b(fetch|axios|XMLHttpRequest|WebSocket|EventSource|supabase|firebase|indexedDB)\b/i;
for (const [name, source] of [
  ["modèle de parcours", modelSource],
  ["route élève", journeyPageSource],
  ["section admin", adminSource]
]) {
  ok(!remoteInfrastructurePattern.test(source), `${name} ne contient aucun appel réseau, service distant ou base de données`);
}
ok(modelSource.includes("localStorage"), "le modèle utilise seulement le stockage local du navigateur");
ok(!modelSource.includes("navigator.sendBeacon"), "aucune télémétrie de parcours n’est envoyée");

console.log(`Bloc 15b — parcours réel lecture-écriture : ${checks} assertions réussies.`);
