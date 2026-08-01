import assert from "node:assert/strict";
import baseExercises from "../app/data/exercises.js";
import moreExercises from "../app/data/moreExercises.js";
import genesisExercise from "../app/data/genesisExercise.js";
import secondaryExercises from "../app/data/secondaryExercises.js";
import {
  BUILT_IN_INTEGRATED_JOURNEYS,
  INTEGRATED_JOURNEY_HISTORY_KEY,
  MAX_INTEGRATED_JOURNEY_HISTORY,
  READING_WORK_STORAGE_KEY,
  WRITING_WORK_STORAGE_KEY,
  addIntegratedJourneyHistoryEvent,
  buildIntegratedJourneyHistoryExport,
  buildJourneyNoteSheet,
  buildReadingWorkForJourney,
  buildWritingWorkForJourney,
  completeIntegratedJourney,
  getIntegratedJourneyBank,
  inspectReadingWork,
  inspectWritingWork,
  readActiveIntegratedJourney,
  readIntegratedJourneyHistory,
  readJourneyNoteSheet,
  sanitizeIntegratedJourneyHistory,
  startIntegratedJourney,
  summarizeIntegratedJourneyBank,
  synchronizeIntegratedJourney,
  validateIntegratedJourney,
  validateIntegratedJourneyHistory,
  writeCustomIntegratedJourney,
  writeJourneyNoteSheet
} from "../lib/integratedJourney.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    clear() { values.clear(); }
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
let checks = 0;
function ok(value, message) { checks += 1; assert.ok(value, message); }
function equal(actual, expected, message) { checks += 1; assert.equal(actual, expected, message); }

const summary = summarizeIntegratedJourneyBank(BUILT_IN_INTEGRATED_JOURNEYS, exercises);
equal(summary.total, 4, "quatre parcours intégrés sont fournis");
equal(summary.blocked, 0, "aucun parcours intégré n’est bloqué");
ok(summary.byLevel["6e"] >= 2, "la 6e possède plusieurs parcours");
ok(summary.byLevel.sec1 >= 1, "le secondaire 1 possède un parcours");
ok(summary.byLevel.sec2 >= 1, "le secondaire 2 possède un parcours");

for (const journey of BUILT_IN_INTEGRATED_JOURNEYS) {
  const audit = validateIntegratedJourney(journey, exercises);
  ok(audit.valid, `${journey.id} doit pointer vers un vrai texte`);
  equal(audit.exercise.id, journey.exerciseId, `${journey.id} utilise le bon texte`);
  equal(audit.errors.length, 0, `${journey.id} ne contient aucune erreur bloquante`);
}

const mismatch = validateIntegratedJourney({
  ...BUILT_IN_INTEGRATED_JOURNEYS[0],
  id: "niveau-incoherent",
  levelId: "sec2"
}, exercises);
equal(mismatch.valid, false, "un niveau incohérent bloque le parcours");
ok(mismatch.errors.some((error) => error.includes("ne correspond pas")), "le conflit de niveau est expliqué");

const weakCoherence = validateIntegratedJourney({
  ...BUILT_IN_INTEGRATED_JOURNEYS[0],
  id: "intention-a-revoir",
  writingTypeId: "opinion",
  writingIntention: "Décrire le phénomène."
}, exercises);
ok(weakCoherence.warnings.length > 0, "une intention peu cohérente produit un avertissement");

const trainingStorage = memoryStorage();
const trainingJourney = BUILT_IN_INTEGRATED_JOURNEYS[0];
const trainingExercise = exercises.find((exercise) => exercise.id === trainingJourney.exerciseId);
const activeTraining = startIntegratedJourney(trainingJourney, "training", trainingStorage);
equal(activeTraining.stage, "reading", "le parcours commence par la lecture");
equal(activeTraining.modeId, "training", "le mode entraînement est conservé");

const emptyReading = buildReadingWorkForJourney(trainingJourney, trainingExercise, "training");
trainingStorage.setItem(READING_WORK_STORAGE_KEY, JSON.stringify(emptyReading));
const emptyInspection = inspectReadingWork(emptyReading, trainingExercise);
equal(emptyInspection.readyForWriting, false, "une écriture sans préparation est signalée");
ok(emptyInspection.warning.includes("aucune lecture préparatoire"), "le signalement est explicite");

const standaloneInspection = inspectReadingWork({ answers: {}, notes: {}, proofs: [], step: 1 }, trainingExercise);
equal(standaloneInspection.readingStarted, false, "une lecture autonome vide reste un état valide");
equal(readActiveIntegratedJourney(memoryStorage()), null, "aucun parcours actif n’est requis pour lire");

