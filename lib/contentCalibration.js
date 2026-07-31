import {
  QUESTION_DIMENSIONS,
  normalizeExerciseQuestions,
  normalizeQuestionLevel
} from "./questionClassification.js";

export const CONTENT_CALIBRATION_VERSION = "1.0";

export const CONTENT_LEVEL_PROFILES = {
  "6e": {
    label: "6e année",
    wordRange: [350, 1400],
    questionRange: [6, 14],
    maximumComprehensionRatio: 0.7,
    minimumInferenceInterpretationRatio: 0.15,
    minimumReactionAppreciationRatio: 0.12,
    expectedFeatures: ["repérage fréquent", "inférences guidées", "réponses courtes appuyées sur le texte"]
  },
  sec1: {
    label: "Secondaire 1",
    wordRange: [550, 1050],
    questionRange: [7, 12],
    maximumComprehensionRatio: 0.55,
    minimumInferenceInterpretationRatio: 0.25,
    minimumReactionAppreciationRatio: 0.15,
    expectedFeatures: ["texte plus long", "inférences fréquentes", "justification développée", "organisation du texte"]
  },
  sec2: {
    label: "Secondaire 2",
    wordRange: [650, 1200],
    questionRange: [8, 14],
    maximumComprehensionRatio: 0.45,
    minimumInferenceInterpretationRatio: 0.3,
    minimumReactionAppreciationRatio: 0.22,
    expectedFeatures: ["thèse ou message nuancé", "interprétation", "critère d’appréciation", "jugement critique"]
  }
};

export const CONTENT_TEXT_TYPES = {
  narratif: "Narratif",
  informatif: "Informatif",
  explicatif: "Explicatif",
  opinion: "Opinion / argumentatif",
  lettre: "Lettre",
  autre: "Autre"
};

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countContentWords(value = "") {
  const text = normalize(value);
  return text ? text.split(" ").filter(Boolean).length : 0;
}

export function countContentParagraphs(value = "") {
  return String(value || "").split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean).length;
}

export function canonicalTextType(exercise = {}) {
  const value = normalize(`${exercise.textType || ""} ${exercise.category || ""}`);
  if (/lettre/.test(value)) return "lettre";
  if (/opinion|argument/.test(value)) return "opinion";
  if (/narratif|litteraire|recit|conte/.test(value)) return "narratif";
  if (/explicatif/.test(value)) return "explicatif";
  if (/informatif|documentaire/.test(value)) return "informatif";
  return "autre";
}

function ratio(value, total) {
  return total ? value / total : 0;
}

function percentage(value) {
  return Math.round(value * 100);
}

function countDimensions(questions = []) {
  return Object.fromEntries(Object.keys(QUESTION_DIMENSIONS).map((dimension) => [
    dimension,
    questions.filter((question) => question.dimension === dimension).length
  ]));
}

function duplicateValues(values = []) {
  const seen = new Set();
  const duplicates = new Set();
  values.filter(Boolean).forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates];
}

export function auditExerciseContent(exerciseInput = {}) {
  const exercise = normalizeExerciseQuestions(exerciseInput);
  const levelId = normalizeQuestionLevel(exercise.level || exercise.targetLevel || "6e");
  const profile = CONTENT_LEVEL_PROFILES[levelId];
  const textType = canonicalTextType(exercise);
  const questions = exercise.questions || [];
  const dimensions = countDimensions(questions);
  const wordCount = countContentWords(exercise.text);
  const paragraphCount = countContentParagraphs(exercise.text);
  const questionCount = questions.length;
  const comprehensionRatio = ratio(dimensions.comprendre, questionCount);
  const inferenceInterpretationRatio = ratio(dimensions.inferer + dimensions.interpreter, questionCount);
  const reactionAppreciationRatio = ratio(dimensions.reagir + dimensions.apprecier, questionCount);
  const errors = [];
  const warnings = [];

  if (!String(exercise.id || "").trim()) errors.push("Identifiant du texte manquant.");
  if (!String(exercise.title || "").trim()) errors.push("Titre manquant.");
  if (!String(exercise.intention || "").trim()) errors.push("Intention de lecture manquante.");
  if (!String(exercise.text || "").trim()) errors.push("Texte manquant.");
  if (!questionCount) errors.push("Aucune question n’est associée au texte.");
  if (textType === "autre") warnings.push("Type de texte non normalisé.");

  const duplicateQuestionIds = duplicateValues(questions.map((question) => question.id));
  if (duplicateQuestionIds.length) errors.push(`Identifiants de questions en double : ${duplicateQuestionIds.join(", ")}.`);

  if (wordCount < profile.wordRange[0]) warnings.push(`Texte court pour ${profile.label} : ${wordCount} mots; cible minimale ${profile.wordRange[0]}.`);
  if (wordCount > profile.wordRange[1]) warnings.push(`Texte long pour ${profile.label} : ${wordCount} mots; cible maximale ${profile.wordRange[1]}.`);
  if (questionCount < profile.questionRange[0]) warnings.push(`Peu de questions : ${questionCount}; cible minimale ${profile.questionRange[0]}.`);
  if (questionCount > profile.questionRange[1]) warnings.push(`Beaucoup de questions : ${questionCount}; cible maximale ${profile.questionRange[1]}.`);
  if (comprehensionRatio > profile.maximumComprehensionRatio) warnings.push(`Questions de compréhension trop dominantes : ${percentage(comprehensionRatio)} %.`);
  if (inferenceInterpretationRatio < profile.minimumInferenceInterpretationRatio) warnings.push(`Inférence et interprétation insuffisantes : ${percentage(inferenceInterpretationRatio)} %.`);
  if (reactionAppreciationRatio < profile.minimumReactionAppreciationRatio) warnings.push(`Réaction et appréciation insuffisantes : ${percentage(reactionAppreciationRatio)} %.`);
  if (levelId !== "6e" && exercise.calibration?.reviewStatus !== "approved") warnings.push("Le calibrage secondaire n’est pas marqué comme approuvé.");

  return {
    calibrationVersion: CONTENT_CALIBRATION_VERSION,
    id: exercise.id,
    title: exercise.title,
    levelId,
    levelLabel: profile.label,
    textType,
    textTypeLabel: CONTENT_TEXT_TYPES[textType],
    intention: exercise.intention,
    wordCount,
    paragraphCount,
    questionCount,
    dimensions,
    ratios: {
      comprehension: percentage(comprehensionRatio),
      inferenceInterpretation: percentage(inferenceInterpretationRatio),
      reactionAppreciation: percentage(reactionAppreciationRatio)
    },
    calibration: exercise.calibration || null,
    errors,
    warnings,
    status: errors.length ? "blocked" : warnings.length ? "review" : "ready"
  };
}

