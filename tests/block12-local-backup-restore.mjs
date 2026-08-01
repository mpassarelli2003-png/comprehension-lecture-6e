import assert from "node:assert/strict";
import {
  LOCAL_BACKUP_EXPORT_TYPE,
  LOCAL_BACKUP_HISTORY_LIMIT,
  addLocalBackupSnapshot,
  analyzeLocalBackupConflicts,
  backupContainsStudentData,
  buildLocalExerciseBackup,
  calculateLocalBackupChecksum,
  canonicalBackupJson,
  createEmptyLocalBackupHistory,
  localBackupFilename,
  removeLocalBackupSnapshot,
  restoreLocalExerciseBackup,
  validateLocalExerciseBackup
} from "../lib/localBackupRestore.js";
import {
  createEmptyLocalExerciseStore,
  upsertLocalExercise
} from "../lib/localExerciseWorkshop.js";

let checks = 0;
function ok(value, message) { checks += 1; assert.ok(value, message); }
function equal(actual, expected, message) { checks += 1; assert.equal(actual, expected, message); }
function deepEqual(actual, expected, message) { checks += 1; assert.deepEqual(actual, expected, message); }

function exercise(id, title, textSuffix = "") {
  return {
    id,
    title,
    level: "6e année",
    textType: "informatif",
    category: "texte documentaire",
    intention: "Comprendre un projet et justifier ses réponses.",
    description: "Exercice local de test.",
    difficulty: "6e année",
    text: `Un groupe prépare un jardin communautaire. Les élèves observent les changements, organisent le matériel et expliquent les effets du projet sur le quartier. ${textSuffix}`,
    vocabulary: [],
    calibration: {
      version: "local-1.0",
      targetLevel: "6e",
      reviewStatus: "draft",
      intendedReadingMinutes: 5,
      difficultyFeatures: []
    },
    questions: [{
      id: `${id}-q1`,
      prompt: "Quel changement est décrit dans le texte?",
      dimension: "comprendre",
      questionType: "explicite",
      proofRequired: true,
      justificationRequired: false,
      minimumExpectedElements: 1,
      points: 1,
      expectedAnswer: "Le jardin transforme progressivement le quartier.",
      acceptableAnswers: [],
      isPersonalAnswer: false,
      recommendedProofTool: "explicite"
    }]
  };
}

function recalculateIntegrity(backup) {
  const { integrity, ...payload } = backup;
  return {
    ...backup,
    integrity: {
      ...integrity,
      checksum: calculateLocalBackupChecksum(payload)
    }
  };
}

let sourceStore = createEmptyLocalExerciseStore();
const first = exercise("local-a", "Le jardin A");
first.studentAnswer = "Cette donnée ne doit jamais sortir.";
first.questions[0].selectedProof = "Ancienne preuve d’élève.";
const second = exercise("local-b", "Le jardin B");
sourceStore = upsertLocalExercise(sourceStore, first, "published");
sourceStore = upsertLocalExercise(sourceStore, second, "draft");

const backup = buildLocalExerciseBackup(sourceStore, {
  label: "Sauvegarde de référence",
  generatedAt: "2026-08-01T12:00:00.000Z"
});

equal(backup.exportType, LOCAL_BACKUP_EXPORT_TYPE, "le format de sauvegarde est explicite");
equal(backup.version, "1.0", "la sauvegarde est versionnée");
equal(backup.entryCount, 2, "toute la banque locale est exportée");
equal(backup.entries[0].sourceStatus, "published", "le statut source est documenté");
equal(backup.restorationPolicy, "all-exercises-return-as-draft", "la politique de restauration est explicite");
equal(backup.studentDataIncluded, false, "l’absence de données d’élève est déclarée");
ok(!backupContainsStudentData(backup), "aucune donnée d’élève interdite n’est incluse");
const serialized = JSON.stringify(backup);
ok(!serialized.includes("Cette donnée ne doit jamais sortir"), "la réponse d’élève injectée est retirée");
ok(!serialized.includes("Ancienne preuve d’élève"), "la preuve d’élève injectée est retirée");
ok(serialized.includes("expectedAnswer"), "la réponse attendue administrateur demeure permise");

