import assert from "node:assert/strict";
import { analyzeWritingForRevision } from "../lib/writingMinistryFeedback.js";
import {
  MAX_WRITING_REVISION_EVENTS,
  WRITING_REVISION_HISTORY_STORAGE_KEY,
  addWritingRevisionEvent,
  buildWritingRevisionHistoryExport,
  clearWritingRevisionHistory,
  normalizeWritingRevisionEvent,
  readWritingRevisionHistory,
  recordWritingAnalysisEvent,
  recordWritingSelfAssessmentEvent,
  recordWritingSimulationEvent,
  sanitizeWritingRevisionHistory,
  summarizeWritingRevisionHistory,
  validateWritingRevisionHistory,
  writeWritingRevisionEvent
} from "../lib/writingRevisionHistory.js";

let checks = 0;
function ok(value, message) { checks += 1; assert.ok(value, message); }
function equal(actual, expected, message) { checks += 1; assert.equal(actual, expected, message); }
function deepEqual(actual, expected, message) { checks += 1; assert.deepEqual(actual, expected, message); }

function memoryStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

const studentDraft = "bonjour au conseil. Le jardin est une bonne chose et cette chose est importante parce que le jardin est important pour les élèves sans paragraphes distincts";
const feedback = analyzeWritingForRevision({
  text: studentDraft,
  audience: "les membres du conseil",
  purpose: "les convaincre d’aménager un jardin",
  textType: "Lettre d’opinion",
  minimumParagraphs: 4,
  mode: "training"
});

// Le normaliseur ne conserve que les champs autorisés.
const sanitizedInjection = normalizeWritingRevisionEvent({
  id: "event-test",
  occurredAt: "2026-08-01T20:00:00.000Z",
  levelId: "6e",
  modeId: "training",
  textTypeId: "opinion",
  step: 5,
  criteriaWorked: ["coherence", "vocabulary", "inconnu"],
  dominantCriterion: "coherence",
  strengthCount: 99,
  priorityCount: 99,
  state: "analysis_launched",
  draft: studentDraft,
  finalText: "Version finale interdite",
  personalizedFeedback: feedback,
  correctedText: "Texte corrigé interdit",
  rewrittenText: "Texte réécrit interdit",
  replacementText: "Remplacement interdit",
  expectedAnswer: "Réponse attendue interdite",
  score: 88,
  errorCount: 6
});

equal(sanitizedInjection.id, "event-test", "l’identifiant local est conservé");
equal(sanitizedInjection.strengthCount, 2, "le nombre de forces est plafonné à deux");
equal(sanitizedInjection.priorityCount, 3, "le nombre de priorités est plafonné à trois");
deepEqual(sanitizedInjection.criteriaWorked, ["coherence", "vocabulary"], "seuls les critères ministériels autorisés sont conservés");
for (const forbidden of ["draft", "finalText", "personalizedFeedback", "correctedText", "rewrittenText", "replacementText", "expectedAnswer", "score", "errorCount"]) {
  ok(!(forbidden in sanitizedInjection), `le champ interdit ${forbidden} est supprimé`);
}

const storage = memoryStorage();

// Première analyse, puis relance de révision.
let records = recordWritingAnalysisEvent(feedback, {
  occurredAt: "2026-08-01T20:00:00.000Z",
  levelId: "6e",
  textTypeId: "opinion",
  step: 5
}, storage);
equal(records.length, 1, "la première analyse crée un événement");
equal(records[0].state, "analysis_launched", "la première analyse porte le bon état");
equal(records[0].modeId, "training", "l’analyse est enregistrée en entraînement");
ok(records[0].criteriaWorked.length > 0, "les critères à revoir sont conservés sous forme d’identifiants");
ok(!JSON.stringify(records).includes(studentDraft), "le brouillon n’est jamais copié dans l’historique");

records = recordWritingAnalysisEvent(feedback, {
  occurredAt: "2026-08-01T20:00:10.000Z",
  levelId: "6e",
  textTypeId: "opinion",
  step: 5
}, storage);
equal(records.length, 2, "la relance crée un deuxième événement");
equal(records[0].state, "revision_relaunched", "la deuxième analyse est classée comme révision relancée");

// Un doublon identique à quelques secondes d’intervalle est ignoré.
records = recordWritingAnalysisEvent(feedback, {
  occurredAt: "2026-08-01T20:00:12.000Z",
  levelId: "6e",
  textTypeId: "opinion",
  step: 5
}, storage);
equal(records.length, 2, "la relance identique rapprochée est dédupliquée");

// Passage en simulation et autoévaluation complète.
records = recordWritingSimulationEvent({
  occurredAt: "2026-08-01T20:01:00.000Z",
  levelId: "6e",
  textTypeId: "opinion",
  step: 4
}, storage);
equal(records[0].state, "simulation_checked", "le passage en simulation est enregistré");
equal(records[0].modeId, "simulation", "le mode simulation est explicite");
equal(records[0].isSimulation, true, "l’indicateur booléen de simulation est cohérent");
equal(records[0].dominantCriterion, "", "une simulation n’invente aucun critère dominant");

