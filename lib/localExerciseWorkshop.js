import { auditExerciseContent } from "./contentCalibration.js";
import {
  normalizeExerciseQuestions,
  normalizeQuestion,
  normalizeQuestionLevel,
  validateQuestionSchema
} from "./questionClassification.js";

export const LOCAL_EXERCISE_STORE_KEY = "lecture_local_exercise_workshop_v1";
export const LOCAL_EXERCISE_STORE_VERSION = "1.0";
export const LOCAL_EXERCISE_EVENT = "lecture-local-exercise-bank-changed";

export const LOCAL_EXERCISE_STATUSES = {
  draft: "Brouillon",
  published: "Publié dans le parcours élève"
};

const ALLOWED_STATUSES = new Set(Object.keys(LOCAL_EXERCISE_STATUSES));

function cleanText(value, maximum = 50000) {
  return String(value || "").replace(/\r\n/g, "\n").trim().slice(0, maximum);
}

function slugify(value) {
  return cleanText(value, 120)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export function makeLocalExerciseId(title = "nouvel-exercice") {
  const slug = slugify(title) || "nouvel-exercice";
  return `local-${slug}-${Date.now().toString(36)}`;
}

export function createQuestionTemplate(index = 0, targetLevel = "6e") {
  return normalizeQuestion({
    id: `question-${index + 1}`,
    prompt: "",
    type: "comprendre",
    points: 1,
    expectedAnswer: "",
    acceptableAnswers: [],
    isPersonalAnswer: false,
    proofTypeSuggested: "explicite",
    targetLevel
  }, { targetLevel });
}

export function createExerciseTemplate(level = "6e") {
  const levelId = normalizeQuestionLevel(level);
  const levelLabel = levelId === "sec2" ? "Secondaire 2" : levelId === "sec1" ? "Secondaire 1" : "6e année";
  const now = Date.now();
  return {
    id: `local-nouvel-exercice-${now.toString(36)}`,
    title: "Nouvel exercice",
    level: levelLabel,
    textType: "narratif",
    category: "texte littéraire",
    intention: "Lire pour comprendre le texte et justifier ses réponses.",
    description: "Exercice créé localement dans l’espace administrateur.",
    difficulty: "À calibrer",
    text: "",
    vocabulary: [],
    calibration: {
      version: "local-1.0",
      targetLevel: levelId,
      reviewStatus: "draft",
      intendedReadingMinutes: levelId === "6e" ? 5 : 7,
      difficultyFeatures: []
    },
    questions: [createQuestionTemplate(0, levelId)]
  };
}

export function sanitizeWorkshopQuestion(question = {}, index = 0, targetLevel = "6e") {
  const fallbackId = `question-${index + 1}`;
  const normalized = normalizeQuestion({
    ...question,
    id: cleanText(question.id || fallbackId, 120),
    prompt: cleanText(question.prompt || question.text, 1200),
    expectedAnswer: cleanText(question.expectedAnswer, 3000),
    acceptableAnswers: Array.isArray(question.acceptableAnswers)
      ? question.acceptableAnswers.map((item) => cleanText(item, 1000)).filter(Boolean).slice(0, 20)
      : [],
    points: Math.max(1, Math.min(10, Number(question.points || 1))),
    isPersonalAnswer: Boolean(question.isPersonalAnswer)
  }, { targetLevel });

  return {
    ...normalized,
    id: normalized.id || fallbackId,
    legacyType: question.legacyType || question.type || normalized.dimension,
    type: question.type || normalized.dimension,
    hints: Array.isArray(question.hints)
      ? question.hints.map((item) => cleanText(item, 800)).filter(Boolean).slice(0, 5)
      : []
  };
}

export function sanitizeWorkshopExercise(value = {}) {
  const targetLevel = normalizeQuestionLevel(value.level || value.targetLevel || value.calibration?.targetLevel || "6e");
  const levelLabel = targetLevel === "sec2" ? "Secondaire 2" : targetLevel === "sec1" ? "Secondaire 1" : "6e année";
  const title = cleanText(value.title || "Nouvel exercice", 180);
  const id = cleanText(value.id || makeLocalExerciseId(title), 120);
  const questions = Array.isArray(value.questions) && value.questions.length
    ? value.questions.map((question, index) => sanitizeWorkshopQuestion(question, index, targetLevel))
    : [createQuestionTemplate(0, targetLevel)];

  return normalizeExerciseQuestions({
    ...value,
    id,
    title,
    level: levelLabel,
    textType: cleanText(value.textType || "narratif", 80).toLowerCase(),
    category: cleanText(value.category || "texte littéraire", 120),
    intention: cleanText(value.intention || "Lire pour comprendre le texte et justifier ses réponses.", 600),
    description: cleanText(value.description || "Exercice créé localement.", 1000),
    difficulty: cleanText(value.difficulty || "À calibrer", 240),
    text: cleanText(value.text, 60000),
    vocabulary: Array.isArray(value.vocabulary)
      ? value.vocabulary.map((item) => ({
          word: cleanText(item?.word, 120),
          definition: cleanText(item?.definition, 500)
        })).filter((item) => item.word && item.definition).slice(0, 80)
      : [],
    calibration: {
      ...(value.calibration || {}),
      version: cleanText(value.calibration?.version || "local-1.0", 40),
      targetLevel,
      reviewStatus: cleanText(value.calibration?.reviewStatus || "draft", 40),
      intendedReadingMinutes: Math.max(1, Math.min(60, Number(value.calibration?.intendedReadingMinutes || (targetLevel === "6e" ? 5 : 7)))),
      difficultyFeatures: Array.isArray(value.calibration?.difficultyFeatures)
        ? value.calibration.difficultyFeatures.map((item) => cleanText(item, 240)).filter(Boolean).slice(0, 20)
        : []
    },
    questions
  });
}

export function validateWorkshopExercise(value = {}, existingIds = []) {
  const exercise = sanitizeWorkshopExercise(value);
  const errors = [];
  const warnings = [];
  const required = ["id", "title", "level", "textType", "category", "intention", "text"];
  for (const key of required) {
    if (!cleanText(exercise[key])) errors.push(`${key} manquant`);
  }
  if (!Array.isArray(exercise.questions) || exercise.questions.length === 0) errors.push("au moins une question est requise");
  if (existingIds.filter((id) => id === exercise.id).length > 1) errors.push("identifiant d’exercice en double");

  const questionIds = exercise.questions.map((question) => question.id);
  if (new Set(questionIds).size !== questionIds.length) errors.push("identifiants de questions en double");

  exercise.questions.forEach((question, index) => {
    const result = validateQuestionSchema(question);
    if (!result.valid) errors.push(`Q${index + 1} : ${result.errors.join(", ")}`);
    if (!cleanText(question.expectedAnswer) && !question.isPersonalAnswer) warnings.push(`Q${index + 1} : réponse attendue administrateur absente`);
  });

  const automaticAudit = auditExerciseContent(exercise);
  errors.push(...automaticAudit.errors.map((item) => `Audit automatique : ${item}`));
  warnings.push(...automaticAudit.warnings.map((item) => `Audit automatique : ${item}`));

  return {
    valid: errors.length === 0,
    exercise,
    errors,
    warnings,
    automaticAudit,
    message: errors.length
      ? `${errors.length} erreur(s) bloquante(s).`
      : warnings.length
        ? `Exercice valide avec ${warnings.length} avertissement(s).`
        : "Exercice valide et prêt à être publié localement."
  };
}

export function createEmptyLocalExerciseStore() {
  return {
    version: LOCAL_EXERCISE_STORE_VERSION,
    entries: [],
    selectedId: "",
    updatedAt: null
  };
}

export function sanitizeLocalExerciseEntry(entry = {}) {
  const exercise = sanitizeWorkshopExercise(entry.exercise || entry);
  return {
    exercise,
    status: ALLOWED_STATUSES.has(entry.status) ? entry.status : "draft",
    createdAt: typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString(),
    updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : new Date().toISOString()
  };
}

export function normalizeLocalExerciseStore(value) {
  const source = value && typeof value === "object" ? value : {};
  const rawEntries = Array.isArray(source.entries)
    ? source.entries
    : Array.isArray(source.exercises)
      ? source.exercises.map((exercise) => ({ exercise, status: "draft" }))
      : [];
  const seen = new Set();
  const entries = [];
  for (const raw of rawEntries) {
    const entry = sanitizeLocalExerciseEntry(raw);
    if (!entry.exercise.id || seen.has(entry.exercise.id)) continue;
    seen.add(entry.exercise.id);
    entries.push(entry);
  }
  const selectedId = entries.some((entry) => entry.exercise.id === source.selectedId)
    ? source.selectedId
    : entries[0]?.exercise.id || "";
  return {
    version: LOCAL_EXERCISE_STORE_VERSION,
    entries,
    selectedId,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null
  };
}

export function upsertLocalExercise(store, exercise, status = "draft") {
  const current = normalizeLocalExerciseStore(store);
  const safeExercise = sanitizeWorkshopExercise(exercise);
  const now = new Date().toISOString();
  const old = current.entries.find((entry) => entry.exercise.id === safeExercise.id);
  const nextEntry = {
    exercise: safeExercise,
    status: ALLOWED_STATUSES.has(status) ? status : old?.status || "draft",
    createdAt: old?.createdAt || now,
    updatedAt: now
  };
  const entries = old
    ? current.entries.map((entry) => entry.exercise.id === safeExercise.id ? nextEntry : entry)
    : [...current.entries, nextEntry];
  return {
    ...current,
    entries,
    selectedId: safeExercise.id,
    updatedAt: now
  };
}

export function removeLocalExercise(store, exerciseId) {
  const current = normalizeLocalExerciseStore(store);
  const entries = current.entries.filter((entry) => entry.exercise.id !== exerciseId);
  return {
    ...current,
    entries,
    selectedId: current.selectedId === exerciseId ? entries[0]?.exercise.id || "" : current.selectedId,
    updatedAt: new Date().toISOString()
  };
}

export function duplicateLocalExercise(store, exerciseId) {
  const current = normalizeLocalExerciseStore(store);
  const source = current.entries.find((entry) => entry.exercise.id === exerciseId);
  if (!source) return current;
  const duplicate = sanitizeWorkshopExercise({
    ...source.exercise,
    id: makeLocalExerciseId(`${source.exercise.title}-copie`),
    title: `${source.exercise.title} — copie`,
    calibration: { ...source.exercise.calibration, reviewStatus: "draft" },
    questions: source.exercise.questions.map((question, index) => ({
      ...question,
      id: `${question.id || `question-${index + 1}`}-copie`
    }))
  });
  return upsertLocalExercise(current, duplicate, "draft");
}

export function parseExerciseImport(text) {
  let parsed;
  try {
    parsed = typeof text === "string" ? JSON.parse(text) : text;
  } catch (error) {
    return { valid: false, exercises: [], errors: [`JSON invalide : ${error.message}`] };
  }

  let candidates;
  if (Array.isArray(parsed)) {
    candidates = parsed;
  } else if (Array.isArray(parsed?.entries)) {
    candidates = parsed.entries.map((item) => item?.exercise || item);
  } else if (Array.isArray(parsed?.exercises)) {
    candidates = parsed.exercises.map((item) => item?.exercise || item);
  } else if (parsed?.exercise) {
    candidates = [parsed.exercise];
  } else {
    candidates = [parsed];
  }

  const exercises = candidates
    .filter((item) => item && typeof item === "object")
    .map(sanitizeWorkshopExercise);
  if (!exercises.length) return { valid: false, exercises: [], errors: ["Aucun exercice valide trouvé dans le fichier."] };
  return { valid: true, exercises, errors: [] };
}

export function importExercisesIntoStore(store, importedExercises = [], { replaceExisting = false } = {}) {
  let next = normalizeLocalExerciseStore(store);
  const messages = [];
  for (const exercise of importedExercises.map(sanitizeWorkshopExercise)) {
    const exists = next.entries.some((entry) => entry.exercise.id === exercise.id);
    if (exists && !replaceExisting) {
      const renamed = { ...exercise, id: makeLocalExerciseId(exercise.title) };
      next = upsertLocalExercise(next, renamed, "draft");
      messages.push(`${exercise.title} importé avec un nouvel identifiant.`);
    } else {
      next = upsertLocalExercise(next, exercise, "draft");
      messages.push(`${exercise.title} importé.`);
    }
  }
  return { store: next, messages };
}

export function buildLocalExerciseExport(store, exerciseIds = null) {
  const normalized = normalizeLocalExerciseStore(store);
  const selected = Array.isArray(exerciseIds)
    ? normalized.entries.filter((entry) => exerciseIds.includes(entry.exercise.id))
    : normalized.entries;
  return {
    exportType: "banque-exercices-locale",
    version: LOCAL_EXERCISE_STORE_VERSION,
    generatedAt: new Date().toISOString(),
    storageScope: "local-browser",
    entries: selected
  };
}

export function buildRuntimeExerciseBank(staticExercises = [], store, { includeDrafts = false } = {}) {
  const normalizedStore = normalizeLocalExerciseStore(store);
  const map = new Map();
  staticExercises.forEach((exercise) => {
    const safe = sanitizeWorkshopExercise(exercise);
    map.set(safe.id, safe);
  });
  normalizedStore.entries
    .filter((entry) => includeDrafts || entry.status === "published")
    .forEach((entry) => map.set(entry.exercise.id, entry.exercise));
  return [...map.values()];
}
