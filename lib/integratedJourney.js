export const INTEGRATED_JOURNEY_SCHEMA_VERSION = "1.0";
export const INTEGRATED_JOURNEY_ACTIVE_KEY = "lecture_integrated_journey_active_v1";
export const INTEGRATED_JOURNEY_NOTES_KEY = "lecture_integrated_journey_notes_v1";
export const INTEGRATED_JOURNEY_HISTORY_KEY = "lecture_integrated_journey_history_v1";
export const INTEGRATED_JOURNEY_CUSTOM_KEY = "lecture_integrated_journey_custom_v1";
export const READING_WORK_STORAGE_KEY = "lecture_student_work_v9";
export const WRITING_WORK_STORAGE_KEY = "lecture6e_writing_practice_v5";
export const MAX_INTEGRATED_JOURNEY_HISTORY = 200;
export const JOURNEY_HISTORY_DEDUPE_MS = 5000;

export const INTEGRATED_JOURNEY_STAGES = {
  selected: "Parcours choisi",
  reading: "Lecture en cours",
  notes: "Feuille de notes préparée",
  writing: "Écriture en cours",
  review: "Révision en cours",
  completed: "Parcours terminé"
};

export const INTEGRATED_JOURNEY_EVENT_LABELS = {
  journey_started: "Parcours commencé",
  reading_progressed: "Lecture avancée",
  notes_prepared: "Feuille de notes préparée",
  writing_started: "Écriture commencée",
  review_reached: "Révision atteinte",
  journey_completed: "Parcours terminé"
};

export const INTEGRATED_WRITING_TYPES = {
  opinion: "Lettre d’opinion",
  explicatif: "Texte explicatif",
  reaction: "Réaction ou appréciation"
};

export const BUILT_IN_INTEGRATED_JOURNEYS = [
  {
    id: "parcours-aurores-explication",
    title: "Des aurores à une explication scientifique",
    exerciseId: "aurores-boreales",
    levelId: "6e",
    readingTextType: "informatif",
    readingIntention: "Comprendre la formation des aurores boréales, leurs couleurs et leurs effets.",
    writingTypeId: "explicatif",
    writingIntention: "Expliquer clairement comment se forment les aurores boréales et pourquoi elles fascinent les humains.",
    status: "ready",
    source: "integrated"
  },
  {
    id: "parcours-vadeboncoeur-reaction",
    title: "Comprendre un personnage et réagir à ses gestes",
    exerciseId: "m-vadeboncoeur",
    levelId: "6e",
    readingTextType: "narratif",
    readingIntention: "Comprendre comment les gestes d’un personnage transforment une communauté.",
    writingTypeId: "reaction",
    writingIntention: "Présenter une réaction personnelle aux gestes de M. Vadeboncoeur et l’appuyer sur des événements précis du récit.",
    status: "ready",
    source: "integrated"
  },
  {
    id: "parcours-bibliotheque-reaction",
    title: "D’un récit à une appréciation argumentée",
    exerciseId: "sec1-bibliotheque-objets",
    levelId: "sec1",
    readingTextType: "narratif",
    readingIntention: "Comprendre les motivations de Malik et la portée symbolique de la bibliothèque.",
    writingTypeId: "reaction",
    writingIntention: "Présenter une appréciation du projet de Malik en s’appuyant sur des actions et des symboles du récit.",
    status: "ready",
    source: "integrated"
  },
  {
    id: "parcours-notifications-opinion",
    title: "Analyser des arguments et prendre position",
    exerciseId: "sec2-notifications-ecole",
    levelId: "sec2",
    readingTextType: "opinion",
    readingIntention: "Comprendre la thèse, les arguments et les contre-arguments liés aux notifications à l’école.",
    writingTypeId: "opinion",
    writingIntention: "Prendre position sur la limitation des notifications pendant les heures d’école et répondre à un contre-argument.",
    status: "ready",
    source: "integrated"
  }
];

