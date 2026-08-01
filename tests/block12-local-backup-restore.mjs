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
  normalizeLocalExerciseStore,
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
ok(serialized.includes("expectedAnswer"), "la réponse attendue administrateur demeure un contenu permis");

equal(
  backup.integrity.checksum,
  calculateLocalBackupChecksum(({ integrity, ...payload }) => payload),
  "placeholder"
);
