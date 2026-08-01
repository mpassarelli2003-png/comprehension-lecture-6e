import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  WRITING_MINISTRY_CRITERIA,
  analyzeWritingForRevision,
  buildWritingSimulationChecklist,
  validateWritingFeedbackSafety
} from "../lib/writingMinistryFeedback.js";

let checks = 0;
function ok(value, message) {
  checks += 1;
  assert.ok(value, message);
}
function equal(actual, expected, message) {
  checks += 1;
  assert.equal(actual, expected, message);
}
function deepEqual(actual, expected, message) {
  checks += 1;
  assert.deepEqual(actual, expected, message);
}

const brief = {
  audience: "les membres du conseil des élèves",
  purpose: "les convaincre d’aménager un jardin scolaire",
  textType: "Lettre d’opinion",
  minimumParagraphs: 4
};

// 1. Brouillon réel volontairement court, peu organisé et répétitif.
const draft = "bonjour au conseil. Le jardin est une bonne chose et cette chose est importante parce que le jardin est important pour les élèves et le jardin est important pour notre école sans autre paragraphe ni conclusion";
const originalDraft = `${draft}`;

const trainingInput = {
  text: draft,
  ...brief,
  mode: "training"
};
const inputSnapshot = structuredClone(trainingInput);

// 2. Analyse formative.
const training = analyzeWritingForRevision(trainingInput);
deepEqual(trainingInput, inputSnapshot, "l’analyse ne modifie pas les données d’entrée");
equal(draft, originalDraft, "le brouillon reste strictement inchangé après l’analyse");
equal(training.studentTextChanged, false, "le moteur confirme qu’il ne modifie jamais le texte");
equal(training.mode, "training", "le parcours commence en mode entraînement");
equal(training.status, "partial", "le brouillon incomplet reçoit un statut formatif partiel");
equal(training.criteria.length, 5, "les cinq critères ministériels sont évalués");
deepEqual(training.criteria.map((item) => item.label), WRITING_MINISTRY_CRITERIA.map((item) => item.label), "les cinq critères conservent leurs libellés");

// 3. Limites de rétroaction : deux forces, trois priorités, une seule action.
ok(training.strengths.length <= 2, "au plus deux forces sont affichées");
ok(training.improvements.length > 0, "le brouillon réel produit au moins une priorité de révision");
ok(training.improvements.length <= 3, "au plus trois priorités sont affichées");
ok(typeof training.nextStep === "string" && training.nextStep.trim().length > 0, "une prochaine action unique est fournie");
equal(training.nextStep, training.improvements[0], "la prochaine action correspond à la première priorité, sans liste supplémentaire");

// 4. Les signaux attendus sont descriptifs et prudents.
equal(training.signals.paragraphCount, 1, "le faible nombre de paragraphes est repéré");nok(training.signals.wordCount > 20, "le nombre de mots est calculé sans recopier le brouillon");
ok(training.criteria.some((item) => item.id === "coherence" && item.state === "review"), "la cohérence est proposée à la révision");
ok(training.criteria.some((item) => item.id === "vocabulary" && item.state === "review"), "les répétitions déclenchent une relecture du vocabulaire");
ok(training.criteria.some((item) => item.id === "sentences" && item.state === "review"), "les phrases et la ponctuation déclenchent une relecture");

// 5. Posture pédagogique : aucune correction, note ou verdict trompeur.
const trainingSerialized = JSON.stringify(training);
for (const forbiddenKey of ["correctedText", "replacementText", "rewrittenText", "expectedAnswer", "studentAnswer"]) {
  ok(!trainingSerialized.includes(`\"${forbiddenKey}\"`), `le champ interdit ${forbiddenKey} est absent`);
}
for (const forbiddenPhrase of [
  "ton texte est correct",
  "ton texte est satisfaisant",
  "tu aurais b",
  "tu as 6 fautes",
  "cette phrase est fautive"
]) {
  ok(!trainingSerialized.toLowerCase().includes(forbiddenPhrase), `la formulation interdite « ${forbiddenPhrase} » est absente`);
}
ok(!trainingSerialized.includes(originalDraft), "la sortie ne conserve ni ne recopie le texte complet de l’élève");
equal(validateWritingFeedbackSafety(training).valid, true, "la rétroaction d’entraînement respecte les garde-fous");

