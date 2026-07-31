import assert from "node:assert/strict";
import secondaryExercises from "../app/data/secondaryExercises.js";
import {
  LOCAL_EXERCISE_STORE_KEY,
  buildLocalExerciseExport,
  buildRuntimeExerciseBank,
  createEmptyLocalExerciseStore,
  createExerciseTemplate,
  duplicateLocalExercise,
  importExercisesIntoStore,
  parseExerciseImport,
  removeLocalExercise,
  sanitizeWorkshopExercise,
  upsertLocalExercise,
  validateWorkshopExercise
} from "../lib/localExerciseWorkshop.js";
import { registerPublishedLocalExercises } from "../lib/exerciseBankRegistration.js";

let checks = 0;
function equal(actual, expected, message) { checks += 1; assert.equal(actual, expected, message); }
function ok(value, message) { checks += 1; assert.ok(value, message); }
function deepEqual(actual, expected, message) { checks += 1; assert.deepEqual(actual, expected, message); }

const template = createExerciseTemplate("sec1");
equal(template.level, "Secondaire 1", "le modèle respecte le niveau choisi");
equal(template.questions.length, 1, "le modèle possède une question");
equal(template.questions[0].targetLevel, "sec1", "la question hérite du niveau");

const source = secondaryExercises[0];
const localExercise = sanitizeWorkshopExercise({
  ...source,
  id: "local-test-bibliotheque",
  title: "Bibliothèque locale",
  questions: source.questions.map((question, index) => ({
    ...question,
    id: `local-q${index + 1}`
  }))
});
equal(localExercise.id, "local-test-bibliotheque");
equal(localExercise.questions.length, source.questions.length);
ok(localExercise.questions.every((question) => question.dimension), "toutes les questions sont classifiées");

// Une correction manuelle valide doit primer sur la détection automatique.
const corrected = sanitizeWorkshopExercise({
  ...localExercise,
  questions: [{
    ...localExercise.questions[0],
    dimension: "interpreter",
    questionType: "implicite",
    proofRequired: false,
    justificationRequired: true,
    minimumExpectedElements: 3
  }, ...localExercise.questions.slice(1)]
});
equal(corrected.questions[0].dimension, "interpreter", "la dimension corrigée est conservée");
equal(corrected.questions[0].questionType, "implicite", "le type corrigé est conservé");
equal(corrected.questions[0].proofRequired, false, "l’exigence de preuve corrigée est conservée");
equal(corrected.questions[0].minimumExpectedElements, 3, "le nombre d’éléments corrigé est conservé");

const validation = validateWorkshopExercise(corrected, [corrected.id]);
equal(validation.valid, true, validation.errors.join(" · "));
ok(validation.automaticAudit.questionCount >= 7, "l’audit automatique est exécuté");

let store = createEmptyLocalExerciseStore();
store = upsertLocalExercise(store, corrected, "draft");
equal(store.entries.length, 1);
equal(store.entries[0].status, "draft");
store = upsertLocalExercise(store, corrected, "published");
equal(store.entries[0].status, "published", "la publication locale est conservée");

const runtime = buildRuntimeExerciseBank([{ id: "statique", title: "Statique", level: "6e", textType: "narratif", category: "test", intention: "test", text: "texte", questions: [] }], store);
ok(runtime.some((exercise) => exercise.id === corrected.id), "un exercice publié apparaît dans la banque élève");
const draftOnlyStore = upsertLocalExercise(createEmptyLocalExerciseStore(), corrected, "draft");
ok(!buildRuntimeExerciseBank([], draftOnlyStore).some((exercise) => exercise.id === corrected.id), "un brouillon n’apparaît pas dans la banque élève");
ok(buildRuntimeExerciseBank([], draftOnlyStore, { includeDrafts: true }).some((exercise) => exercise.id === corrected.id), "l’admin peut inclure les brouillons");

const duplicated = duplicateLocalExercise(store, corrected.id);
equal(duplicated.entries.length, 2, "la duplication crée une deuxième entrée");
ok(duplicated.entries.some((entry) => entry.exercise.title.includes("copie")), "la copie est identifiable");
const removed = removeLocalExercise(duplicated, corrected.id);
equal(removed.entries.length, 1, "la suppression retire seulement l’exercice ciblé");

const oneExerciseExport = buildLocalExerciseExport(store, [corrected.id]);
equal(oneExerciseExport.exportType, "banque-exercices-locale");
equal(oneExerciseExport.storageScope, "local-browser");
equal(oneExerciseExport.entries.length, 1);
equal(oneExerciseExport.entries[0].exercise.id, corrected.id);

const parsedSingle = parseExerciseImport(JSON.stringify(corrected));
equal(parsedSingle.valid, true);
equal(parsedSingle.exercises.length, 1);
const parsedBank = parseExerciseImport(JSON.stringify(oneExerciseExport));
equal(parsedBank.valid, true);
equal(parsedBank.exercises[0].id, corrected.id);
const invalid = parseExerciseImport("{pas du json");
equal(invalid.valid, false);

const imported = importExercisesIntoStore(createEmptyLocalExerciseStore(), parsedBank.exercises);
equal(imported.store.entries.length, 1);
equal(imported.store.entries[0].status, "draft", "un import revient en brouillon pour validation");

// Vérifie le registre utilisé par les modules historiques du parcours élève.
global.window = {};
global.localStorage = {
  getItem(key) {
    return key === LOCAL_EXERCISE_STORE_KEY ? JSON.stringify(store) : null;
  }
};
const target = [];
registerPublishedLocalExercises(target);
equal(target.length, 1, "le registre historique charge le texte publié");
equal(target[0].id, corrected.id);
delete global.window;
delete global.localStorage;

// Le magasin ne doit pas contenir de réponses ou preuves d’élèves.
const serialized = JSON.stringify(store);
ok(!serialized.includes("studentAnswer"), "aucune réponse d’élève n’est conservée");
ok(!serialized.includes("selectedProof"), "aucune preuve d’élève n’est conservée");

console.log(`Bloc 10 — atelier local : ${checks} assertions réussies.`);
