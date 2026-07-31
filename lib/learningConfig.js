import "./exerciseBankRegistration.js";

export const LEVELS = [
  {
    id: "6e",
    label: "6e année",
    shortLabel: "6e",
    description: "Consolider les stratégies de lecture du primaire et se préparer aux évaluations de fin d’année."
  },
  {
    id: "sec1",
    label: "Secondaire 1",
    shortLabel: "Sec. 1",
    description: "Développer l’autonomie devant des textes plus longs et des questions plus complexes."
  },
  {
    id: "sec2",
    label: "Secondaire 2",
    shortLabel: "Sec. 2",
    description: "Approfondir l’interprétation, la justification et la révision des réponses."
  }
];

export const LEARNING_MODES = [
  {
    id: "training",
    label: "Entraînement",
    description: "Étapes guidées, aide vocale, débuts de phrase et indices gradués."
  },
  {
    id: "simulation",
    label: "Simulation",
    description: "Conditions plus proches d’une évaluation : aides retirées et remise finale."
  }
];

export const ADMIN_SETTINGS_KEY = "lecture_admin_settings_v1";

export const DEFAULT_ADMIN_SETTINGS = {
  enabledLevels: LEVELS.map((level) => level.id),
  enabledModes: LEARNING_MODES.map((mode) => mode.id),
  defaultLevel: "6e",
  defaultMode: "training"
};

export function normalizeExerciseLevel(level = "") {
  const normalized = String(level).toLowerCase().replace(/\s+/g, " ").trim();
  if (normalized.includes("secondaire 2") || normalized.includes("sec 2") || normalized.includes("sec. 2")) return "sec2";
  if (normalized.includes("secondaire 1") || normalized.includes("sec 1") || normalized.includes("sec. 1")) return "sec1";
  return "6e";
}

export function sanitizeAdminSettings(value) {
  const candidate = value && typeof value === "object" ? value : {};
  const enabledLevels = LEVELS.map((level) => level.id).filter((id) => candidate.enabledLevels?.includes(id));
  const enabledModes = LEARNING_MODES.map((mode) => mode.id).filter((id) => candidate.enabledModes?.includes(id));
  const safeLevels = enabledLevels.length ? enabledLevels : DEFAULT_ADMIN_SETTINGS.enabledLevels;
  const safeModes = enabledModes.length ? enabledModes : DEFAULT_ADMIN_SETTINGS.enabledModes;

  return {
    enabledLevels: safeLevels,
    enabledModes: safeModes,
    defaultLevel: safeLevels.includes(candidate.defaultLevel) ? candidate.defaultLevel : safeLevels[0],
    defaultMode: safeModes.includes(candidate.defaultMode) ? candidate.defaultMode : safeModes[0]
  };
}