const ALLOWED_LEVELS = new Set(["6e", "sec1", "sec2"]);
const ALLOWED_MODES = new Set(["training", "simulation"]);
const ALLOWED_STAGES = new Set(Object.keys(INTEGRATED_JOURNEY_STAGES));
const ALLOWED_WRITING_TYPES = new Set(Object.keys(INTEGRATED_WRITING_TYPES));
const ALLOWED_EVENTS = new Set(Object.keys(INTEGRATED_JOURNEY_EVENT_LABELS));
const FORBIDDEN_HISTORY_KEYS = [
  "draft", "brouillon", "finalText", "finalVersion", "versionFinale", "sentence",
  "studentText", "studentAnswer", "answers", "answer", "responseText", "selectedProof",
  "proofText", "proofs", "notes", "noteText", "feedback", "personalizedFeedback",
  "correctedText", "rewrittenText", "replacementText", "expectedAnswer", "grade",
  "score", "rating", "errorCount", "mistakeCount"
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
    .slice(0, 120);
  return cleaned || fallback;
}

function cleanText(value, maximum = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maximum);
}

function safeDate(value) {
  const parsed = new Date(value || Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function safeInteger(value, minimum = 0, maximum = 9999) {
  const number = Number(value);
  if (!Number.isFinite(number)) return minimum;
  return Math.max(minimum, Math.min(maximum, Math.trunc(number)));
}

function normalizeLevel(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("sec") && normalized.includes("2")) return "sec2";
  if (normalized.includes("sec") && normalized.includes("1")) return "sec1";
  return ALLOWED_LEVELS.has(normalized) ? normalized : "6e";
}

function uniqueById(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter((item) => {
    const id = String(item?.id || "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function normalizeIntegratedJourney(input = {}) {
  const id = cleanId(input.id, `parcours-${Date.now()}`);
  return {
    id,
    title: cleanText(input.title, 180),
    exerciseId: cleanId(input.exerciseId),
    levelId: ALLOWED_LEVELS.has(input.levelId) ? input.levelId : normalizeLevel(input.level),
    readingTextType: cleanText(input.readingTextType || input.textType, 80),
    readingIntention: cleanText(input.readingIntention, 500),
    writingTypeId: ALLOWED_WRITING_TYPES.has(input.writingTypeId) ? input.writingTypeId : "opinion",
    writingIntention: cleanText(input.writingIntention, 500),
    status: input.status === "ready" ? "ready" : "draft",
    source: input.source === "integrated" ? "integrated" : "local",
    version: INTEGRATED_JOURNEY_SCHEMA_VERSION
  };
}

function writingIntentionLooksCoherent(journey) {
  const intention = journey.writingIntention.toLowerCase();
  if (!intention) return false;
  if (journey.writingTypeId === "opinion") return /(opinion|position|convain|argument|contre-argument)/.test(intention);
  if (journey.writingTypeId === "explicatif") return /(expliqu|comprendre|cause|conséquence|fonctionnement)/.test(intention);
  return /(réagir|réaction|appréci|jugement|ressenti|recommand)/.test(intention);
}

export function validateIntegratedJourney(input, exercises = []) {
  const journey = normalizeIntegratedJourney(input);
  const errors = [];
  const warnings = [];
  const exercise = (Array.isArray(exercises) ? exercises : []).find((item) => item?.id === journey.exerciseId);

  if (!journey.title) errors.push("Le titre du parcours est vide.");
  if (!journey.exerciseId) errors.push("Aucun texte de lecture n’est associé.");
  if (!exercise && journey.exerciseId) errors.push("Le texte associé est introuvable dans la banque disponible.");
  if (!journey.readingIntention) errors.push("L’intention de lecture est vide.");
  if (!journey.writingIntention) errors.push("L’intention d’écriture est vide.");
  if (!ALLOWED_WRITING_TYPES.has(journey.writingTypeId)) errors.push("Le type d’écriture est invalide.");

  if (exercise) {
    const exerciseLevel = normalizeLevel(exercise.level);
    if (exerciseLevel !== journey.levelId) {
      errors.push(`Le niveau du parcours (${journey.levelId}) ne correspond pas au niveau du texte (${exerciseLevel}).`);
    }
    if (!journey.readingTextType) warnings.push("Le type du texte lu n’est pas précisé dans le parcours.");
    if (journey.readingIntention && exercise.intention && !journey.readingIntention.toLowerCase().includes("comprendre")) {
      warnings.push("L’intention de lecture devrait indiquer clairement ce que l’élève doit comprendre ou repérer.");
    }
  }

  if (!writingIntentionLooksCoherent(journey)) {
    warnings.push(`L’intention d’écriture semble peu alignée avec le type « ${INTEGRATED_WRITING_TYPES[journey.writingTypeId]} ».`);
  }

  const status = errors.length ? "blocked" : warnings.length ? "review" : "ready";
  return { journey, exercise, errors, warnings, status, valid: errors.length === 0 };
}

export function summarizeIntegratedJourneyBank(journeys, exercises = []) {
  const values = uniqueById((journeys || []).map(normalizeIntegratedJourney));
  const audits = values.map((journey) => validateIntegratedJourney(journey, exercises));
  return {
    total: audits.length,
    ready: audits.filter((audit) => audit.status === "ready").length,
    review: audits.filter((audit) => audit.status === "review").length,
    blocked: audits.filter((audit) => audit.status === "blocked").length,
    byLevel: Object.fromEntries([...ALLOWED_LEVELS].map((level) => [level, audits.filter((audit) => audit.journey.levelId === level).length])),
    audits
  };
}

export function readCustomIntegratedJourneys(storage) {
  const target = storageOrDefault(storage);
  if (!target) return [];
  try {
    const value = JSON.parse(target.getItem(INTEGRATED_JOURNEY_CUSTOM_KEY) || "[]");
    return uniqueById((Array.isArray(value) ? value : []).map((item) => normalizeIntegratedJourney({ ...item, source: "local" })));
  } catch {
    return [];
  }
}

export function writeCustomIntegratedJourney(input, storage) {
  const target = storageOrDefault(storage);
  if (!target) return [];
  const journey = normalizeIntegratedJourney({ ...input, source: "local" });
  const current = readCustomIntegratedJourneys(target).filter((item) => item.id !== journey.id);
  const next = [journey, ...current];
  target.setItem(INTEGRATED_JOURNEY_CUSTOM_KEY, JSON.stringify(next));
  return next;
}

export function deleteCustomIntegratedJourney(id, storage) {
  const target = storageOrDefault(storage);
  if (!target) return [];
  const next = readCustomIntegratedJourneys(target).filter((item) => item.id !== id);
  target.setItem(INTEGRATED_JOURNEY_CUSTOM_KEY, JSON.stringify(next));
  return next;
}

export function getIntegratedJourneyBank(storage) {
  return uniqueById([...BUILT_IN_INTEGRATED_JOURNEYS, ...readCustomIntegratedJourneys(storage)]);
}

function historyEventId(occurredAt) {
  return `journey-${new Date(occurredAt).getTime()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeIntegratedJourneyHistoryEvent(input = {}) {
  const occurredAt = safeDate(input.occurredAt);
  return {
    id: cleanId(input.id, historyEventId(occurredAt)),
    occurredAt,
    journeyId: cleanId(input.journeyId),
    levelId: ALLOWED_LEVELS.has(input.levelId) ? input.levelId : "6e",
    modeId: ALLOWED_MODES.has(input.modeId) ? input.modeId : "training",
    eventType: ALLOWED_EVENTS.has(input.eventType) ? input.eventType : "journey_started",
    stage: ALLOWED_STAGES.has(input.stage) ? input.stage : "selected",
    questionsCompleted: safeInteger(input.questionsCompleted, 0, 1000),
    questionCount: safeInteger(input.questionCount, 0, 1000),
    noteCount: safeInteger(input.noteCount, 0, 100),
    writingStep: safeInteger(input.writingStep, 0, 7),
    criteriaWorkedCount: safeInteger(input.criteriaWorkedCount, 0, 20),
    version: INTEGRATED_JOURNEY_SCHEMA_VERSION
  };
}

function historyFingerprint(event) {
  return JSON.stringify({
    journeyId: event.journeyId,
    levelId: event.levelId,
    modeId: event.modeId,
    eventType: event.eventType,
    stage: event.stage,
    questionsCompleted: event.questionsCompleted,
    questionCount: event.questionCount,
    noteCount: event.noteCount,
    writingStep: event.writingStep,
    criteriaWorkedCount: event.criteriaWorkedCount
  });
}

export function sanitizeIntegratedJourneyHistory(records) {
  return (Array.isArray(records) ? records : [])
    .filter((record) => record && typeof record === "object")
    .map(normalizeIntegratedJourneyHistoryEvent)
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    .slice(0, MAX_INTEGRATED_JOURNEY_HISTORY);
}

export function addIntegratedJourneyHistoryEvent(records, input) {
  const current = sanitizeIntegratedJourneyHistory(records);
  const event = normalizeIntegratedJourneyHistoryEvent(input);
  const duplicate = current.find((record) => {
    const delta = Math.abs(new Date(record.occurredAt) - new Date(event.occurredAt));
    return delta <= JOURNEY_HISTORY_DEDUPE_MS && historyFingerprint(record) === historyFingerprint(event);
  });
  return duplicate ? current : sanitizeIntegratedJourneyHistory([event, ...current]);
}

export function readIntegratedJourneyHistory(storage) {
  const target = storageOrDefault(storage);
  if (!target) return [];
  try {
    return sanitizeIntegratedJourneyHistory(JSON.parse(target.getItem(INTEGRATED_JOURNEY_HISTORY_KEY) || "[]"));
  } catch {
    return [];
  }
}

export function writeIntegratedJourneyHistoryEvent(input, storage) {
  const target = storageOrDefault(storage);
  if (!target) return [];
  const next = addIntegratedJourneyHistoryEvent(readIntegratedJourneyHistory(target), input);
  target.setItem(INTEGRATED_JOURNEY_HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function clearIntegratedJourneyHistory(storage) {
  const target = storageOrDefault(storage);
  if (target) target.removeItem(INTEGRATED_JOURNEY_HISTORY_KEY);
}

export function normalizeActiveIntegratedJourney(input = {}) {
  return {
    journeyId: cleanId(input.journeyId),
    levelId: ALLOWED_LEVELS.has(input.levelId) ? input.levelId : "6e",
    modeId: ALLOWED_MODES.has(input.modeId) ? input.modeId : "training",
    stage: ALLOWED_STAGES.has(input.stage) ? input.stage : "selected",
    startedAt: safeDate(input.startedAt),
    updatedAt: safeDate(input.updatedAt),
    questionsCompleted: safeInteger(input.questionsCompleted, 0, 1000),
    questionCount: safeInteger(input.questionCount, 0, 1000),
    noteCount: safeInteger(input.noteCount, 0, 100),
    writingStep: safeInteger(input.writingStep, 0, 7),
    criteriaWorkedCount: safeInteger(input.criteriaWorkedCount, 0, 20),
    version: INTEGRATED_JOURNEY_SCHEMA_VERSION
  };
}

export function readActiveIntegratedJourney(storage) {
  const target = storageOrDefault(storage);
  if (!target) return null;
  try {
    const value = JSON.parse(target.getItem(INTEGRATED_JOURNEY_ACTIVE_KEY) || "null");
    return value?.journeyId ? normalizeActiveIntegratedJourney(value) : null;
  } catch {
    return null;
  }
}

export function writeActiveIntegratedJourney(input, storage) {
  const target = storageOrDefault(storage);
  if (!target) return null;
  const value = normalizeActiveIntegratedJourney(input);
  target.setItem(INTEGRATED_JOURNEY_ACTIVE_KEY, JSON.stringify(value));
  return value;
}

export function startIntegratedJourney(journeyInput, modeId = "training", storage) {
  const target = storageOrDefault(storage);
  const journey = normalizeIntegratedJourney(journeyInput);
  const now = new Date().toISOString();
  const active = writeActiveIntegratedJourney({
    journeyId: journey.id,
    levelId: journey.levelId,
    modeId: ALLOWED_MODES.has(modeId) ? modeId : "training",
    stage: "reading",
    startedAt: now,
    updatedAt: now,
    questionsCompleted: 0,
    questionCount: 0,
    noteCount: 0,
    writingStep: 0,
    criteriaWorkedCount: 0
  }, target);
  writeIntegratedJourneyHistoryEvent({ ...active, occurredAt: now, eventType: "journey_started" }, target);
  if (target) target.removeItem(INTEGRATED_JOURNEY_NOTES_KEY);
  return active;
}

export function buildReadingWorkForJourney(journeyInput, exercise, modeId = "training") {
  const journey = normalizeIntegratedJourney(journeyInput);
  return {
    exerciseId: exercise?.id || journey.exerciseId,
    view: "student",
    step: 1,
    qIndex: 0,
    notes: {},
    proofs: [],
    answers: {},
    checks: {},
    readingHighlights: {},
    big: false,
    spaced: false,
    selectedLevel: journey.levelId,
    learningMode: ALLOWED_MODES.has(modeId) ? modeId : "training",
    simulationSubmitted: false,
    integratedJourneyId: journey.id,
    savedAt: new Date().toISOString()
  };
}

export function inspectReadingWork(readingWork, exercise) {
  const answers = readingWork?.answers && typeof readingWork.answers === "object" ? readingWork.answers : {};
  const questions = Array.isArray(exercise?.questions) ? exercise.questions : [];
  const questionsCompleted = questions.filter((question) => String(answers[question.id] || "").trim()).length;
  const questionCount = questions.length;
  const noteCount = Object.values(readingWork?.notes || {}).filter((value) => String(value || "").trim()).length
    + (Array.isArray(readingWork?.proofs) ? readingWork.proofs.filter((proof) => String(proof?.text || "").trim()).length : 0);
  return {
    questionsCompleted,
    questionCount,
    noteCount,
    readingStarted: questionsCompleted > 0 || noteCount > 0 || Number(readingWork?.step || 1) > 1,
    readyForWriting: questionsCompleted > 0 || noteCount > 0,
    warning: questionsCompleted > 0 || noteCount > 0
      ? ""
      : "L’écriture peut être ouverte, mais aucune lecture préparatoire n’est encore repérée."
  };
}

function noteRow(id, sourceType, sourceLabel, content = "") {
  return {
    id,
    sourceType,
    sourceLabel: cleanText(sourceLabel, 180),
    info: cleanText(content, 700),
    fact: "",
    keyword: "",
    opinionLink: ""
  };
}

export function buildJourneyNoteSheet(readingWork, exercise, modeId = "training") {
  const simulation = modeId === "simulation";
  const rows = [];
  const paragraphNotes = Object.entries(readingWork?.notes || {})
    .filter(([, value]) => String(value || "").trim())
    .map(([key, value], index) => noteRow(`paragraph-${key || index}`, "reading-note", simulation ? "Note de lecture" : `Résumé de lecture ${index + 1}`, value));
  const proofNotes = (Array.isArray(readingWork?.proofs) ? readingWork.proofs : [])
    .filter((proof) => String(proof?.text || "").trim())
    .map((proof, index) => noteRow(`proof-${proof.id || index}`, "selected-passage", simulation ? "Passage noté" : `Passage retenu ${index + 1}`, proof.text));
  rows.push(...paragraphNotes, ...proofNotes);

  if (!simulation) {
    const answers = readingWork?.answers || {};
    const completedQuestions = (exercise?.questions || []).filter((question) => String(answers[question.id] || "").trim());
    completedQuestions.slice(0, 4).forEach((question, index) => {
      if (rows.length >= 6) return;
      rows.push(noteRow(`question-${question.id}`, "question", `Question complétée ${index + 1} — ${cleanText(question.prompt, 140)}`, ""));
    });
  }

  const maximum = simulation ? 5 : 8;
  while (rows.length < (simulation ? 4 : 3)) {
    const index = rows.length + 1;
    rows.push(noteRow(`blank-${index}`, "manual", simulation ? `Note ${index}` : `Idée importante ${index}`, ""));
  }

  return {
    journeyId: cleanId(readingWork?.integratedJourneyId),
    modeId: simulation ? "simulation" : "training",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rows: rows.slice(0, maximum),
    version: INTEGRATED_JOURNEY_SCHEMA_VERSION
  };
}

export function sanitizeJourneyNoteSheet(input = {}) {
  const rows = (Array.isArray(input.rows) ? input.rows : []).slice(0, 8).map((row, index) => ({
    id: cleanId(row?.id, `note-${index + 1}`),
    sourceType: cleanId(row?.sourceType, "manual"),
    sourceLabel: cleanText(row?.sourceLabel, 180),
    info: cleanText(row?.info, 700),
    fact: cleanText(row?.fact, 700),
    keyword: cleanText(row?.keyword, 120),
    opinionLink: cleanText(row?.opinionLink, 700)
  }));
  return {
    journeyId: cleanId(input.journeyId),
    modeId: input.modeId === "simulation" ? "simulation" : "training",
    createdAt: safeDate(input.createdAt),
    updatedAt: safeDate(input.updatedAt),
    rows,
    version: INTEGRATED_JOURNEY_SCHEMA_VERSION
  };
}

export function readJourneyNoteSheet(storage) {
  const target = storageOrDefault(storage);
  if (!target) return null;
  try {
    const value = JSON.parse(target.getItem(INTEGRATED_JOURNEY_NOTES_KEY) || "null");
    return value?.journeyId ? sanitizeJourneyNoteSheet(value) : null;
  } catch {
    return null;
  }
}

export function writeJourneyNoteSheet(input, storage) {
  const target = storageOrDefault(storage);
  if (!target) return null;
  const value = sanitizeJourneyNoteSheet({ ...input, updatedAt: new Date().toISOString() });
  target.setItem(INTEGRATED_JOURNEY_NOTES_KEY, JSON.stringify(value));
  return value;
}

export function buildWritingWorkForJourney(journeyInput, noteSheet, modeId = "training") {
  const journey = normalizeIntegratedJourney(journeyInput);
  const sheet = sanitizeJourneyNoteSheet(noteSheet || { journeyId: journey.id, modeId, rows: [] });
  return {
    step: 1,
    textId: journey.exerciseId,
    situationId: journey.writingTypeId,
    audience: "",
    purpose: journey.writingIntention,
    ideas: [
      { know: "", say: "", proof: "", role: "Opinion ou idée principale" },
      { know: "", say: "", proof: "", role: "Raison ou aspect 1" },
      { know: "", say: "", proof: "", role: "Raison ou aspect 2" }
    ],
    plan: { intro: "", dev1: "", dev2: "", conclusion: "" },
    draft: "",
    finalText: "",
    checks: {},
    examMode: modeId === "simulation",
    examNotes: sheet.rows.map((row, index) => ({
      id: index + 1,
      info: row.info || row.sourceLabel,
      fact: row.fact,
      keyword: row.keyword,
      opinionLink: row.opinionLink
    })),
    requireCompletion: false,
    alignmentWarning: false,
    integratedJourneyId: journey.id,
    savedAt: new Date().toISOString()
  };
}

export function inspectWritingWork(writingWork = {}) {
  const checks = writingWork.checks && typeof writingWork.checks === "object" ? writingWork.checks : {};
  const ministryCriteriaChecked = Object.entries(checks)
    .filter(([key, value]) => key.startsWith("ministere-ecriture-") && Boolean(value)).length;
  const step = safeInteger(writingWork.step, 0, 7);
  return {
    writingStarted: step > 1 || Boolean(String(writingWork.draft || "").trim()) || Boolean(String(writingWork.finalText || "").trim()),
    writingStep: step,
    reviewReached: step >= 5,
    finalStageReached: step >= 7,
    criteriaWorkedCount: Math.min(5, ministryCriteriaChecked),
    simulationChecklistComplete: ministryCriteriaChecked >= 5
  };
}

function stageFromInspections(reading, writing, noteSheet) {
  if (writing.finalStageReached || (writing.simulationChecklistComplete && writing.writingStep >= 5)) return "review";
  if (writing.writingStarted) return writing.reviewReached ? "review" : "writing";
  if (noteSheet?.rows?.length) return "notes";
  return reading.readingStarted ? "reading" : "selected";
}

export function synchronizeIntegratedJourney(activeInput, readingWork, writingWork, exercise, noteSheet, storage) {
  const target = storageOrDefault(storage);
  if (!activeInput) return null;
  const active = normalizeActiveIntegratedJourney(activeInput);
  const reading = inspectReadingWork(readingWork, exercise);
  const writing = inspectWritingWork(writingWork);
  const stage = stageFromInspections(reading, writing, noteSheet);
  const next = writeActiveIntegratedJourney({
    ...active,
    stage,
    updatedAt: new Date().toISOString(),
    questionsCompleted: reading.questionsCompleted,
    questionCount: reading.questionCount,
    noteCount: Array.isArray(noteSheet?.rows) ? noteSheet.rows.filter((row) => [row.info, row.fact, row.keyword, row.opinionLink].some((value) => String(value || "").trim())).length : 0,
    writingStep: writing.writingStep,
    criteriaWorkedCount: writing.criteriaWorkedCount
  }, target);

  let eventType = null;
  if (stage === "reading" && reading.readingStarted) eventType = "reading_progressed";
  if (stage === "notes") eventType = "notes_prepared";
  if (stage === "writing") eventType = "writing_started";
  if (stage === "review") eventType = "review_reached";
  if (eventType) writeIntegratedJourneyHistoryEvent({ ...next, eventType }, target);
  return { active: next, reading, writing };
}

export function completeIntegratedJourney(activeInput, storage) {
  const target = storageOrDefault(storage);
  const active = normalizeActiveIntegratedJourney(activeInput || {});
  const next = writeActiveIntegratedJourney({ ...active, stage: "completed", updatedAt: new Date().toISOString() }, target);
  writeIntegratedJourneyHistoryEvent({ ...next, eventType: "journey_completed" }, target);
  return next;
}

export function clearActiveIntegratedJourney(storage) {
  const target = storageOrDefault(storage);
  if (!target) return;
  target.removeItem(INTEGRATED_JOURNEY_ACTIVE_KEY);
  target.removeItem(INTEGRATED_JOURNEY_NOTES_KEY);
}

export function summarizeIntegratedJourneyHistory(records) {
  const safe = sanitizeIntegratedJourneyHistory(records);
  const byEvent = Object.fromEntries(Object.keys(INTEGRATED_JOURNEY_EVENT_LABELS).map((key) => [key, 0]));
  const byMode = { training: 0, simulation: 0 };
  const byLevel = { "6e": 0, sec1: 0, sec2: 0 };
  safe.forEach((record) => {
    byEvent[record.eventType] += 1;
    byMode[record.modeId] += 1;
    byLevel[record.levelId] += 1;
  });
  return {
    total: safe.length,
    completed: byEvent.journey_completed,
    started: byEvent.journey_started,
    byEvent,
    byMode,
    byLevel,
    recent: safe.slice(0, 12)
  };
}

export function buildIntegratedJourneyHistoryExport(records, journeys = []) {
  const safe = sanitizeIntegratedJourneyHistory(records);
  return {
    exportType: "historique-parcours-lecture-ecriture",
    schemaVersion: INTEGRATED_JOURNEY_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    privacy: {
      containsStudentAnswers: false,
      containsSelectedProofs: false,
      containsWritingDrafts: false,
      containsFinalTexts: false,
      containsPersonalizedFeedback: false,
      containsGrades: false
    },
    journeys: (journeys || []).map((journey) => {
      const normalized = normalizeIntegratedJourney(journey);
      return {
        id: normalized.id,
        title: normalized.title,
        exerciseId: normalized.exerciseId,
        levelId: normalized.levelId,
        readingTextType: normalized.readingTextType,
        readingIntention: normalized.readingIntention,
        writingTypeId: normalized.writingTypeId,
        writingIntention: normalized.writingIntention,
        status: normalized.status,
        source: normalized.source,
        version: normalized.version
      };
    }),
    summary: summarizeIntegratedJourneyHistory(safe),
    records: safe
  };
}

function collectForbiddenHistoryKeys(value, found = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectForbiddenHistoryKeys(item, found));
    return found;
  }
  if (!value || typeof value !== "object") return found;
  Object.entries(value).forEach(([key, child]) => {
    if (FORBIDDEN_HISTORY_KEYS.some((forbidden) => forbidden.toLowerCase() === key.toLowerCase())) found.add(key);
    collectForbiddenHistoryKeys(child, found);
  });
  return found;
}

export function validateIntegratedJourneyHistory(records) {
  const safe = sanitizeIntegratedJourneyHistory(records);
  const forbiddenFound = [...collectForbiddenHistoryKeys(safe)].sort();
  const invalidVersions = safe.filter((record) => record.version !== INTEGRATED_JOURNEY_SCHEMA_VERSION).length;
  return {
    valid: forbiddenFound.length === 0 && invalidVersions === 0 && safe.length <= MAX_INTEGRATED_JOURNEY_HISTORY,
    message: `${safe.length} événement(s) minimal(aux) vérifié(s).`,
    forbiddenFound,
    invalidVersions
  };
}