// 6. Passage réel en simulation avec le même brouillon.
const simulation = analyzeWritingForRevision({
  text: draft,
  ...brief,
  mode: "simulation"
});
equal(draft, originalDraft, "le passage en simulation ne modifie pas le brouillon");
equal(simulation.mode, "simulation", "le mode simulation est activé");
equal(simulation.criteria.length, 5, "les cinq critères demeurent visibles en simulation");
ok(simulation.criteria.every((item) => item.state === "self-check"), "tous les critères deviennent des autoévaluations");
deepEqual(simulation.strengths, [], "les forces personnalisées disparaissent en simulation");
deepEqual(simulation.improvements, [], "les priorités personnalisées disparaissent en simulation");
equal(simulation.nextStep, "", "la prochaine action personnalisée disparaît en simulation");
equal(simulation.signals, null, "les signaux calculés disparaissent en simulation");
equal(simulation.studentTextChanged, false, "la simulation confirme aussi que le texte reste inchangé");
equal(validateWritingFeedbackSafety(simulation).valid, true, "la simulation respecte les garde-fous");

// 7. La liste autonome comporte exactement cinq lignes et peut être cochée sans texte scolaire.
const checklist = buildWritingSimulationChecklist();
equal(checklist.length, 5, "la simulation affiche exactement cinq cases d’autoévaluation");
deepEqual(checklist.map((item) => item.label), WRITING_MINISTRY_CRITERIA.map((item) => item.label), "les cases reprennent les cinq critères ministériels");
const localChecks = Object.fromEntries(checklist.map((item) => [`ministere-ecriture-${item.id}`, true]));
equal(Object.values(localChecks).filter(Boolean).length, 5, "les cinq cases peuvent être confirmées localement");
ok(!JSON.stringify(localChecks).includes(originalDraft), "l’état des cases ne contient aucun texte d’élève");

// 8. Vérification de l’intégration réelle dans l’interface /ecriture.
const panelSource = await readFile(new URL("../app/ecriture/WritingMinistryFeedbackPanel.jsx", import.meta.url), "utf8");
const revisionSource = await readFile(new URL("../app/ecriture/Step5Revision.jsx", import.meta.url), "utf8");
const pageSource = await readFile(new URL("../app/ecriture/page.jsx", import.meta.url), "utf8");

ok(panelSource.includes("Analyser mon brouillon pour préparer ma révision"), "le déclencheur réel d’analyse est présent");
ok(panelSource.includes("if (examMode)"), "l’interface possède une branche distincte pour la simulation");
ok(panelSource.includes("setFeedback(null)"), "un changement du brouillon ou du mode efface l’analyse précédente");
ok(panelSource.includes("feedback.strengths"), "les forces sont rendues seulement depuis le résultat formatif");
ok(panelSource.includes("feedback.improvements"), "les priorités sont rendues seulement depuis le résultat formatif");
ok(panelSource.includes("feedback.nextStep"), "une seule prochaine action est rendue");
ok(panelSource.includes("Aucune analyse ciblée ni suggestion de contenu n’est affichée"), "la limite de la simulation est annoncée dans l’interface");
ok(panelSource.includes("simulationChecklist.map"), "la simulation rend la liste autonome des cinq critères");
ok(revisionSource.includes("<WritingMinistryFeedbackPanel"), "le panneau est réellement monté à l’étape 5");
ok(revisionSource.includes("examMode={examMode}"), "le mode réel de la page est transmis au panneau");
ok(pageSource.includes("examMode={examMode}"), "l’étape 5 reçoit le mode entraînement ou simulation courant");
ok(!panelSource.includes("localStorage"), "la rétroaction personnalisée n’est pas stockée localement par le panneau");
ok(!panelSource.includes("fetch("), "aucun texte n’est envoyé à un service distant");

console.log(`Bloc 13b — parcours réel de rétroaction d’écriture : ${checks} assertions réussies.`);