const q1 = trainingExercise.questions[0];
const q2 = trainingExercise.questions[1];
const trainingReading = {
  ...emptyReading,
  step: 6,
  answers: { [q1.id]: "Réponse complète locale.", [q2.id]: "Deuxième réponse locale." },
  notes: { 0: "Le vent solaire transporte des particules chargées." },
  proofs: [{ id: 1, questionId: q1.id, text: "Passage choisi par l’élève.", kind: "important" }]
};
const readingInspection = inspectReadingWork(trainingReading, trainingExercise);
equal(readingInspection.questionsCompleted, 2, "deux questions complétées sont comptées");
equal(readingInspection.readyForWriting, true, "la lecture prépare maintenant l’écriture");

const trainingSheet = buildJourneyNoteSheet(trainingReading, trainingExercise, "training");
equal(trainingSheet.modeId, "training", "la feuille respecte le mode entraînement");
ok(trainingSheet.rows.length >= 3, "la feuille guidée comporte plusieurs lignes");
ok(trainingSheet.rows.some((row) => row.sourceType === "reading-note"), "les notes de lecture de l’élève peuvent être transférées dans la feuille active");
ok(trainingSheet.rows.some((row) => row.sourceType === "selected-passage"), "un passage choisi peut être transféré dans la feuille active");
ok(trainingSheet.rows.some((row) => row.sourceType === "question"), "les questions complétées structurent la feuille sans copier les réponses");
const savedSheet = writeJourneyNoteSheet({ ...trainingSheet, journeyId: trainingJourney.id }, trainingStorage);
equal(readJourneyNoteSheet(trainingStorage).journeyId, trainingJourney.id, "la feuille active est sauvegardée séparément");

const trainingWriting = buildWritingWorkForJourney(trainingJourney, savedSheet, "training");
equal(trainingWriting.examMode, false, "l’entraînement active les aides d’écriture existantes");
equal(trainingWriting.draft, "", "aucun brouillon n’est créé automatiquement");
equal(trainingWriting.finalText, "", "aucune version finale n’est créée automatiquement");
equal(trainingWriting.situationId, "explicatif", "la bonne intention d’écriture est transmise");
trainingStorage.setItem(WRITING_WORK_STORAGE_KEY, JSON.stringify(trainingWriting));

const synchronizedNotes = synchronizeIntegratedJourney(
  activeTraining,
  trainingReading,
  trainingWriting,
  trainingExercise,
  savedSheet,
  trainingStorage
);
equal(synchronizedNotes.active.stage, "notes", "la feuille préparée est reconnue avant le début réel de l’écriture");

const writingAtRevision = {
  ...trainingWriting,
  step: 5,
  draft: "Brouillon local qui ne doit jamais entrer dans l’historique.",
  checks: {
    "ministere-ecriture-adaptation": true,
    "ministere-ecriture-coherence": true
  }
};
const synchronizedReview = synchronizeIntegratedJourney(
  synchronizedNotes.active,
  trainingReading,
  writingAtRevision,
  trainingExercise,
  savedSheet,
  trainingStorage
);
equal(synchronizedReview.active.stage, "review", "l’étape 5 est reconnue comme révision");
equal(synchronizedReview.active.criteriaWorkedCount, 2, "les critères vérifiés sont comptés sans leur contenu");
const finished = completeIntegratedJourney(synchronizedReview.active, trainingStorage);
equal(finished.stage, "completed", "le bilan final peut clore le parcours");

const trainingHistory = readIntegratedJourneyHistory(trainingStorage);
ok(trainingHistory.some((event) => event.eventType === "journey_started"), "le début du parcours est historisé");
ok(trainingHistory.some((event) => event.eventType === "journey_completed"), "la fin du parcours est historisée");
equal(validateIntegratedJourneyHistory(trainingHistory).valid, true, "l’historique minimal est conforme");

const trainingExport = buildIntegratedJourneyHistoryExport(trainingHistory, [trainingJourney]);
const trainingSerialized = JSON.stringify(trainingExport);
for (const forbidden of [
  "Réponse complète locale", "Deuxième réponse locale", "Passage choisi par l’élève",
  "Brouillon local", "expectedAnswer", "correctedText", "rewrittenText", "replacementText",
  "finalText", "studentAnswer", "proofs"
]) {
  ok(!trainingSerialized.includes(forbidden), `l’export exclut ${forbidden}`);
}
equal(trainingExport.privacy.containsStudentAnswers, false, "l’export déclare l’absence de réponses");
equal(trainingExport.privacy.containsWritingDrafts, false, "l’export déclare l’absence de brouillons");
equal(trainingExport.privacy.containsFinalTexts, false, "l’export déclare l’absence de versions finales");

