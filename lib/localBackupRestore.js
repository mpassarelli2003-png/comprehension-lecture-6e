import {
  createEmptyLocalExerciseStore,
  makeLocalExerciseId,
  normalizeLocalExerciseStore,
  sanitizeWorkshopExercise,
  upsertLocalExercise
} from "./localExerciseWorkshop.js";

export const LOCAL_BACKUP_VERSION = "1.0";
export const LOCAL_BACKUP_EXPORT_TYPE = "sauvegarde-banque-exercices-locale";
export const LOCAL_BACKUP_HISTORY_KEY = "lecture_local_exercise_backups_v1";
export const LOCAL_BACKUP_HISTORY_VERSION = "1.0";
export const LOCAL_BACKUP_HISTORY_LIMIT = 12;

const FORBIDDEN_STUDENT_KEYS = new Set([
  "studentAnswer",
  "studentAnswers",
  "studentResponse",
  "studentResponses",
  "answerText",
  "responseText",
  "selectedProof",
  "selectedProofs",
  "proofText",
  "evidenceText",
  "studentProof",
  "studentEvidence",
  "studentWork",
  "savedWork",
  "attempts",
  "feedbackHistory"
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanLabel(value, maximum = 180) {
  return String(value || "").trim().slice(0, maximum);
}

function stripForbiddenStudentData(value) {
  if (Array.isArray(value)) return value.map(stripForbiddenStudentData);
  if (!isPlainObject(value)) return value;
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_STUDENT_KEYS.has(key)) continue;
    result[key] = stripForbiddenStudentData(item);
  }
  return result;
}

function collectForbiddenStudentPaths(value, path = "") {
  const found = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => found.push(...collectForbiddenStudentPaths(item, `${path}[${index}]`)));
    return found;
  }
  if (!isPlainObject(value)) return found;
  for (const [key, item] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_STUDENT_KEYS.has(key)) found.push(nextPath);
    found.push(...collectForbiddenStudentPaths(item, nextPath));
  }
  return found;
}

function sortForCanonicalJson(value) {
  if (Array.isArray(value)) return value.map(sortForCanonicalJson);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortForCanonicalJson(value[key])])
  );
}

export function canonicalBackupJson(value) {
  return JSON.stringify(sortForCanonicalJson(value));
}