const { integrity, ...payload } = backup;
equal(integrity.checksum, calculateLocalBackupChecksum(payload), "la somme de contrôle correspond au contenu canonique");
equal(canonicalBackupJson({ b: 2, a: 1 }), canonicalBackupJson({ a: 1, b: 2 }), "l’ordre des propriétés ne change pas la forme canonique");

const valid = validateLocalExerciseBackup(backup);
ok(valid.valid, "une sauvegarde intacte est acceptée");
equal(valid.entryCount, 2, "le nombre d’entrées inspecté est exact");
equal(valid.label, "Sauvegarde de référence", "le libellé est conservé");

const tampered = structuredClone(backup);
tampered.entries[0].exercise.title = "Titre modifié après export";
const tamperedValidation = validateLocalExerciseBackup(tampered);
ok(!tamperedValidation.valid, "un fichier modifié après export est refusé");
ok(tamperedValidation.errors.some((item) => item.includes("somme de contrôle")), "l’erreur d’intégrité est explicite");

const oldExport = {
  exportType: "banque-exercices-locale",
  version: "1.0",
  entries: backup.entries
};
ok(!validateLocalExerciseBackup(oldExport).valid, "un ancien export sans contrôle d’intégrité n’est pas restauré comme sauvegarde bloc 12");

let duplicateBackup = structuredClone(backup);
duplicateBackup.entries.push(structuredClone(duplicateBackup.entries[0]));
duplicateBackup.entryCount = duplicateBackup.entries.length;
duplicateBackup = recalculateIntegrity(duplicateBackup);
const duplicateValidation = validateLocalExerciseBackup(duplicateBackup);
ok(!duplicateValidation.valid, "des identifiants en double à l’intérieur du fichier sont refusés");
ok(duplicateValidation.errors.some((item) => item.includes("Identifiants en double")), "les doublons internes sont nommés");

let forbiddenBackup = structuredClone(backup);
forbiddenBackup.entries[0].exercise.questions[0].studentResponse = "Donnée interdite";
forbiddenBackup = recalculateIntegrity(forbiddenBackup);
const forbiddenValidation = validateLocalExerciseBackup(forbiddenBackup);
ok(!forbiddenValidation.valid, "une sauvegarde contenant une réponse d’élève est refusée même avec une nouvelle somme");
ok(forbiddenValidation.errors.some((item) => item.includes("données d’élève interdites")), "la fuite de données est expliquée");

let incomingStore = createEmptyLocalExerciseStore();
incomingStore = upsertLocalExercise(incomingStore, exercise("local-a", "Le jardin A"), "published");
incomingStore = upsertLocalExercise(incomingStore, exercise("local-b", "Le jardin B modifié", "Une nouvelle équipe rejoint le projet."), "published");
incomingStore = upsertLocalExercise(incomingStore, exercise("local-c", "Le jardin C"), "published");
const incomingBackup = buildLocalExerciseBackup(incomingStore, {
  label: "Banque transférée",
  generatedAt: "2026-08-01T13:00:00.000Z"
});

const conflicts = analyzeLocalBackupConflicts(sourceStore, incomingBackup);
ok(conflicts.valid, "l’analyse de conflits accepte la sauvegarde intègre");
equal(conflicts.newEntries.length, 1, "un nouvel exercice est détecté");
equal(conflicts.exactDuplicates.length, 1, "un doublon strict est distingué");
equal(conflicts.conflicts.length, 1, "un même identifiant avec contenu différent est un conflit");
equal(conflicts.conflicts[0].id, "local-b", "l’identifiant en conflit est fourni");