records = recordWritingSelfAssessmentEvent({
  occurredAt: "2026-08-01T20:02:00.000Z",
  levelId: "6e",
  textTypeId: "opinion",
  step: 5
}, storage);
equal(records[0].state, "self_assessment_completed", "les cinq cases complétées créent le bon événement");
equal(records[0].criteriaWorked.length, 5, "les cinq critères sont associés à l’autoévaluation complète");

const summary = summarizeWritingRevisionHistory(records);
equal(summary.total, 4, "le résumé compte quatre événements distincts");
equal(summary.analysesLaunched, 2, "les analyses et relances sont comptées ensemble");
equal(summary.revisionRelaunches, 1, "la relance est comptée séparément");
equal(summary.simulationEntries, 1, "le passage en simulation est compté");
equal(summary.simulationsVerified, 1, "l’autoévaluation complète est comptée comme simulation vérifiée");
equal(summary.byMode.training, 2, "la répartition entraînement est correcte");
equal(summary.byMode.simulation, 2, "la répartition simulation est correcte");
ok(summary.mostWorkedCriterion.length > 0, "un critère le plus travaillé est calculé");
ok(summary.nextPriorityLabel.length > 0, "une priorité générale est produite sans texte d’élève");
equal(summary.lastActivity.state, "self_assessment_completed", "la dernière activité est la plus récente");

// Lecture, écriture et effacement local.
const reread = readWritingRevisionHistory(storage);
equal(reread.length, 4, "l’historique est relu depuis la clé locale");
ok(storage.getItem(WRITING_REVISION_HISTORY_STORAGE_KEY), "la clé locale dédiée est utilisée");
clearWritingRevisionHistory(storage);
equal(readWritingRevisionHistory(storage).length, 0, "l’effacement local retire tout l’historique d’écriture");

// Stockage corrompu : retour sûr à un historique vide.
storage.setItem(WRITING_REVISION_HISTORY_STORAGE_KEY, "{json invalide");
equal(readWritingRevisionHistory(storage).length, 0, "un stockage corrompu ne fait pas échouer l’application");

// Limite maximale de 300 événements.
let many = [];
for (let index = 0; index < MAX_WRITING_REVISION_EVENTS + 25; index += 1) {
  many = addWritingRevisionEvent(many, {
    id: `event-${index}`,
    occurredAt: new Date(Date.UTC(2026, 7, 1, 0, 0, index * 6)).toISOString(),
    levelId: "6e",
    modeId: index % 2 ? "simulation" : "training",
    textTypeId: index % 3 === 0 ? "opinion" : index % 3 === 1 ? "explicatif" : "reaction",
    step: (index % 7) + 1,
    criteriaWorked: [index % 2 ? "coherence" : "vocabulary"],
    dominantCriterion: index % 2 ? "coherence" : "vocabulary",
    strengthCount: index % 3,
    priorityCount: index % 4,
    state: index % 2 ? "simulation_checked" : "analysis_launched"
  });
}
equal(many.length, MAX_WRITING_REVISION_EVENTS, "l’historique est limité à 300 événements");
equal(sanitizeWritingRevisionHistory(many).length, MAX_WRITING_REVISION_EVENTS, "l’assainissement respecte aussi la limite");

// L’export JSON demeure minimal.
writeWritingRevisionEvent({
  id: "export-test",
  occurredAt: "2026-08-01T21:00:00.000Z",
  levelId: "6e",
  modeId: "training",
  textTypeId: "reaction",
  step: 5,
  criteriaWorked: ["adaptation"],
  dominantCriterion: "adaptation",
  strengthCount: 1,
  priorityCount: 2,
  state: "analysis_launched",
  draft: studentDraft,
  expectedAnswer: "interdit"
}, storage);
const exportPayload = buildWritingRevisionHistoryExport(readWritingRevisionHistory(storage));
const serializedExport = JSON.stringify(exportPayload);
equal(exportPayload.exportType, "historique-local-revision-ecriture", "le type d’export est explicite");
equal(exportPayload.privacy.containsStudentText, false, "l’export déclare l’absence de texte d’élève");
ok(!serializedExport.includes(studentDraft), "l’export ne contient aucun brouillon");
for (const forbidden of ["correctedText", "rewrittenText", "replacementText", "expectedAnswer", "studentAnswer", "finalText", "errorCount"]) {
  ok(!serializedExport.includes(`\"${forbidden}\"`), `l’export ne contient pas ${forbidden}`);
}
equal(validateWritingRevisionHistory(exportPayload.records).valid, true, "l’export minimal passe la validation d’intégrité");

console.log(`Bloc 14 — historique local de révision d’écriture : ${checks} assertions réussies.`);
