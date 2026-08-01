import { WRITING_MINISTRY_CRITERIA } from "./writingMinistryFeedback.js";

export const WRITING_REVISION_HISTORY_VERSION = "1.0";
export const WRITING_REVISION_HISTORY_STORAGE_KEY = "lecture_writing_revision_history_v1";
export const WRITING_REVISION_HISTORY_EVENT = "writing-revision-history-updated";
export const MAX_WRITING_REVISION_EVENTS = 300;
export const WRITING_REVISION_DEDUPE_MS = 5000;

export const WRITING_REVISION_STATES = {
  analysis_launched: "Analyse lancée",
  revision_relaunched: "Révision relancée",
  simulation_checked: "Simulation vérifiée",
  self_assessment_completed: "Autoévaluation complétée"
};

export const WRITING_TEXT_TYPES = {
  opinion: "Lettre d’opinion",
  explicatif: "Texte explicatif",
  reaction: "Réaction ou appréciation"
};

export const WRITING_LEVELS = {
  "6e": "6e année",
  sec1: "Secondaire 1",
  sec2: "Secondaire 2"
};

export const WRITING_CRITERION_LABELS = Object.fromEntries(
  WRITING_MINISTRY_CRITERIA.map((criterion) => [criterion.id, criterion.label])
);

const ALLOWED_CRITERIA = new Set(Object.keys(WRITING_CRITERION_LABELS));
const ALLOWED_STATES = new Set(Object.keys(WRITING_REVISION_STATES));
const ALLOWED_MODES = new Set(["training", "simulation"]);
const ALLOWED_LEVELS = new Set(Object.keys(WRITING_LEVELS));
const ALLOWED_TEXT_TYPES = new Set(Object.keys(WRITING_TEXT_TYPES));
const ANALYSIS_STATES = new Set(["analysis_launched", "revision_relaunched"]);

const FORBIDDEN_KEYS = [
  "draft", "brouillon", "finalText", "finalVersion", "versionFinale", "sentence",
  "studentText", "studentAnswer", "answer", "responseText", "selectedProof", "proofText",
  "feedback", "personalizedFeedback", "correctedText", "rewrittenText", "replacementText",
  "expectedAnswer", "grade", "score", "rating", "errorCount", "mistakeCount"
];

function storageOrDefault(storage) {
  if (storage) return storage;
  if (typeof window !== "undefined") return window.localStorage;
  return null;
}

function cleanId(value, fallback = "") {
  const cleaned = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
  return cleaned || fallback;
}

function safeDate(value) {
  const parsed = new Date(value || Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function safeInteger(value, minimum = 0, maximum = 99) {
  const number = Number(value);
  if (!Number.isFinite(number)) return minimum;
  return Math.max(minimum, Math.min(maximum, Math.trunc(number)));
}

function uniqueCriteria(values) {
  return [...new Set(Array.isArray(values) ? values : [])]
    .filter((criterion) => ALLOWED_CRITERIA.has(criterion))
    .sort();
}

function eventId(occurredAt) {
  const stamp = new Date(occurredAt).getTime();
  const random = Math.random().toString(36).slice(2, 9);
  return `writing-${stamp}-${random}`;
}

export function normalizeWritingRevisionEvent(input = {}) {
  const occurredAt = safeDate(input.occurredAt);
  const levelId = ALLOWED_LEVELS.has(input.levelId) ? input.levelId : "6e";
  const modeId = ALLOWED_MODES.has(input.modeId) ? input.modeId : "training";
  const textTypeId = ALLOWED_TEXT_TYPES.has(input.textTypeId) ? input.textTypeId : "opinion";
  const state = ALLOWED_STATES.has(input.state) ? input.state : "analysis_launched";
  const criteriaWorked = uniqueCriteria(input.criteriaWorked);
  const hasDominantCriterion = Object.prototype.hasOwnProperty.call(input, "dominantCriterion");
  const requestedDominantCriterion = String(input.dominantCriterion || "");
  const dominantCriterion = hasDominantCriterion && requestedDominantCriterion === ""
    ? ""
    : ALLOWED_CRITERIA.has(requestedDominantCriterion)
      ? requestedDominantCriterion
      : (criteriaWorked[0] || "");

  return {
    id: cleanId(input.id, eventId(occurredAt)),
    occurredAt,
    levelId,
    modeId,
    textTypeId,
    step: safeInteger(input.step, 1, 7),
    criteriaWorked,
    dominantCriterion,
    strengthCount: safeInteger(input.strengthCount, 0, 2),
    priorityCount: safeInteger(input.priorityCount, 0, 3),
    state,
    isSimulation: modeId === "simulation",
    version: WRITING_REVISION_HISTORY_VERSION
  };
}

function eventFingerprint(event) {
  return JSON.stringify({
    levelId: event.levelId,
    modeId: event.modeId,
    textTypeId: event.textTypeId,
    step: event.step,
    criteriaWorked: event.criteriaWorked,
    dominantCriterion: event.dominantCriterion,
    strengthCount: event.strengthCount,
    priorityCount: event.priorityCount,
    state: event.state
  });
}

export function sanitizeWritingRevisionHistory(records) {
  if (!Array.isArray(records)) return [];
  return records
    .filter((record) => record && typeof record === "object")
    .map(normalizeWritingRevisionEvent)
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    .slice(0, MAX_WRITING_REVISION_EVENTS);
}

export function addWritingRevisionEvent(records, input) {
  const current = sanitizeWritingRevisionHistory(records);
  const event = normalizeWritingRevisionEvent(input);
  const duplicate = current.find((record) => {
    const delta = Math.abs(new Date(record.occurredAt) - new Date(event.occurredAt));
    return delta <= WRITING_REVISION_DEDUPE_MS && eventFingerprint(record) === eventFingerprint(event);
  });
  if (duplicate) return current;
  return sanitizeWritingRevisionHistory([event, ...current]);
}

export function readWritingRevisionHistory(storage) {
  const target = storageOrDefault(storage);
  if (!target) return [];
  try {
    return sanitizeWritingRevisionHistory(JSON.parse(target.getItem(WRITING_REVISION_HISTORY_STORAGE_KEY) || "[]"));
  } catch {
    return [];
  }
}

function notifyWritingRevisionHistory() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WRITING_REVISION_HISTORY_EVENT));
}