const simulationStorage = memoryStorage();
const simulationJourney = BUILT_IN_INTEGRATED_JOURNEYS.find((journey) => journey.levelId === "sec2");
const simulationExercise = exercises.find((exercise) => exercise.id === simulationJourney.exerciseId);
const activeSimulation = startIntegratedJourney(simulationJourney, "simulation", simulationStorage);
const baseSimulationReading = buildReadingWorkForJourney(simulationJourney, simulationExercise, "simulation");
equal(baseSimulationReading.learningMode, "simulation", "la lecture s’ouvre en simulation");
const simulationReading = {
  ...baseSimulationReading,
  step: 6,
  notes: { 0: "Note personnelle déjà constituée." },
  proofs: [{ id: 9, questionId: simulationExercise.questions[0].id, text: "Passage noté par l’élève.", kind: "important" }],
  answers: { [simulationExercise.questions[0].id]: "Réponse de simulation locale." }
};
const simulationSheet = buildJourneyNoteSheet(simulationReading, simulationExercise, "simulation");
equal(simulationSheet.modeId, "simulation", "la feuille conserve le mode simulation");
ok(simulationSheet.rows.length <= 5, "la feuille de simulation est limitée à cinq lignes");
ok(simulationSheet.rows.every((row) => row.sourceType !== "question"), "aucune question-guide n’est générée en simulation");
ok(simulationSheet.rows.every((row) => !row.sourceLabel.includes("Question complétée")), "aucune aide de contenu liée aux questions n’apparaît en simulation");
const simulationWriting = buildWritingWorkForJourney(simulationJourney, simulationSheet, "simulation");
equal(simulationWriting.examMode, true, "l’écriture s’ouvre en simulation");
equal(simulationWriting.draft, "", "la simulation ne fournit aucune réponse finale");
equal(simulationWriting.finalText, "", "la simulation ne fournit aucune version finale");

const simulationAtChecklist = {
  ...simulationWriting,
  step: 5,
  checks: {
    "ministere-ecriture-adaptation": true,
    "ministere-ecriture-coherence": true,
    "ministere-ecriture-vocabulaire": true,
    "ministere-ecriture-phrases": true,
    "ministere-ecriture-orthographe": true
  }
};
const simulationWritingInspection = inspectWritingWork(simulationAtChecklist);
equal(simulationWritingInspection.simulationChecklistComplete, true, "les cinq cases complètent la vérification autonome");
const simulationSync = synchronizeIntegratedJourney(
  activeSimulation,
  simulationReading,
  simulationAtChecklist,
  simulationExercise,
  simulationSheet,
  simulationStorage
);
equal(simulationSync.active.stage, "review", "la simulation atteint le bilan sans aide personnalisée");

let deduped = [];
const fixedEvent = {
  occurredAt: "2026-08-01T20:00:00.000Z",
  journeyId: "p1",
  levelId: "6e",
  modeId: "training",
  eventType: "journey_started",
  stage: "reading"
};
deduped = addIntegratedJourneyHistoryEvent(deduped, fixedEvent);
deduped = addIntegratedJourneyHistoryEvent(deduped, { ...fixedEvent, occurredAt: "2026-08-01T20:00:03.000Z" });
equal(deduped.length, 1, "deux événements identiques à trois secondes d’intervalle sont dédoublonnés");

const manyEvents = Array.from({ length: MAX_INTEGRATED_JOURNEY_HISTORY + 25 }, (_, index) => ({
  ...fixedEvent,
  id: `event-${index}`,
  occurredAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
  questionsCompleted: index
}));
equal(sanitizeIntegratedJourneyHistory(manyEvents).length, MAX_INTEGRATED_JOURNEY_HISTORY, "l’historique respecte sa limite maximale");

const customStorage = memoryStorage();
const custom = {
  id: "parcours-local-test",
  title: "Parcours local valide",
  exerciseId: trainingExercise.id,
  levelId: "6e",
  readingTextType: trainingExercise.textType,
  readingIntention: trainingExercise.intention,
  writingTypeId: "explicatif",
  writingIntention: "Expliquer les causes et les conséquences du phénomène.",
  status: "ready"
};
writeCustomIntegratedJourney(custom, customStorage);
const bankWithCustom = getIntegratedJourneyBank(customStorage);
ok(bankWithCustom.some((journey) => journey.id === custom.id), "un parcours local est ajouté à la banque");
equal(bankWithCustom.filter((journey) => journey.id === custom.id).length, 1, "les identifiants de parcours restent uniques");

equal(trainingStorage.getItem(INTEGRATED_JOURNEY_HISTORY_KEY) !== null, true, "l’historique utilise une clé locale dédiée");
console.log(`Bloc 15 — parcours lecture-écriture : ${checks} assertions réussies.`);