export function calculateLocalBackupChecksum(value) {
  const input = typeof value === "string" ? value : canonicalBackupJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function safeBackupEntry(entry = {}) {
  const exercise = stripForbiddenStudentData(sanitizeWorkshopExercise(entry.exercise || entry));
  return {
    exercise,
    sourceStatus: entry.status === "published" ? "published" : "draft",
    createdAt: typeof entry.createdAt === "string" ? entry.createdAt : null,
    updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : null
  };
}

function backupPayloadWithoutIntegrity(backup = {}) {
  const { integrity, ...payload } = backup;
  return payload;
}

export function buildLocalExerciseBackup(store, options = {}) {
  const normalized = normalizeLocalExerciseStore(store);
  const generatedAt = typeof options.generatedAt === "string" && options.generatedAt
    ? options.generatedAt
    : new Date().toISOString();
  const entries = normalized.entries.map(safeBackupEntry);
  const payload = {
    exportType: LOCAL_BACKUP_EXPORT_TYPE,
    version: LOCAL_BACKUP_VERSION,
    generatedAt,
    label: cleanLabel(options.label || `Sauvegarde du ${generatedAt.slice(0, 10)}`),
    storageScope: "local-browser",
    restorationPolicy: "all-exercises-return-as-draft",
    studentDataIncluded: false,
    sourceStoreVersion: normalized.version,
    entryCount: entries.length,
    entries
  };
  return {
    ...payload,
    integrity: {
      algorithm: "fnv1a-32",
      canonicalVersion: "1",
      checksum: calculateLocalBackupChecksum(payload)
    }
  };
}

function parseBackupValue(value) {
  if (typeof value !== "string") return { parsed: value, error: null };
  try {
    return { parsed: JSON.parse(value), error: null };
  } catch (error) {
    return { parsed: null, error: `JSON invalide : ${error.message}` };
  }
}

export function validateLocalExerciseBackup(value) {
  const { parsed, error } = parseBackupValue(value);
  const errors = [];
  const warnings = [];
  if (error) errors.push(error);
  if (!isPlainObject(parsed)) errors.push("La sauvegarde doit être un objet JSON.");

  if (!errors.length) {
    if (parsed.exportType !== LOCAL_BACKUP_EXPORT_TYPE) {
      errors.push(`Type de fichier invalide : ${String(parsed.exportType || "absent")}.`);
    }
    if (parsed.version !== LOCAL_BACKUP_VERSION) {
      errors.push(`Version de sauvegarde non prise en charge : ${String(parsed.version || "absente")}.`);
    }
    if (!Array.isArray(parsed.entries)) errors.push("La liste des exercices est absente.");
    if (!isPlainObject(parsed.integrity)) errors.push("Les données d’intégrité sont absentes.");
  }

  const forbiddenPaths = parsed ? collectForbiddenStudentPaths(parsed) : [];
  if (forbiddenPaths.length) {
    errors.push(`La sauvegarde contient des données d’élève interdites : ${forbiddenPaths.slice(0, 5).join(", ")}.`);
  }

  if (!errors.length) {
    if (parsed.integrity.algorithm !== "fnv1a-32") errors.push("Algorithme d’intégrité non pris en charge.");
    const expectedChecksum = calculateLocalBackupChecksum(backupPayloadWithoutIntegrity(parsed));
    if (parsed.integrity.checksum !== expectedChecksum) {
      errors.push("La somme de contrôle ne correspond pas : le fichier est incomplet ou a été modifié.");
    }

    const ids = [];
    parsed.entries.forEach((entry, index) => {
      if (!isPlainObject(entry) || !isPlainObject(entry.exercise)) {
        errors.push(`Entrée ${index + 1} invalide.`);
        return;
      }
      const id = String(entry.exercise.id || "").trim();
      if (!id) errors.push(`Entrée ${index + 1} : identifiant d’exercice manquant.`);
      ids.push(id);
    });
    const duplicates = ids.filter((id, index) => id && ids.indexOf(id) !== index);
    if (duplicates.length) errors.push(`Identifiants en double dans la sauvegarde : ${[...new Set(duplicates)].join(", ")}.`);
    if (parsed.entryCount !== parsed.entries.length) warnings.push("Le total déclaré ne correspond pas au nombre réel d’entrées.");
  }

  return {
    valid: errors.length === 0,
    backup: errors.length ? null : parsed,
    errors,
    warnings,
    entryCount: Array.isArray(parsed?.entries) ? parsed.entries.length : 0,
    generatedAt: typeof parsed?.generatedAt === "string" ? parsed.generatedAt : null,
    label: cleanLabel(parsed?.label || "Sauvegarde sans titre")
  };
}

function comparableExercise(exercise) {
  return canonicalBackupJson(stripForbiddenStudentData(sanitizeWorkshopExercise(exercise)));
}

export function analyzeLocalBackupConflicts(store, backupValue) {
  const validation = validateLocalExerciseBackup(backupValue);
  if (!validation.valid) {
    return {
      valid: false,
      errors: validation.errors,
      newEntries: [],
      exactDuplicates: [],
      conflicts: []
    };
  }
  const current = normalizeLocalExerciseStore(store);
  const currentById = new Map(current.entries.map((entry) => [entry.exercise.id, entry.exercise]));
  const newEntries = [];
  const exactDuplicates = [];
  const conflicts = [];

  validation.backup.entries.forEach((entry) => {
    const incoming = sanitizeWorkshopExercise(entry.exercise);
    const existing = currentById.get(incoming.id);
    if (!existing) {
      newEntries.push({ id: incoming.id, title: incoming.title });
    } else if (comparableExercise(existing) === comparableExercise(incoming)) {
      exactDuplicates.push({ id: incoming.id, title: incoming.title });
    } else {
      conflicts.push({ id: incoming.id, title: incoming.title });
    }
  });

  return {
    valid: true,
    errors: [],
    newEntries,
    exactDuplicates,
    conflicts
  };
}

function uniqueTransferId(exercise, usedIds, index = 0) {
  let candidate = `${exercise.id}-transfert`;
  let counter = index + 1;
  while (usedIds.has(candidate)) {
    candidate = `${exercise.id}-transfert-${counter}`;
    counter += 1;
  }
  return candidate || makeLocalExerciseId(exercise.title);
}

export function restoreLocalExerciseBackup(store, backupValue, options = {}) {
  const validation = validateLocalExerciseBackup(backupValue);
  if (!validation.valid) {
    return {
      valid: false,
      store: normalizeLocalExerciseStore(store),
      errors: validation.errors,
      warnings: validation.warnings,
      summary: null
    };
  }

  const mode = options.mode === "replace" ? "replace" : "merge";
  const conflictPolicy = ["rename", "replace", "skip"].includes(options.conflictPolicy)
    ? options.conflictPolicy
    : "rename";
  const now = new Date().toISOString();
  const imported = validation.backup.entries.map((entry) => sanitizeWorkshopExercise(entry.exercise));
  let next = mode === "replace" ? createEmptyLocalExerciseStore() : normalizeLocalExerciseStore(store);
  const usedIds = new Set(next.entries.map((entry) => entry.exercise.id));
  const summary = {
    mode,
    conflictPolicy,
    imported: 0,
    renamed: 0,
    replaced: 0,
    skippedDuplicates: 0,
    skippedConflicts: 0,
    restoredAsDraft: 0
  };

  imported.forEach((exercise, index) => {
    const existing = next.entries.find((entry) => entry.exercise.id === exercise.id);
    if (!existing) {
      next = upsertLocalExercise(next, exercise, "draft");
      usedIds.add(exercise.id);
      summary.imported += 1;
      summary.restoredAsDraft += 1;
      return;
    }

    if (comparableExercise(existing.exercise) === comparableExercise(exercise)) {
      summary.skippedDuplicates += 1;
      return;
    }

    if (conflictPolicy === "skip") {
      summary.skippedConflicts += 1;
      return;
    }

    if (conflictPolicy === "replace") {
      next = upsertLocalExercise(next, exercise, "draft");
      summary.replaced += 1;
      summary.restoredAsDraft += 1;
      return;
    }

    const renamedId = uniqueTransferId(exercise, usedIds, index);
    const renamed = sanitizeWorkshopExercise({ ...exercise, id: renamedId });
    next = upsertLocalExercise(next, renamed, "draft");
    usedIds.add(renamedId);
    summary.renamed += 1;
    summary.restoredAsDraft += 1;
  });

  return {
    valid: true,
    store: {
      ...normalizeLocalExerciseStore(next),
      updatedAt: now
    },
    errors: [],
    warnings: validation.warnings,
    summary
  };
}

export function createEmptyLocalBackupHistory() {
  return {
    version: LOCAL_BACKUP_HISTORY_VERSION,
    snapshots: [],
    updatedAt: null
  };
}

export function normalizeLocalBackupHistory(value) {
  const source = isPlainObject(value) ? value : {};
  const snapshots = Array.isArray(source.snapshots)
    ? source.snapshots.filter((snapshot) => isPlainObject(snapshot)).slice(0, LOCAL_BACKUP_HISTORY_LIMIT)
    : [];
  return {
    version: LOCAL_BACKUP_HISTORY_VERSION,
    snapshots,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null
  };
}

export function addLocalBackupSnapshot(history, backup) {
  const current = normalizeLocalBackupHistory(history);
  const validation = validateLocalExerciseBackup(backup);
  if (!validation.valid) return current;
  const checksum = backup.integrity.checksum;
  const snapshots = [
    backup,
    ...current.snapshots.filter((snapshot) => snapshot?.integrity?.checksum !== checksum)
  ].slice(0, LOCAL_BACKUP_HISTORY_LIMIT);
  return {
    version: LOCAL_BACKUP_HISTORY_VERSION,
    snapshots,
    updatedAt: new Date().toISOString()
  };
}

export function removeLocalBackupSnapshot(history, checksum) {
  const current = normalizeLocalBackupHistory(history);
  return {
    ...current,
    snapshots: current.snapshots.filter((snapshot) => snapshot?.integrity?.checksum !== checksum),
    updatedAt: new Date().toISOString()
  };
}

export function localBackupFilename(backup = {}) {
  const date = String(backup.generatedAt || new Date().toISOString()).slice(0, 10);
  const checksum = String(backup.integrity?.checksum || "sans-controle").slice(0, 8);
  return `sauvegarde-exercices-${date}-${checksum}.json`;
}

export function backupContainsStudentData(value) {
  return collectForbiddenStudentPaths(value).length > 0;
}