export function writeWritingRevisionEvent(input, storage) {
  const target = storageOrDefault(storage);
  if (!target) return [];
  const records = addWritingRevisionEvent(readWritingRevisionHistory(target), input);
  target.setItem(WRITING_REVISION_HISTORY_STORAGE_KEY, JSON.stringify(records));
  notifyWritingRevisionHistory();
  return records;
}

export function clearWritingRevisionHistory(storage) {
  const target = storageOrDefault(storage);
  if (!target) return;
  target.removeItem(WRITING_REVISION_HISTORY_STORAGE_KEY);
  notifyWritingRevisionHistory();
}

function criteriaFromFeedback(feedback) {
  return uniqueCriteria(
    Array.isArray(feedback?.criteria)
      ? feedback.criteria.filter((criterion) => criterion?.state === "review").map((criterion) => criterion.id)
      : []
  );
}

export function recordWritingAnalysisEvent(feedback, metadata = {}, storage) {
  const target = storageOrDefault(storage);
  if (!target) return [];
  const records = readWritingRevisionHistory(target);
  const levelId = ALLOWED_LEVELS.has(metadata.levelId) ? metadata.levelId : "6e";
  const textTypeId = ALLOWED_TEXT_TYPES.has(metadata.textTypeId) ? metadata.textTypeId : "opinion";
  const priorAnalysis = records.some((record) => (
    ANALYSIS_STATES.has(record.state) &&
    record.levelId === levelId &&
    record.textTypeId === textTypeId
  ));
  const criteriaWorked = criteriaFromFeedback(feedback);
  return writeWritingRevisionEvent({
    occurredAt: metadata.occurredAt,
    levelId,
    modeId: "training",
    textTypeId,
    step: metadata.step || 5,
    criteriaWorked,
    dominantCriterion: criteriaWorked[0] || "",
    strengthCount: Array.isArray(feedback?.strengths) ? feedback.strengths.length : 0,
    priorityCount: Array.isArray(feedback?.improvements) ? feedback.improvements.length : 0,
    state: priorAnalysis ? "revision_relaunched" : "analysis_launched"
  }, target);
}

export function recordWritingSimulationEvent(metadata = {}, storage) {
  return writeWritingRevisionEvent({
    occurredAt: metadata.occurredAt,
    levelId: metadata.levelId || "6e",
    modeId: "simulation",
    textTypeId: metadata.textTypeId,
    step: metadata.step || 5,
    criteriaWorked: Object.keys(WRITING_CRITERION_LABELS),
    dominantCriterion: "",
    strengthCount: 0,
    priorityCount: 0,
    state: "simulation_checked"
  }, storage);
}

