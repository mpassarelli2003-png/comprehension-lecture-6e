import assert from "node:assert/strict";
import * as classification from "../lib/questionClassification.js";

const {
  buildQuestionBank,
  classifyQuestion,
  detectQuestionWord,
  normalizeExerciseQuestions,
  normalizeQuestionLevel,
  summarizeQuestionBank,
  validateQuestionSchema
} = classification;

let checks = 0;
function equal(actual, expected, message) {
  checks += 1;
  assert.equal(actual, expected, message);
}
function ok(value, message) {
  checks += 1;
  assert.ok(value, message);
}

const wordCases = [
  ["Qui accueille Shanshan ?", "qui"],
  ["Pourquoi l’équipe réussit-elle ?", "pourquoi"],
  ["Comment l’équipe s’organise-t-elle ?", "comment"],
  ["Combien de personnages sont présents ?", "combien"],
  ["Quand l’action se déroule-t-elle ?", "quand"],
  ["Où se déroule l’histoire ?", "où"],
  ["Quels sont les deux gaz ?", "quel"],
  ["Qu’est-ce que ce passage signifie ?", "quoi"],
  ["Que fait le personnage ?", "quoi"],
  ["Décris le travail d’équipe.", "quoi"],
  ["Explique pourquoi cette équipe gagne.", "pourquoi"],
  ["L’équipe agit-elle efficacement ?", "quoi"]
];
for (const [prompt, expected] of wordCases) equal(detectQuestionWord(prompt), expected, prompt);

equal(normalizeQuestionLevel("6e année"), "6e");
equal(normalizeQuestionLevel("Secondaire 1"), "sec1");
equal(normalizeQuestionLevel("sec. 2"), "sec2");

const explicit = classifyQuestion({ prompt: "Où se trouve la cabane ?", type: "comprendre", points: 1, proofTypeSuggested: "explicite" });
equal(explicit.dimension, "comprendre");
equal(explicit.questionType, "explicite");
equal(explicit.proofRequired, true);
equal(explicit.justificationRequired, false);
equal(explicit.minimumExpectedElements, 1);

const inference = classifyQuestion({ prompt: "Que peut-on déduire du comportement du personnage ?", type: "comprendre", proofTypeSuggested: "inference", points: 2 });
equal(inference.dimension, "inferer");
equal(inference.questionType, "implicite");
equal(inference.justificationRequired, true);
equal(inference.minimumExpectedElements, 2);
equal(inference.recommendedProofTool, "inference");

const interpretation = classifyQuestion({ prompt: "Quelle est la signification profonde de la citation ?", type: "interpreter", points: 2 });
equal(interpretation.dimension, "interpreter");
equal(interpretation.questionType, "implicite");
equal(interpretation.validationProfile.checklist.length >= 3, true);

const accordingToYou = classifyQuestion({ prompt: "Selon toi, quel message le récit transmet-il ?", type: "comprendre", points: 2 });
equal(accordingToYou.dimension, "interpreter");

const reaction = classifyQuestion({ prompt: "Que ressens-tu après cette scène ? Explique.", type: "comprendre", points: 2 });
equal(reaction.dimension, "reagir");
equal(reaction.questionType, "opinion_justifiee");
equal(reaction.recommendedProofTool, "reaction");

const appreciation = classifyQuestion({ prompt: "Qu’as-tu le plus aimé dans ce texte ? Justifie ton choix.", type: "comprendre", points: 2 });
equal(appreciation.dimension, "apprecier");
equal(appreciation.questionType, "jugement_critique");
equal(appreciation.minimumExpectedElements, 3);
ok(appreciation.validationProfile.checklist.some((item) => item.includes("critère")), "critère attendu");

const legacyJudgement = classifyQuestion({ prompt: "Conseillerais-tu cette activité ? Pourquoi ?", type: "jugement", points: 2 });
equal(legacyJudgement.dimension, "apprecier");
equal(legacyJudgement.justificationRequired, true);

const twoExamples = classifyQuestion({ prompt: "Donne deux exemples de bienfaits.", type: "comprendre", points: 1 });
equal(twoExamples.minimumExpectedElements, 2);

const fourAnimals = classifyQuestion({ prompt: "Cite quatre animaux du zodiaque.", type: "comprendre", points: 1 });
equal(fourAnimals.minimumExpectedElements, 4);

const doubleQuestion = classifyQuestion({ prompt: "Quel est le sport et quel est son principe ?", type: "comprendre", points: 1 });
equal(doubleQuestion.minimumExpectedElements, 2);

const override = classifyQuestion({
  prompt: "Donne ton impression générale.",
  dimension: "reagir",
  questionType: "opinion_justifiee",
  proofRequired: false,
  justificationRequired: false,
  minimumExpectedElements: 1,
  targetLevel: "sec2"
});
equal(override.dimension, "reagir");
equal(override.proofRequired, false);
equal(override.justificationRequired, false);
equal(override.minimumExpectedElements, 1);
equal(override.targetLevel, "sec2");

const exercise = normalizeExerciseQuestions({
  id: "test",
  title: "Test",
  level: "Secondaire 1",
  questions: [
    { id: "q1", prompt: "Qui agit ?", type: "comprendre", points: 1 },
    { id: "q2", prompt: "Selon toi, quel message est transmis ?", type: "interpreter", points: 2 },
    { id: "q3", prompt: "Qu’as-tu apprécié ?", type: "apprecier", points: 2 }
  ]
});
equal(exercise.questions.length, 3);
equal(exercise.questions[0].targetLevel, "sec1");
equal(exercise.questions[1].dimension, "interpreter");
equal(exercise.questions[2].dimension, "apprecier");
equal(exercise.questions[0].classificationVersion, "1.0");

const bank = buildQuestionBank([exercise]);
equal(bank.length, 3);
equal(bank[0].exerciseId, "test");
equal(bank[2].order, 3);

const summary = summarizeQuestionBank([exercise]);
equal(summary.total, 3);
equal(summary.byLevel.sec1, 3);
equal(summary.byDimension.comprendre, 1);
equal(summary.byDimension.interpreter, 1);
equal(summary.byDimension.apprecier, 1);
equal(summary.proofRequired, 3);

const valid = validateQuestionSchema(exercise.questions[0]);
equal(valid.valid, true);
const invalid = validateQuestionSchema({ prompt: "Question sans identifiant" });
equal(invalid.valid, false);
ok(invalid.errors.includes("id manquant"), "id obligatoire");

console.log(`Bloc 5 : ${checks} assertions réussies.`);
