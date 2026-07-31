import { CONTENT_LEVEL_PROFILES, auditExerciseContent, countContentWords } from "./contentCalibration.js";
import { MANUAL_AUDIT_STATUSES, criterionCounts, createEmptyManualAudit, sanitizeManualAuditEntry } from "./manualPedagogicalAudit.js";
import { QUESTION_DIMENSIONS, normalizeQuestionLevel, validateQuestionSchema } from "./questionClassification.js";
import { sanitizeWorkshopExercise } from "./localExerciseWorkshop.js";

export const PUBLICATION_READINESS_VERSION = "1.0";
export const PUBLICATION_REVIEW_CONFIRMATION = "Je confirme que cet exercice a été relu.";

const VALID_DIMENSIONS = new Set(Object.keys(QUESTION_DIMENSIONS));
const CRITICAL_FIELDS = [
  ["id", "Identifiant"],
  ["title", "Titre"],
  ["level", "Niveau"],
  ["textType", "Type de texte"],
  ["category", "Catégorie"],
  ["intention", "Intention de lecture"],
  ["text", "Texte complet"]
];

function text(value) {
  return String(value || "").trim();
}

function addUnique(target, message) {
  if (message && !target.includes(message)) target.push(message);
}

export function minimumPublishableWords(level = "6e") {
  const levelId = normalizeQuestionLevel(level);
  const targetMinimum = CONTENT_LEVEL_PROFILES[levelId]?.wordRange?.[0] || 350;
  return Math.max(120, Math.round(targetMinimum * 0.5));
}

export function normalizePublicationManualAudit(value, exercise = {}) {
  return sanitizeManualAuditEntry(value || createEmptyManualAudit(exercise), exercise);
}

