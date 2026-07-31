import { QUESTION_DIMENSIONS } from "./questionClassification.js";

export const PROGRESS_STORAGE_KEY = "lecture_progress_history_v1";
export const PROGRESS_VERSION = "1.0";
export const MAX_PROGRESS_RECORDS = 600;

export const PROGRESS_NEED_LABELS = {
  answer: "réponse à commencer",
  evidence: "appui du texte absent",
  evidencePrecision: "appui du texte trop vague",
  justification: "justification absente",
  textLink: "lien avec le texte absent",
  personal: "opinion ou réaction absente",
  criterion: "critère d’appréciation absent",
  elements: "éléments demandés incomplets",
  allParts: "parties de la question incomplètes"
};

const COMPLETE_STATUSES = new Set(["acceptable", "strong"]);
const VALID_STATUSES = new Set(["missing", "partial", "acceptable", "strong"]);
const VALID_MODES = new Set(["training", "simulation"]);
const VALID_LEVELS = new Set(["6e", "sec1", "sec2"]);

function safeString(value = "") {
  return String(value || "").trim();
}

function safeDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function statusBucket(status) {
  if (COMPLETE_STATUSES.has(status)) return "complete";
  if (status === "partial") return "partial";
  return "missing";
}

function emptyStatusCounts() {
  return { complete: 0, partial: 0, missing: 0, total: 0, completionRate: 0 };
}

function addStatus(counts, status) {
  const bucket = statusBucket(status);
  counts[bucket] += 1;
  counts.total += 1;
  counts.completionRate = counts.total ? Math.round((counts.complete / counts.total) * 100) : 0;
  return counts;
}

export function normalizeProgressRecord(input = {}) {
  const status = VALID_STATUSES.has(input.status) ? input.status : "missing";
  const dimension = QUESTION_DIMENSIONS[input.dimension] ? input.dimension : "comprendre";
  const modeId = VALID_MODES.has(input.modeId) ? input.modeId : "training";
  const levelId = VALID_LEVELS.has(input.levelId) ? input.levelId : "6e";
  const timestamp = safeDate(input.timestamp);
  const missingCodes = unique((Array.isArray(input.missingCodes) ? input.missingCodes : [])
    .map((code) => safeString(code))
    .filter((code) => PROGRESS_NEED_LABELS[code]));
  const exerciseId = safeString(input.exerciseId) || "exercice-inconnu";
  const questionId = safeString(input.questionId) || "question-inconnue";
  const source = ["check", "advance", "submission"].includes(input.source) ? input.source : "check";
  const id = safeString(input.id)
    || [exerciseId, questionId, modeId, timestamp, source].join("|");

  return {
    version: PROGRESS_VERSION,
    id,
    timestamp,
    source,
    exerciseId,
    exerciseTitle: safeString(input.exerciseTitle),
    questionId,
    questionOrder: Math.max(1, Number(input.questionOrder || 1)),
    dimension,
    questionType: safeString(input.questionType),
    levelId,
    modeId,
    status,
    statusBucket: statusBucket(status),
    missingCodes,
    canContinue: Boolean(input.canContinue),
    canSubmit: Boolean(input.canSubmit),
    validEvidenceCount: Math.max(0, Number(input.validEvidenceCount || 0)),
    rejectedEvidenceCount: Math.max(0, Number(input.rejectedEvidenceCount || 0))
  };
}

export function progressRecordFromFeedback({
  feedback = {},
  exercise = {},
  question = {},
  questionOrder = 1,
  levelId = "6e",
  modeId = "training",
  source = "check",
  timestamp
} = {}) {
  return normalizeProgressRecord({
    timestamp,
    source,
    exerciseId: exercise.id,
    exerciseTitle: exercise.title,
    questionId: question.id,
    questionOrder,
    dimension: feedback.question?.dimension || question.dimension,
    questionType: feedback.question?.questionType || question.questionType,
    levelId,
    modeId,
    status: feedback.status,
    missingCodes: (feedback.missing || []).map((item) => item.code),
    canContinue: feedback.canContinue,
    canSubmit: feedback.canSubmit,
    validEvidenceCount: feedback.diagnostics?.validEvidenceCount,
    rejectedEvidenceCount: feedback.diagnostics?.rejectedEvidenceCount
  });
}

export function sanitizeProgressRecords(records = []) {
  return (Array.isArray(records) ? records : [])
    .map(normalizeProgressRecord)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-MAX_PROGRESS_RECORDS);
}

export function upsertProgressRecord(records = [], input = {}) {
  const next = normalizeProgressRecord(input);
  const current = sanitizeProgressRecords(records);
  const recentIndex = [...current].reverse().findIndex((record) => {
    const closeInTime = Math.abs(new Date(next.timestamp) - new Date(record.timestamp)) <= 4000;
    return closeInTime
      && record.exerciseId === next.exerciseId
      && record.questionId === next.questionId
      && record.modeId === next.modeId
      && record.source === next.source
      && record.status === next.status
      && record.missingCodes.join("|") === next.missingCodes.join("|");
  });
  if (recentIndex >= 0) return current;
  return [...current, next].slice(-MAX_PROGRESS_RECORDS);
}

export function readProgressRecords(storage) {
  if (!storage?.getItem) return [];
  try {
    return sanitizeProgressRecords(JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY) || "[]"));
  } catch {
    return [];
  }
}