const mergedRenamed = restoreLocalExerciseBackup(sourceStore, incomingBackup, {
  mode: "merge",
  conflictPolicy: "rename"
});
ok(mergedRenamed.valid, "la fusion avec renommage réussit");
equal(mergedRenamed.summary.imported, 1, "le nouvel exercice est ajouté");
equal(mergedRenamed.summary.renamed, 1, "le conflit est conservé sous un nouvel identifiant");
equal(mergedRenamed.summary.skippedDuplicates, 1, "le doublon strict est ignoré");
equal(mergedRenamed.store.entries.length, 4, "la fusion conserve les deux versions en conflit");
const renamedEntry = mergedRenamed.store.entries.find((entry) => entry.exercise.id.startsWith("local-b-transfert"));
ok(renamedEntry, "la version en conflit reçoit un identifiant de transfert");
equal(renamedEntry.status, "draft", "la version renommée revient en brouillon");
equal(mergedRenamed.store.entries.find((entry) => entry.exercise.id === "local-c").status, "draft", "le nouvel exercice transféré revient en brouillon");

const mergedSkipped = restoreLocalExerciseBackup(sourceStore, incomingBackup, {
  mode: "merge",
  conflictPolicy: "skip"
});
equal(mergedSkipped.summary.skippedConflicts, 1, "la politique ignorer conserve l’exercice actuel");
equal(mergedSkipped.store.entries.find((entry) => entry.exercise.id === "local-b").exercise.title, "Le jardin B", "le conflit ignoré ne remplace pas le contenu actuel");

const mergedReplaced = restoreLocalExerciseBackup(sourceStore, incomingBackup, {
  mode: "merge",
  conflictPolicy: "replace"
});
equal(mergedReplaced.summary.replaced, 1, "la politique remplacer écrase le conflit");
equal(mergedReplaced.store.entries.find((entry) => entry.exercise.id === "local-b").exercise.title, "Le jardin B modifié", "le contenu conflictuel est remplacé");
equal(mergedReplaced.store.entries.find((entry) => entry.exercise.id === "local-b").status, "draft", "un exercice écrasé revient en brouillon");

const replacedBank = restoreLocalExerciseBackup(sourceStore, incomingBackup, {
  mode: "replace",
  conflictPolicy: "rename"
});
ok(replacedBank.valid, "le remplacement complet réussit avec un fichier intègre");
equal(replacedBank.store.entries.length, 3, "la banque restaurée correspond au fichier");
ok(replacedBank.store.entries.every((entry) => entry.status === "draft"), "tous les exercices restaurés sont des brouillons");
equal(replacedBank.summary.restoredAsDraft, 3, "le résumé compte tous les brouillons restaurés");

let history = createEmptyLocalBackupHistory();
history = addLocalBackupSnapshot(history, backup);
history = addLocalBackupSnapshot(history, backup);
equal(history.snapshots.length, 1, "une sauvegarde identique n’est pas dupliquée dans l’historique");
for (let index = 0; index < LOCAL_BACKUP_HISTORY_LIMIT + 3; index += 1) {
  const snapshot = buildLocalExerciseBackup(sourceStore, {
    label: `Version ${index}`,
    generatedAt: `2026-08-${String(index + 2).padStart(2, "0")}T12:00:00.000Z`
  });
  history = addLocalBackupSnapshot(history, snapshot);
}
equal(history.snapshots.length, LOCAL_BACKUP_HISTORY_LIMIT, "l’historique respecte sa limite");
const removedChecksum = history.snapshots[0].integrity.checksum;
history = removeLocalBackupSnapshot(history, removedChecksum);
equal(history.snapshots.length, LOCAL_BACKUP_HISTORY_LIMIT - 1, "une version peut être supprimée de l’historique");
ok(!history.snapshots.some((item) => item.integrity.checksum === removedChecksum), "la bonne version est retirée");

const filename = localBackupFilename(backup);
ok(filename.includes("2026-08-01"), "le nom du fichier contient la date");
ok(filename.includes(backup.integrity.checksum), "le nom du fichier contient la somme de contrôle");

const invalidRestore = restoreLocalExerciseBackup(sourceStore, tampered, { mode: "replace" });
ok(!invalidRestore.valid, "une restauration altérée est bloquée");
deepEqual(invalidRestore.store, sourceStore, "un échec d’intégrité ne modifie pas la banque actuelle");

console.log(`Bloc 12 — sauvegarde et restauration : ${checks} assertions réussies.`);