export function buildPublicationReadiness(exerciseInput = {}, manualAuditInput = null, options = {}) {
  const raw = exerciseInput && typeof exerciseInput === "object" ? exerciseInput : {};
  const rawQuestions = Array.isArray(raw.questions) ? raw.questions : [];
  const exercise = sanitizeWorkshopExercise(raw);
  const manualAudit = normalizePublicationManualAudit(manualAuditInput, exercise);
  const manualCounts = criterionCounts(manualAudit);
  const automaticAudit = auditExerciseContent(exercise);
  const levelId = normalizeQuestionLevel(raw.level || exercise.level);
  const profile = CONTENT_LEVEL_PROFILES[levelId];
  const hardMinimumWords = minimumPublishableWords(levelId);
  const wordCount = countContentWords(raw.text);
  const blockers = [];
  const warnings = [];

  for (const [field, label] of CRITICAL_FIELDS) {
    if (!text(raw[field])) addUnique(blockers, `${label} manquant.`);
  }

  if (!text(raw.text)) {
    addUnique(blockers, "Le texte est vide.");
  } else if (wordCount < hardMinimumWords) {
    addUnique(blockers, `Le texte est trop court pour être publié : ${wordCount} mots; minimum de publication ${hardMinimumWords}.`);
  } else if (profile && wordCount < profile.wordRange[0]) {
    addUnique(warnings, `Le texte reste sous la cible de ${profile.label} : ${wordCount} mots; cible ${profile.wordRange[0]} mots.`);
  }

  if (!rawQuestions.length) addUnique(blockers, "Aucune question n’est présente.");

  rawQuestions.forEach((question, index) => {
    const number = index + 1;
    if (!text(question?.id)) addUnique(blockers, `Question ${number} : identifiant manquant.`);
    if (!text(question?.prompt || question?.text)) addUnique(blockers, `Question ${number} : formulation manquante.`);
    if (!VALID_DIMENSIONS.has(question?.dimension)) addUnique(blockers, `Question ${number} : dimension absente ou invalide.`);
    const validation = validateQuestionSchema({ ...question, targetLevel: levelId });
    validation.errors.forEach((error) => addUnique(blockers, `Question ${number} : ${error}.`));
  });

  automaticAudit.errors.forEach((error) => addUnique(blockers, `Audit automatique : ${error}`));

  const proofRequiredCount = exercise.questions.filter((question) => question.proofRequired).length;
  const proofAvailability = manualAudit.criteria?.questions?.proofAvailable || "pending";
  if (proofRequiredCount > 0 && proofAvailability === "review") {
    addUnique(blockers, "Une preuve obligatoire est indiquée comme impossible ou non disponible dans l’audit manuel.");
  }

  if (manualAudit.status === "blocked") {
    addUnique(blockers, "L’audit pédagogique manuel indique Bloqué.");
  }

  if (manualAudit.status === "pending" || manualAudit.status === "review" || manualCounts.pending > 0) {
    addUnique(warnings, `L’audit pédagogique manuel n’est pas terminé : ${manualCounts.pending} critère(s) non évalué(s), statut ${MANUAL_AUDIT_STATUSES[manualAudit.status]}.`);
  }
  if (manualCounts.review > 0) {
    addUnique(warnings, `L’audit pédagogique manuel contient ${manualCounts.review} critère(s) À revoir.`);
  }
  if (manualAudit.status === "ready" && (manualCounts.pending > 0 || manualCounts.review > 0)) {
    addUnique(warnings, "Le statut manuel Prêt n’est pas entièrement cohérent avec les critères détaillés.");
  }

  const questionCount = exercise.questions.length;
  const explicitCount = exercise.questions.filter((question) => question.questionType === "explicite" || question.dimension === "comprendre").length;
  const inferenceCount = exercise.questions.filter((question) => question.dimension === "inferer" || question.dimension === "interpreter").length;
  const explicitRatio = questionCount ? explicitCount / questionCount : 0;
  const maximumExplicitRatio = profile?.maximumComprehensionRatio ?? 0.7;

  if (questionCount && explicitRatio > maximumExplicitRatio) {
    addUnique(warnings, `Trop de questions explicites : ${Math.round(explicitRatio * 100)} %; cible maximale ${Math.round(maximumExplicitRatio * 100)} % pour ${profile?.label || levelId}.`);
  }
  if (questionCount && inferenceCount === 0) {
    addUnique(warnings, "Aucune question d’inférence ou d’interprétation n’est présente.");
  }

  const finalPreviewReviewed = Boolean(options.finalPreviewReviewed);
  const reviewerConfirmed = Boolean(options.reviewerConfirmed);
  if (!finalPreviewReviewed) addUnique(blockers, "L’aperçu final doit être ouvert et marqué comme vérifié.");
  if (!reviewerConfirmed) addUnique(blockers, `La confirmation « ${PUBLICATION_REVIEW_CONFIRMATION} » est obligatoire.`);

  const checklist = [
    {
      id: "critical-fields",
      label: "Aucun champ critique n’est vide",
      state: CRITICAL_FIELDS.every(([field]) => text(raw[field])) ? "pass" : "blocked"
    },
    {
      id: "text-length",
      label: `Texte complet d’au moins ${hardMinimumWords} mots`,
      state: text(raw.text) && wordCount >= hardMinimumWords ? "pass" : "blocked"
    },
    {
      id: "questions-valid",
      label: "Au moins une question, avec formulation et dimension valides",
      state: rawQuestions.length > 0 && rawQuestions.every((question) => text(question?.prompt || question?.text) && VALID_DIMENSIONS.has(question?.dimension)) ? "pass" : "blocked"
    },
    {
      id: "proof-available",
      label: "Les preuves obligatoires sont réellement disponibles dans le texte",
      state: proofRequiredCount === 0 || proofAvailability === "pass" ? "pass" : proofAvailability === "review" ? "blocked" : "warning"
    },
    {
      id: "dimensions-balanced",
      label: "Les dimensions sont suffisamment équilibrées",
      state: questionCount > 0 && explicitRatio <= maximumExplicitRatio && inferenceCount > 0 ? "pass" : "warning"
    },
    {
      id: "manual-audit",
      label: "L’audit pédagogique manuel est cohérent",
      state: manualAudit.status === "blocked" ? "blocked" : manualAudit.status === "ready" && manualCounts.pending === 0 && manualCounts.review === 0 ? "pass" : "warning"
    },
    {
      id: "final-preview",
      label: "L’aperçu final a été vérifié",
      state: finalPreviewReviewed ? "pass" : "blocked"
    },
    {
      id: "review-confirmation",
      label: PUBLICATION_REVIEW_CONFIRMATION,
      state: reviewerConfirmed ? "pass" : "blocked"
    }
  ];

  return {
    version: PUBLICATION_READINESS_VERSION,
    exercise,
    automaticAudit,
    manualAudit,
    manualCounts,
    wordCount,
    hardMinimumWords,
    proofRequiredCount,
    explicitCount,
    inferenceCount,
    explicitRatio: Math.round(explicitRatio * 100),
    blockers,
    warnings,
    checklist,
    canPublish: blockers.length === 0
  };
}

export function buildPublicationReviewRecord(readiness, options = {}) {
  if (!readiness?.canPublish) return null;
  return {
    version: PUBLICATION_READINESS_VERSION,
    reviewedAt: new Date().toISOString(),
    confirmationText: PUBLICATION_REVIEW_CONFIRMATION,
    finalPreviewReviewed: Boolean(options.finalPreviewReviewed),
    reviewerConfirmed: Boolean(options.reviewerConfirmed),
    warningCount: readiness.warnings.length,
    warnings: readiness.warnings.slice(0, 20),
    manualAuditStatus: readiness.manualAudit?.status || "pending",
    manualAuditUpdatedAt: readiness.manualAudit?.updatedAt || null,
    wordCount: readiness.wordCount,
    questionCount: readiness.exercise?.questions?.length || 0
  };
}
