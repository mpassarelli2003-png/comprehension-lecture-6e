export const MANUAL_PEDAGOGICAL_AUDIT_VERSION = "1.0";
export const MANUAL_PEDAGOGICAL_AUDIT_KEY = "lecture_manual_pedagogical_audit_v1";

export const MANUAL_AUDIT_STATUSES = {
  pending: "À valider",
  ready: "Prêt",
  review: "À revoir",
  blocked: "Bloqué"
};

export const MANUAL_CRITERION_VALUES = {
  pending: "Non évalué",
  pass: "Conforme",
  review: "À revoir"
};

export const MANUAL_AUDIT_CRITERIA = {
  text: {
    label: "Texte",
    items: {
      levelAppropriate: "Niveau réellement approprié",
      lengthAcceptable: "Longueur acceptable",
      vocabularyAdapted: "Vocabulaire adapté",
      themeRelevant: "Thème pertinent pour les 11 à 14 ans",
      culturalSensitivity: "Sensibilité culturelle",
      noStereotypes: "Absence de stéréotypes",
      apparentFactualAccuracy: "Exactitude factuelle apparente",
      clearIdeaProgression: "Progression claire des idées"
    }
  },
  questions: {
    label: "Questions",
    items: {
      clearWording: "Formulation claire",
      unambiguousInstruction: "Consigne non ambiguë",
      correctDimension: "Bonne dimension de lecture",
      proofAvailable: "Preuve réellement disponible dans le texte",
      reasonableInference: "Inférence raisonnable",
      reactionAppreciationSupportable: "Réaction ou appréciation appuyable par le texte",
      realisticExpectedElements: "Nombre d’éléments attendu réaliste"
    }
  },
  simulation: {
    label: "Simulation",
    items: {
      realisticWithoutHelp: "Difficulté réaliste sans aide",
      noContentHelp: "Aucune aide de contenu",
      understandableRequirements: "Exigences compréhensibles",
      coherentFinalSubmission: "Remise finale cohérente"
    }
  }
};

const STATUS_IDS = new Set(Object.keys(MANUAL_AUDIT_STATUSES));
const CRITERION_VALUE_IDS = new Set(Object.keys(MANUAL_CRITERION_VALUES));

function cleanText(value, maximum = 4000) {
  return String(value || "").trim().slice(0, maximum);
}

function normalizeStatus(value) {
  return STATUS_IDS.has(value) ? value : "pending";
}

function normalizeCriterionValue(value) {
  return CRITERION_VALUE_IDS.has(value) ? value : "pending";
}

export function emptyManualCriteria() {
  return Object.fromEntries(
    Object.entries(MANUAL_AUDIT_CRITERIA).map(([groupId, group]) => [
      groupId,
      Object.fromEntries(Object.keys(group.items).map((criterionId) => [criterionId, "pending"]))
    ])
  );
}

export function createEmptyManualAudit(exercise = {}) {
  return {
    exerciseId: String(exercise.id || ""),
    exerciseTitle: String(exercise.title || ""),
    level: String(exercise.level || ""),
    textType: String(exercise.textType || ""),
    status: "pending",
    reviewer: "",
    notes: "",
    criteria: emptyManualCriteria(),
    updatedAt: null
  };
}

export function sanitizeManualAuditEntry(value = {}, exercise = {}) {
  const base = createEmptyManualAudit(exercise);
  const source = value && typeof value === "object" ? value : {};
  const criteria = emptyManualCriteria();

  for (const [groupId, group] of Object.entries(MANUAL_AUDIT_CRITERIA)) {
    for (const criterionId of Object.keys(group.items)) {
      criteria[groupId][criterionId] = normalizeCriterionValue(source.criteria?.[groupId]?.[criterionId]);
    }
  }

  return {
    ...base,
    status: normalizeStatus(source.status),
    reviewer: cleanText(source.reviewer, 120),
    notes: cleanText(source.notes),
    criteria,
    updatedAt: typeof source.updatedAt === "string" && source.updatedAt ? source.updatedAt : null
  };
}

export function normalizeManualAuditStore(value, exercises = []) {
  const source = value && typeof value === "object" ? value : {};
  const oldAudits = source.audits && typeof source.audits === "object" ? source.audits : {};
  return {
    version: MANUAL_PEDAGOGICAL_AUDIT_VERSION,
    audits: Object.fromEntries(exercises.map((exercise) => [
      exercise.id,
      sanitizeManualAuditEntry(oldAudits[exercise.id], exercise)
    ]))
  };
}

export function criterionCounts(entry = {}) {
  const counts = { total: 0, pending: 0, pass: 0, review: 0 };
  for (const group of Object.values(MANUAL_AUDIT_CRITERIA)) {
    for (const criterionId of Object.keys(group.items)) {
      const value = normalizeCriterionValue(entry.criteria?.[Object.keys(MANUAL_AUDIT_CRITERIA).find((id) => MANUAL_AUDIT_CRITERIA[id] === group)]?.[criterionId]);
      counts.total += 1;
      counts[value] += 1;
    }
  }
  return counts;
}

export function summarizeManualAudits(store = {}, exercises = []) {
  const normalized = normalizeManualAuditStore(store, exercises);
  const statuses = Object.fromEntries(Object.keys(MANUAL_AUDIT_STATUSES).map((id) => [id, 0]));
  let evaluatedCriteria = 0;
  let totalCriteria = 0;

  for (const entry of Object.values(normalized.audits)) {
    statuses[entry.status] += 1;
    const counts = criterionCounts(entry);
    evaluatedCriteria += counts.pass + counts.review;
    totalCriteria += counts.total;
  }

  return {
    totalExercises: exercises.length,
    statuses,
    evaluatedCriteria,
    totalCriteria,
    completionRate: totalCriteria ? Math.round((evaluatedCriteria / totalCriteria) * 100) : 0
  };
}

export function manualAuditWarnings(entry = {}) {
  const counts = criterionCounts(entry);
  const warnings = [];
  if (entry.status === "ready" && counts.pending > 0) warnings.push("Le statut Prêt contient encore des critères non évalués.");
  if (entry.status === "ready" && counts.review > 0) warnings.push("Le statut Prêt contient des critères marqués À revoir.");
  if (entry.status === "blocked" && !String(entry.notes || "").trim()) warnings.push("Ajoute une note expliquant le blocage.");
  return warnings;
}

export function buildManualAuditExport(store = {}, exercises = [], automaticAudits = {}) {
  const normalized = normalizeManualAuditStore(store, exercises);
  return {
    exportType: "audit-pedagogique-manuel",
    version: MANUAL_PEDAGOGICAL_AUDIT_VERSION,
    generatedAt: new Date().toISOString(),
    storageScope: "local-browser",
    automaticAuditPreserved: true,
    statusLabels: MANUAL_AUDIT_STATUSES,
    criterionValueLabels: MANUAL_CRITERION_VALUES,
    criteriaDefinition: MANUAL_AUDIT_CRITERIA,
    exercises: exercises.map((exercise) => ({
      exerciseId: exercise.id,
      title: exercise.title,
      level: exercise.level,
      textType: exercise.textType,
      category: exercise.category || "",
      intention: exercise.intention || "",
      automaticAudit: automaticAudits[exercise.id] || null,
      manualAudit: normalized.audits[exercise.id]
    }))
  };
}