export function recordWritingSelfAssessmentEvent(metadata = {}, storage) {
  return writeWritingRevisionEvent({
    occurredAt: metadata.occurredAt,
    levelId: metadata.levelId || "6e",
    modeId: "simulation",
    textTypeId: metadata.textTypeId,
    step: metadata.step || 5,
    criteriaWorked: Object.keys(WRITING_CRITERION_LABELS),
    dominantCriterion: "",
    strengthCount: 0,
    priorityCount: 0,
    state: "self_assessment_completed"
  }, storage);
}

function emptyCriterionCounts() {
  return Object.fromEntries(Object.keys(WRITING_CRITERION_LABELS).map((id) => [id, 0]));
}

export function summarizeWritingRevisionHistory(records) {
  const safe = sanitizeWritingRevisionHistory(records);
  const byCriterion = emptyCriterionCounts();
  const byDominantCriterion = emptyCriterionCounts();
  const byMode = { training: 0, simulation: 0 };
  const byState = Object.fromEntries(Object.keys(WRITING_REVISION_STATES).map((state) => [state, 0]));
  const byTextType = Object.fromEntries(Object.keys(WRITING_TEXT_TYPES).map((type) => [type, 0]));

  safe.forEach((record) => {
    byMode[record.modeId] += 1;
    byState[record.state] += 1;
    byTextType[record.textTypeId] += 1;
    record.criteriaWorked.forEach((criterion) => { byCriterion[criterion] += 1; });
    if (record.dominantCriterion) byDominantCriterion[record.dominantCriterion] += 1;
  });

  const rankedCriteria = Object.entries(byCriterion).sort((a, b) => b[1] - a[1]);
  const rankedPriorities = Object.entries(byDominantCriterion).sort((a, b) => b[1] - a[1]);
  const mostWorkedCriterion = rankedCriteria.find(([, count]) => count > 0)?.[0] || "";
  const nextPriorityCriterion = rankedPriorities.find(([, count]) => count > 0)?.[0] || mostWorkedCriterion;

  return {
    total: safe.length,
    analysesLaunched: byState.analysis_launched + byState.revision_relaunched,
    revisionRelaunches: byState.revision_relaunched,
    simulationEntries: byState.simulation_checked,
    simulationsVerified: byState.self_assessment_completed,
    byCriterion,
    byDominantCriterion,
    byMode,
    byState,
    byTextType,
    lastActivity: safe[0] || null,
    mostWorkedCriterion,
    mostWorkedCriterionLabel: WRITING_CRITERION_LABELS[mostWorkedCriterion] || "Aucun critère encore travaillé",
    nextPriorityCriterion,
    nextPriorityLabel: WRITING_CRITERION_LABELS[nextPriorityCriterion] || "Lancer une première analyse formative",
    recent: safe.slice(0, 10)
  };
}

export function buildWritingRevisionHistoryExport(records) {
  const safe = sanitizeWritingRevisionHistory(records);
  return {
    exportType: "historique-local-revision-ecriture",
    schemaVersion: WRITING_REVISION_HISTORY_VERSION,
    exportedAt: new Date().toISOString(),
    storageKey: WRITING_REVISION_HISTORY_STORAGE_KEY,
    privacy: {
      containsStudentText: false,
      containsPersonalizedFeedback: false,
      containsGradesOrErrorCounts: false
    },
    summary: summarizeWritingRevisionHistory(safe),
    records: safe
  };
}

export function validateWritingRevisionHistory(records) {
  const safe = sanitizeWritingRevisionHistory(records);
  const serialized = JSON.stringify(safe);
  const forbiddenFound = FORBIDDEN_KEYS.filter((key) => new RegExp(`\\"${key}\\"`, "i").test(serialized));
  const invalidVersions = safe.filter((record) => record.version !== WRITING_REVISION_HISTORY_VERSION);
  const invalidSimulationFlags = safe.filter((record) => record.isSimulation !== (record.modeId === "simulation"));
  return {
    valid: forbiddenFound.length === 0 && invalidVersions.length === 0 && invalidSimulationFlags.length === 0,
    message: `${safe.length} événement(s) minimal(aux) vérifié(s).`,
    forbiddenFound,
    invalidVersions: invalidVersions.length,
    invalidSimulationFlags: invalidSimulationFlags.length
  };
}
