import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import baseExercises from "../app/data/exercises.js";
import moreExercises from "../app/data/moreExercises.js";
import genesisExercise from "../app/data/genesisExercise.js";
import { summarizeContentBank } from "../lib/contentCalibration.js";
import { registerCalibratedExercises } from "../lib/exerciseBankRegistration.js";
import { normalizeExerciseLevel } from "../lib/learningConfig.js";
import { normalizeExerciseQuestions } from "../lib/questionClassification.js";

registerCalibratedExercises(moreExercises);
const exercises = [...baseExercises, ...moreExercises, genesisExercise].map(normalizeExerciseQuestions);
const byLevel = (levelId) => exercises.filter((exercise) => normalizeExerciseLevel(exercise.level) === levelId);
const prompts = (exercise) => exercise.questions.map((question) => question.prompt).join("\n");
const dimensions = (exercise, wanted) => exercise.questions.filter((question) => wanted.includes(question.dimension));

let checks = 0;
function ok(value, message) {
  checks += 1;
  assert.ok(value, message);
}
function equal(actual, expected, message) {
  checks += 1;
  assert.equal(actual, expected, message);
}

// 1. Le filtre 6e ne doit jamais afficher les contenus secondaires.
const sixieme = byLevel("6e");
const sec1 = byLevel("sec1");
const sec2 = byLevel("sec2");
ok(sixieme.length >= 2, "La banque 6e doit rester suffisamment visible.");
equal(sec1.length, 2, "Deux textes de secondaire 1 sont attendus.");
equal(sec2.length, 2, "Deux textes de secondaire 2 sont attendus.");
ok(sixieme.every((exercise) => normalizeExerciseLevel(exercise.level) === "6e"), "Le choix 6e ne doit contenir que des textes de 6e.");
ok(!sixieme.some((exercise) => /^sec[12]-/.test(exercise.id)), "Aucun texte secondaire ne doit apparaître dans la liste 6e.");

// 2. Secondaire 1 narratif : les inférences et l'interprétation doivent être réellement présentes.
const bibliotheque = sec1.find((exercise) => exercise.id === "sec1-bibliotheque-objets");
ok(bibliotheque, "Le récit La bibliothèque des objets doit être publié.");
equal(bibliotheque.textType, "narratif", "Le texte doit être identifié comme narratif.");
ok(dimensions(bibliotheque, ["inferer", "interpreter"]).length >= 3, "Le récit doit contenir plusieurs questions d’inférence ou d’interprétation.");
ok(/Pourquoi Malik/i.test(prompts(bibliotheque)), "Une question doit faire inférer la motivation de Malik.");
ok(/Que symbolise/i.test(prompts(bibliotheque)), "Une question doit demander l’interprétation du symbole final.");

// 3. Secondaire 1 informatif : causes, conséquences, limites et conditions de réussite.
const arbres = sec1.find((exercise) => exercise.id === "sec1-arbres-ville");
ok(arbres, "Le texte sur les arbres urbains doit être publié.");
ok(/absorbent l’énergie du soleil/i.test(arbres.text), "La cause des îlots de chaleur doit être expliquée.");
ok(/retiennent une partie de l’eau de pluie/i.test(arbres.text), "Une conséquence positive sur l’eau doit être expliquée.");
ok(/planter ne suffit pas/i.test(arbres.text), "Le texte doit expliciter les limites de la plantation seule.");
ok(/deux conditions nécessaires à la réussite/i.test(prompts(arbres)), "Une question doit vérifier les conditions de réussite.");

// 4. Secondaire 2 opinion : thèse nuancée et contre-arguments visibles.
const notifications = sec2.find((exercise) => exercise.id === "sec2-notifications-ecole");
ok(notifications, "Le texte sur les notifications doit être publié.");
equal(notifications.textType, "opinion", "Le texte doit être identifié comme texte d’opinion.");
ok(/Une interdiction totale soulève toutefois des problèmes/i.test(notifications.text), "Le contre-argument à l’interdiction totale doit être visible.");
ok(/Il faut également éviter de présenter la technologie comme l’unique cause/i.test(notifications.text), "Un second contre-argument doit nuancer la thèse.");
ok(/distinction entre « bloquer » et « limiter »/i.test(prompts(notifications)), "Une question doit vérifier la nuance de la position.");
ok(/modifie-t-il la thèse/i.test(prompts(notifications)), "Une question doit faire analyser l’évolution de la thèse.");

// 5. Secondaire 2 lettre : destinataire, intention et procédés de persuasion.
const silence = sec2.find((exercise) => exercise.id === "sec2-lettre-silence");
ok(silence, "La lettre ouverte sur le silence doit être publiée.");
equal(silence.category, "lettre d’opinion", "Le genre doit être clairement identifié.");
ok(/^À la direction et au conseil des élèves/m.test(silence.text), "Le destinataire doit être explicite dans la lettre.");
ok(/son destinataire, ses arguments et ses procédés de persuasion/i.test(silence.intention), "L’intention de lecture doit annoncer les éléments à analyser.");
ok(/À qui cette lettre est-elle adressée/i.test(prompts(silence)), "Une question doit vérifier le destinataire et la mesure proposée.");
ok(/Quel procédé de persuasion/i.test(prompts(silence)), "Une question doit vérifier l’analyse d’un procédé de persuasion.");
ok(/Cette objection est raisonnable/i.test(silence.text), "La concession utilisée comme procédé argumentatif doit être présente.");

// 6. L'audit admin et le parcours élève doivent lire la même banque et produire les mêmes comptes.
const summary = summarizeContentBank(exercises);
equal(summary.byLevel["6e"], sixieme.length, "Le compte admin 6e doit correspondre à la liste élève.");
equal(summary.byLevel.sec1, sec1.length, "Le compte admin sec. 1 doit correspondre à la liste élève.");
equal(summary.byLevel.sec2, sec2.length, "Le compte admin sec. 2 doit correspondre à la liste élève.");
equal(summary.totalTexts, exercises.length, "Le total admin doit correspondre à la banque réellement utilisée.");
equal(summary.errors.length, 0, "L’audit admin ne doit signaler aucune erreur bloquante.");

const [pageSource, adminSource, registrationSource] = await Promise.all([
  readFile(new URL("../app/page.jsx", import.meta.url), "utf8"),
  readFile(new URL("../app/admin/ContentCalibrationAdminPanel.jsx", import.meta.url), "utf8"),
  readFile(new URL("../lib/exerciseBankRegistration.js", import.meta.url), "utf8")
]);
ok(/exercises\.filter\(\(item\) => normalizeExerciseLevel\(item\.level\) === selectedLevel\)/.test(pageSource), "Le parcours élève doit filtrer strictement selon le niveau choisi.");
ok(/availableExercises\.map/.test(pageSource), "La liste élève doit rendre uniquement les exercices filtrés.");
ok(/summarizeContentBank\(exercises\)/.test(adminSource), "L’admin doit auditer la banque réellement chargée.");
ok(/registerCalibratedExercises\(\)/.test(registrationSource), "Les contenus calibrés doivent être enregistrés avant les affichages.");

console.log(`Bloc 8 — six parcours réels : ${checks} assertions réussies.`);
