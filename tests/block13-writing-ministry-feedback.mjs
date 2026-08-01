import assert from "node:assert/strict";
import {
  WRITING_MINISTRY_CRITERIA,
  WRITING_SIMULATION_CHECKLIST,
  analyzeWritingForRevision,
  buildWritingSimulationChecklist,
  validateWritingFeedbackSafety
} from "../lib/writingMinistryFeedback.js";

let checks = 0;
function ok(value, message) { checks += 1; assert.ok(value, message); }
function equal(actual, expected, message) { checks += 1; assert.equal(actual, expected, message); }
function deepEqual(actual, expected, message) { checks += 1; assert.deepEqual(actual, expected, message); }

const expectedLabels = [
  "Adaptation à la situation d’écriture",
  "Cohérence du texte",
  "Utilisation d’un vocabulaire approprié",
  "Construction des phrases et ponctuation appropriées",
  "Respect de l’orthographe d’usage et grammaticale"
];

equal(WRITING_MINISTRY_CRITERIA.length, 5, "les cinq critères ministériels sont présents");
deepEqual(WRITING_MINISTRY_CRITERIA.map((item) => item.label), expectedLabels, "les libellés ministériels sont conservés");
equal(WRITING_SIMULATION_CHECKLIST.length, 5, "la simulation possède cinq vérifications");

const completeText = `Bonjour aux membres du conseil des élèves.

D’abord, notre école devrait aménager un jardin parce que les élèves pourraient observer les plantes. Les bénévoles organisent les outils et ils expliquent les étapes du projet.

Ensuite, ce lieu aiderait les groupes à travailler ensemble. Par exemple, les classes pourraient mesurer les plantes, noter leurs observations et partager leurs découvertes.

En conclusion, je vous invite à soutenir ce projet afin que les élèves disposent d’un espace utile et accueillant.`;

const context = {
  text: completeText,
  audience: "les membres du conseil des élèves",
  purpose: "les convaincre de soutenir un jardin scolaire",
  textType: "Lettre d’opinion",
  minimumParagraphs: 4,
  mode: "training"
};

const before = JSON.parse(JSON.stringify(context));
const complete = analyzeWritingForRevision(context);
deepEqual(context, before, "l’analyse ne modifie jamais le texte ni son contexte");
equal(complete.mode, "training", "le mode entraînement est conservé");
equal(complete.criteria.length, 5, "les cinq critères reçoivent une rétroaction");
equal(complete.studentTextChanged, false, "le moteur déclare explicitement ne pas modifier le texte");
ok(complete.signals.wordCount > 40, "le nombre de mots est observé");
equal(complete.signals.paragraphCount, 4, "les paragraphes sont repérés");
ok(complete.signals.relationMarkerCount >= 3, "les marqueurs de relation sont repérés");
ok(complete.strengths.length <= 2, "au plus deux forces sont affichées");
ok(complete.improvements.length <= 3, "au plus trois priorités sont affichées");
ok(typeof complete.nextStep === "string" && complete.nextStep.length > 0, "une seule prochaine action est produite");
equal(validateWritingFeedbackSafety(complete).valid, true, "la rétroaction d’entraînement respecte les garde-fous");

const adaptation = complete.criteria.find((item) => item.id === "adaptation");
equal(adaptation.state, "check", "le contrat complet déclenche une vérification humaine, pas une validation sémantique");
ok(adaptation.summary.includes("relecture humaine"), "la limite humaine de l’adaptation est explicite");

const missingContext = analyzeWritingForRevision({ text: completeText, mode: "training" });
const missingAdaptation = missingContext.criteria.find((item) => item.id === "adaptation");
equal(missingAdaptation.state, "review", "un destinataire, un but et un type manquants sont signalés");
ok(missingAdaptation.summary.includes("destinataire"), "le destinataire manquant est nommé");
ok(missingAdaptation.summary.includes("but"), "le but manquant est nommé");
ok(missingAdaptation.summary.includes("type de texte"), "le type de texte manquant est nommé");