function countBy(items, field, values) {
  return Object.fromEntries(values.map((value) => [value, items.filter((item) => item[field] === value).length]));
}

export function summarizeContentBank(exercises = []) {
  const audits = exercises.map(auditExerciseContent);
  const duplicateExerciseIds = duplicateValues(audits.map((audit) => audit.id));
  const byLevel = countBy(audits, "levelId", Object.keys(CONTENT_LEVEL_PROFILES));
  const byTextType = countBy(audits, "textType", Object.keys(CONTENT_TEXT_TYPES));
  const byLevelAndType = Object.fromEntries(Object.keys(CONTENT_LEVEL_PROFILES).map((levelId) => [
    levelId,
    countBy(audits.filter((audit) => audit.levelId === levelId), "textType", Object.keys(CONTENT_TEXT_TYPES))
  ]));
  const dimensionTotals = Object.fromEntries(Object.keys(QUESTION_DIMENSIONS).map((dimension) => [
    dimension,
    audits.reduce((total, audit) => total + audit.dimensions[dimension], 0)
  ]));
  const warnings = audits.flatMap((audit) => audit.warnings.map((message) => ({ exerciseId: audit.id, title: audit.title, message })));
  const errors = audits.flatMap((audit) => audit.errors.map((message) => ({ exerciseId: audit.id, title: audit.title, message })));
  if (duplicateExerciseIds.length) errors.push({ exerciseId: "bank", title: "Banque", message: `Identifiants de textes en double : ${duplicateExerciseIds.join(", ")}.` });

  const levelGaps = Object.keys(CONTENT_LEVEL_PROFILES)
    .filter((levelId) => byLevel[levelId] < 2)
    .map((levelId) => `${CONTENT_LEVEL_PROFILES[levelId].label} contient moins de deux textes.`);
  const secondaryTypeGaps = ["sec1", "sec2"].flatMap((levelId) => {
    const represented = Object.entries(byLevelAndType[levelId]).filter(([type, count]) => type !== "autre" && count > 0).length;
    return represented < 2 ? [`${CONTENT_LEVEL_PROFILES[levelId].label} contient moins de deux types de texte.`] : [];
  });

  return {
    version: CONTENT_CALIBRATION_VERSION,
    totalTexts: audits.length,
    totalQuestions: audits.reduce((total, audit) => total + audit.questionCount, 0),
    totalWords: audits.reduce((total, audit) => total + audit.wordCount, 0),
    readyTexts: audits.filter((audit) => audit.status === "ready").length,
    textsToReview: audits.filter((audit) => audit.status === "review").length,
    blockedTexts: audits.filter((audit) => audit.status === "blocked").length,
    byLevel,
    byTextType,
    byLevelAndType,
    dimensionTotals,
    audits,
    errors,
    warnings,
    coverageGaps: [...levelGaps, ...secondaryTypeGaps],
    balancedSecondaryBank: levelGaps.length === 0 && secondaryTypeGaps.length === 0
  };
}

export function validateContentBank(exercises = []) {
  const summary = summarizeContentBank(exercises);
  const valid = summary.errors.length === 0 && summary.coverageGaps.length === 0;
  return {
    valid,
    summary,
    message: valid
      ? `${summary.totalTexts} textes et ${summary.totalQuestions} questions : les trois niveaux sont couverts sans erreur bloquante.`
      : `${summary.errors.length} erreur(s) bloquante(s) et ${summary.coverageGaps.length} lacune(s) de couverture.`
  };
}