export function writeProgressRecord(storage, input = {}) {
  if (!storage?.setItem) return [];
  const next = upsertProgressRecord(readProgressRecords(storage), input);
  storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearProgressRecords(storage) {
  storage?.removeItem?.(PROGRESS_STORAGE_KEY);
  return [];
}

export function latestProgressRecords(records = []) {
  const latest = new Map();
  for (const record of sanitizeProgressRecords(records)) {
    const key = [record.exerciseId, record.questionId, record.modeId].join("|");
    latest.set(key, record);
  }
  return [...latest.values()].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function summarizeGroup(records = []) {
  const counts = emptyStatusCounts();
  records.forEach((record) => addStatus(counts, record.status));
  return counts;
}

function summarizeNeeds(records = []) {
  const counts = {};
  records.forEach((record) => record.missingCodes.forEach((code) => {
    counts[code] = (counts[code] || 0) + 1;
  }));
  return Object.entries(counts)
    .map(([code, count]) => ({ code, label: PROGRESS_NEED_LABELS[code], count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function trendSummary(records = []) {
  const ordered = [...records].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const recent = ordered.slice(0, 5);
  const previous = ordered.slice(5, 10);
  const rate = (items) => items.length
    ? Math.round((items.filter((item) => COMPLETE_STATUSES.has(item.status)).length / items.length) * 100)
    : 0;
  const recentRate = rate(recent);
  const previousRate = rate(previous);
  return {
    recentRate,
    previousRate,
    direction: previous.length === 0 ? "insufficient" : recentRate > previousRate ? "up" : recentRate < previousRate ? "down" : "stable"
  };
}

export function summarizeProgress(records = []) {
  const history = sanitizeProgressRecords(records);
  const latest = latestProgressRecords(history);
  const totals = summarizeGroup(latest);
  const byDimension = Object.fromEntries(Object.keys(QUESTION_DIMENSIONS).map((dimension) => [
    dimension,
    summarizeGroup(latest.filter((record) => record.dimension === dimension))
  ]));
  const byMode = Object.fromEntries(["training", "simulation"].map((modeId) => [
    modeId,
    summarizeGroup(latest.filter((record) => record.modeId === modeId))
  ]));
  const byLevel = Object.fromEntries(["6e", "sec1", "sec2"].map((levelId) => [
    levelId,
    summarizeGroup(latest.filter((record) => record.levelId === levelId))
  ]));
  const needs = summarizeNeeds(latest);
  const dimensionRows = Object.entries(byDimension).filter(([, value]) => value.total > 0);
  const strongestDimension = [...dimensionRows].sort((a, b) => b[1].completionRate - a[1].completionRate || b[1].total - a[1].total)[0]?.[0] || "";
  const priorityDimension = [...dimensionRows].sort((a, b) => a[1].completionRate - b[1].completionRate || b[1].total - a[1].total)[0]?.[0] || "";

  return {
    version: PROGRESS_VERSION,
    historyCount: history.length,
    questionSnapshots: latest.length,
    totals,
    byDimension,
    byMode,
    byLevel,
    frequentNeeds: needs,
    topNeed: needs[0] || null,
    strongestDimension,
    priorityDimension,
    trend: trendSummary(history),
    recent: latest.slice(0, 8)
  };
}

export function buildStudentProgressSummary(summary = {}) {
  const total = summary.totals?.total || 0;
  if (!total) {
    return {
      title: "Ton suivi commencera après une vérification de réponse.",
      strength: "Aucune donnée n’est encore enregistrée.",
      priority: "Vérifie une réponse pour voir ta progression.",
      modeComparison: "Entraînement et simulation seront comparés lorsque les deux modes auront été utilisés."
    };
  }
  const strengthLabel = QUESTION_DIMENSIONS[summary.strongestDimension]?.label || "une dimension travaillée";
  const priorityLabel = QUESTION_DIMENSIONS[summary.priorityDimension]?.label || "la prochaine dimension";
  const training = summary.byMode?.training || emptyStatusCounts();
  const simulation = summary.byMode?.simulation || emptyStatusCounts();
  const modeComparison = training.total && simulation.total
    ? `Réponses complètes : ${training.completionRate}% en entraînement et ${simulation.completionRate}% en simulation.`
    : "Utilise les deux modes pour comparer ta progression.";
  return {
    title: `${summary.totals.complete} réponse(s) complète(s) sur ${total} suivie(s).`,
    strength: `Ta dimension la plus solide actuellement : ${strengthLabel}.`,
    priority: summary.topNeed
      ? `Ta prochaine priorité : ${summary.topNeed.label}.`
      : `Continue à consolider la dimension ${priorityLabel}.`,
    modeComparison
  };
}

export function validateProgressData(records = []) {
  const sanitized = sanitizeProgressRecords(records);
  const invalid = sanitized.filter((record) => !record.exerciseId || !record.questionId || !VALID_STATUSES.has(record.status));
  const containsSensitiveText = sanitized.some((record) => Object.keys(record).some((key) => /answer|evidenceText|expectedAnswer|proofText/i.test(key)));
  return {
    valid: invalid.length === 0 && !containsSensitiveText,
    records: sanitized.length,
    invalid: invalid.length,
    containsSensitiveText,
    message: invalid.length
      ? `${invalid.length} enregistrement(s) invalide(s).`
      : containsSensitiveText
        ? "Des données textuelles sensibles sont présentes dans le suivi."
        : `${sanitized.length} enregistrement(s) valides, sans texte de réponse ni passage.`
  };
}