const disorganized = analyzeWritingForRevision({
  ...context,
  text: "Une seule idée est écrite sans séparation et sans lien clair avec une conclusion."
});
const coherence = disorganized.criteria.find((item) => item.id === "coherence");
equal(coherence.state, "review", "un texte sans paragraphes suffisants déclenche une révision");
ok(coherence.actions.some((item) => item.includes("paragraphes")), "le rappel de paragraphes est ciblé");
ok(coherence.actions.some((item) => item.includes("marqueurs de relation")), "le rappel des marqueurs est ciblé");

const repetitive = analyzeWritingForRevision({
  ...context,
  text: "Le projet est important. Ce projet important aide les élèves. Le projet demeure important pour tous. Enfin, le projet important mérite une décision."
});
const vocabulary = repetitive.criteria.find((item) => item.id === "vocabulary");
equal(vocabulary.state, "review", "les répétitions fréquentes déclenchent une relecture");
ok(vocabulary.actions.some((item) => item.includes("répétitions")), "la répétition est signalée sans imposer un remplacement");
ok(!JSON.stringify(vocabulary).includes("remplace par"), "aucun mot de remplacement n’est fourni");

const longSentence = Array.from({ length: 40 }, (_, index) => `mot${index + 1}`).join(" ");
const sentenceSample = analyzeWritingForRevision({
  ...context,
  text: `Court. ${longSentence}. cette phrase commence sans majuscule`
});
const sentences = sentenceSample.criteria.find((item) => item.id === "sentences");
equal(sentences.state, "review", "les longueurs et la ponctuation déclenchent une relecture");
ok(sentences.actions.some((item) => item.includes("moins de quatre mots")), "les phrases très courtes sont repérées prudemment");
ok(sentences.actions.some((item) => item.includes("plus de 34 mots")), "les phrases très longues sont repérées");
ok(sentences.actions.some((item) => item.includes("ponctuation finale")), "la ponctuation finale manquante est repérée");
ok(sentences.actions.length <= 3, "le critère limite les actions de révision affichées");

const orthography = complete.criteria.find((item) => item.id === "orthography");
equal(orthography.state, "check", "l’orthographe demeure une vérification, pas une correction automatique");
ok(orthography.actions.some((item) => item.includes("dictionnaire")), "un outil de vérification est proposé");
ok(orthography.actions.some((item) => item.includes("accord")), "les accords fréquents sont rappelés");
ok(orthography.summary.includes("ne corrige aucun mot"), "la limite de correction est explicite");

const empty = analyzeWritingForRevision({ mode: "training" });
equal(empty.status, "empty", "un brouillon vide reçoit un statut distinct");
ok(empty.criteria.every((item) => ["review", "check"].includes(item.state)), "aucune fausse réussite n’est produite pour un texte vide");

const simulation = analyzeWritingForRevision({ ...context, mode: "simulation" });
equal(simulation.mode, "simulation", "le mode simulation est reconnu");
equal(simulation.criteria.length, 5, "la simulation conserve les cinq critères");
ok(simulation.criteria.every((item) => item.state === "self-check"), "la simulation repose seulement sur l’autoévaluation");
deepEqual(simulation.strengths, [], "aucune force ciblée n’est fournie en simulation");
deepEqual(simulation.improvements, [], "aucune priorité ciblée n’est fournie en simulation");
equal(simulation.nextStep, "", "aucune prochaine action personnalisée n’est fournie en simulation");
equal(simulation.signals, null, "aucun signal calculé n’est affiché en simulation");
equal(validateWritingFeedbackSafety(simulation).valid, true, "la simulation respecte les garde-fous");

const checklist = buildWritingSimulationChecklist();
equal(checklist.length, 5, "la liste autonome possède cinq lignes");
deepEqual(checklist.map((item) => item.label), expectedLabels, "la liste autonome reprend les critères officiels");

const serialized = JSON.stringify(complete);
for (const forbidden of ["correctedText", "replacementText", "rewrittenText", "expectedAnswer", "studentAnswer"]) {
  ok(!serialized.includes(`\"${forbidden}\"`), `le champ ${forbidden} n’est jamais produit`);
}
ok(!serialized.includes(completeText), "le moteur ne recopie pas le texte de l’élève dans sa sortie");

console.log(`Bloc 13 — rétroaction ministérielle en écriture : ${checks} assertions réussies.`);
