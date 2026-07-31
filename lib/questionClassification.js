export const QUESTION_CLASSIFICATION_VERSION = "1.0";

export const QUESTION_DIMENSIONS = {
  comprendre: { label: "Comprendre", colorClass: "strategyUnderstand" },
  inferer: { label: "Inférer", colorClass: "strategyInfer" },
  interpreter: { label: "Interpréter", colorClass: "strategyInfer" },
  reagir: { label: "Réagir", colorClass: "strategyReact" },
  apprecier: { label: "Apprécier", colorClass: "strategyAppreciate" }
};

export const QUESTION_TYPES = {
  explicite: "Explicite",
  implicite: "Implicite",
  opinion_justifiee: "Opinion justifiée",
  jugement_critique: "Jugement critique"
};

export const QUESTION_WORD_HELP = {
  pourquoi: "Je cherche une raison, une cause ou une intention.",
  comment: "Je cherche une manière, des étapes, un changement ou une explication.",
  combien: "Je cherche un nombre, une quantité ou une durée.",
  quand: "Je cherche un moment, une date, une saison ou une époque.",
  où: "Je cherche un lieu ou un endroit.",
  qui: "Je cherche une personne, un personnage ou un animal.",
  quel: "Je cherche un élément précis parmi plusieurs possibilités.",
  quoi: "Je cherche une action, une idée, un objet ou une information précise."
};

const ALLOWED_LEVELS = new Set(["6e", "sec1", "sec2"]);
const ALLOWED_DIMENSIONS = new Set(Object.keys(QUESTION_DIMENSIONS));
const ALLOWED_TYPES = new Set(Object.keys(QUESTION_TYPES));

const NUMBER_WORDS = {
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6
};

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasPhrase(value, expression) {
  return expression.test(normalize(value));
}

export function normalizeQuestionLevel(level = "6e") {
  const value = normalize(level);
  if (ALLOWED_LEVELS.has(value)) return value;
  if (/secondaire 2|sec 2/.test(value)) return "sec2";
  if (/secondaire 1|sec 1/.test(value)) return "sec1";
  return "6e";
}

export function detectQuestionWord(prompt = "") {
  const original = String(prompt).toLowerCase();
  const value = normalize(prompt);

  if (/\bpourquoi\b/.test(value)) return "pourquoi";
  if (/\bcomment\b/.test(value)) return "comment";
  if (/\bcombien\b/.test(value)) return "combien";
  if (/\bquand\b/.test(value)) return "quand";
  if (/(?:^|[^\p{L}])où(?:$|[^\p{L}])/u.test(original)) return "où";
  if (/\bqu est ce(?: que| qui)?\b|\bquoi\b/.test(value)) return "quoi";
  if (/\b(quels?|quelles?|lequel|laquelle|lesquels|lesquelles)\b/.test(value)) return "quel";
  if (/\bqui\b/.test(value)) return "qui";
  if (/\bque\b/.test(value)) return "quoi";
  return "quoi";
}

export function getQuestionWordHelp(word = "quoi") {
  return QUESTION_WORD_HELP[word] || QUESTION_WORD_HELP.quoi;
}

function personalAppreciationPrompt(prompt) {
  return hasPhrase(prompt, /\b(aimes tu|as tu aime|qu as tu(?: le plus)? aime|qu est ce que tu as(?: le plus)? aime|qu est ce qui t a(?: le plus)? interesse|que penses tu(?: de)?|recommanderais tu|conseillerais tu|trouves tu|juges tu|quel passage as tu prefere|quelle partie as tu preferee|apprecies tu)\b/);
}

function personalReactionPrompt(prompt) {
  return hasPhrase(prompt, /\b(que ressens tu|comment te sentirais tu|que ferais tu|comment reagirais tu|quelle serait ta reaction|as tu deja|aimerais tu|cela t inspire|t inspire|commenter? ta reaction)\b/);
}

function interpretationPrompt(prompt) {
  return hasPhrase(prompt, /\b(signification|sens profond|message|que veut dire|que signifie|que montre|que peut on comprendre|laisse entendre|suggere|symbolise|intention de l auteur|role du personnage)\b/);
}

function inferencePrompt(prompt) {
  return hasPhrase(prompt, /\b(peut on deduire|deduis|inference|indices?|implicitement|sans le dire|pourrait expliquer|probablement)\b/);
}

function inferDimension(question = {}) {
  const declared = normalize(question.dimension);
  if (ALLOWED_DIMENSIONS.has(declared)) return declared;

  const legacyType = normalize(question.type || question.legacyType);
  const proof = normalize(question.proofTypeSuggested);
  const prompt = question.prompt || question.text || "";
  const normalizedPrompt = normalize(prompt);

  if (/apprecier|jugement|critique/.test(legacyType) || personalAppreciationPrompt(prompt)) return "apprecier";
  if (/reagir|reaction/.test(legacyType) || personalReactionPrompt(prompt)) return "reagir";
  if (/interpret/.test(legacyType) || interpretationPrompt(prompt)) return "interpreter";
  if (/infer/.test(legacyType) || /inference/.test(proof) || inferencePrompt(prompt)) return "inferer";

  if (/\bselon toi\b/.test(normalizedPrompt)) {
    if (/ressens|ferais|reagir|vecu|personnel/.test(normalizedPrompt)) return "reagir";
    if (/aime|interesse|prefere|recommande|avis|penses tu de/.test(normalizedPrompt)) return "apprecier";
    return "interpreter";
  }

  if (/\b(explique pourquoi|comment expliquerais tu|en quoi)\b/.test(normalizedPrompt) && !/explicite/.test(proof)) return "inferer";
  return "comprendre";
}

function inferQuestionType(dimension, declaredType = "") {
  const direct = String(declaredType || "").toLowerCase().trim();
  if (ALLOWED_TYPES.has(direct)) return direct;
  const canonical = normalize(declaredType).replace(/\s+/g, "_");
  if (ALLOWED_TYPES.has(canonical)) return canonical;
  if (dimension === "comprendre") return "explicite";
  if (dimension === "inferer" || dimension === "interpreter") return "implicite";
  if (dimension === "reagir") return "opinion_justifiee";
  return "jugement_critique";
}

function inferJustificationRequired(question, dimension) {
  if (typeof question.justificationRequired === "boolean") return question.justificationRequired;
  const prompt = normalize(question.prompt || question.text || "");
  if (Number(question.points || 1) >= 2) return true;
  if (dimension !== "comprendre") return true;
  return /\b(explique|justifie|appuie|cite|montre|commente|pourquoi|comment|donne un exemple|donne deux|dans tes mots)\b/.test(prompt);
}

function inferProofRequired(question) {
  if (typeof question.proofRequired === "boolean") return question.proofRequired;
  return true;
}

function explicitNumberOfElements(prompt = "") {
  const value = normalize(prompt);
  const digitMatch = value.match(/\b(?:donne|cite|nomme|indique|releve|presente)?\s*(?:au moins\s*)?([2-6])\s+(?:elements?|exemples?|raisons?|indices?|faits?|caracteristiques?|animaux|moyens|effets?|actions?|passages?)/);
  if (digitMatch) return Number(digitMatch[1]);

  for (const [word, number] of Object.entries(NUMBER_WORDS)) {
    const expression = new RegExp(`\\b(?:donne|cite|nomme|indique|releve|presente|quels sont|quelles sont)?\\s*(?:au moins\\s*)?${word}\\s+(?:elements?|exemples?|raisons?|indices?|faits?|caracteristiques?|animaux|moyens|effets?|actions?|passages?|gaz|couleurs?)\\b`);
    if (expression.test(value)) return number;
  }
  return 0;
}

function inferMinimumExpectedElements(question, dimension, justificationRequired) {
  const declared = Number(question.minimumExpectedElements || question.minElements || 0);
  if (Number.isInteger(declared) && declared > 0) return Math.min(declared, 8);

  const prompt = question.prompt || question.text || "";
  const explicit = explicitNumberOfElements(prompt);
  const value = normalize(prompt);
  const questionWordCount = (value.match(/\b(pourquoi|comment|combien|quand|qui|quoi|quel|quelle|quels|quelles)\b/g) || []).length;

  let baseline = 1;
  if (dimension === "inferer" || dimension === "interpreter" || dimension === "reagir") baseline = 2;
  if (dimension === "apprecier") baseline = 3;
  if (justificationRequired) baseline = Math.max(baseline, 2);
  if (questionWordCount >= 2 && /\bet\b/.test(value)) baseline = Math.max(baseline, 2);
  return Math.max(baseline, explicit);
}

function inferProofTool(question, dimension, questionType) {
  const declared = normalize(question.proofTypeSuggested || question.recommendedProofTool);
  if (["explicite", "inference", "reaction", "important"].includes(declared)) return declared;
  if (dimension === "inferer" || dimension === "interpreter" || questionType === "implicite") return "inference";
  if (dimension === "reagir" || dimension === "apprecier") return "reaction";
  return "explicite";
}

function validationProfile(dimension, proofRequired, justificationRequired, minimumExpectedElements) {
  const profiles = {
    comprendre: {
      shortInstruction: "Réponse directe + passage précis du texte.",
      checklist: ["Je réponds exactement à la question.", "Je choisis un passage court et pertinent du texte."]
    },
    inferer: {
      shortInstruction: "Déduction + indice du texte + lien expliqué.",
      checklist: ["Je formule ce que je déduis.", "Je choisis un indice du texte.", "J’explique le lien entre l’indice et ma déduction."]
    },
    interpreter: {
      shortInstruction: "Interprétation + indices + explication du sens.",
      checklist: ["Je formule mon interprétation.", "Je m’appuie sur un ou plusieurs indices.", "J’explique ce que ces indices permettent de comprendre."]
    },
    reagir: {
      shortInstruction: "Réaction personnelle + raison + lien avec le texte.",
      checklist: ["Je nomme clairement ma réaction.", "J’explique ma raison.", "Je relie ma réaction à un élément du texte."]
    },
    apprecier: {
      shortInstruction: "Opinion + critère précis + exemple du texte.",
      checklist: ["Je donne mon jugement ou mon appréciation.", "Je nomme un critère précis.", "J’ajoute un exemple du texte qui soutient ce critère."]
    }
  };
  const profile = profiles[dimension] || profiles.comprendre;
  const checklist = [...profile.checklist];
  if (proofRequired && !checklist.some((item) => /texte|indice|passage|exemple/.test(normalize(item)))) checklist.push("Je m’appuie sur le texte.");
  if (justificationRequired && !checklist.some((item) => /explique|raison|lien/.test(normalize(item)))) checklist.push("J’explique pourquoi mon appui soutient ma réponse.");
  checklist.push(`Je fournis au moins ${minimumExpectedElements} élément${minimumExpectedElements > 1 ? "s" : ""} attendu${minimumExpectedElements > 1 ? "s" : ""}.`);
  return { ...profile, checklist };
}

export function classifyQuestion(question = {}, { targetLevel = "6e" } = {}) {
  const prompt = String(question.prompt || question.text || "").trim();
  const dimension = inferDimension({ ...question, prompt });
  const questionType = inferQuestionType(dimension, question.questionType);
  const proofRequired = inferProofRequired(question);
  const justificationRequired = inferJustificationRequired({ ...question, prompt }, dimension);
  const minimumExpectedElements = inferMinimumExpectedElements({ ...question, prompt }, dimension, justificationRequired);
  const questionWord = detectQuestionWord(prompt);
  const level = normalizeQuestionLevel(question.targetLevel || targetLevel);
  const recommendedProofTool = inferProofTool(question, dimension, questionType);
  const profile = validationProfile(dimension, proofRequired, justificationRequired, minimumExpectedElements);

  return {
    classificationVersion: QUESTION_CLASSIFICATION_VERSION,
    questionWord,
    questionWordHelp: getQuestionWordHelp(questionWord),
    dimension,
    dimensionLabel: QUESTION_DIMENSIONS[dimension].label,
    questionType,
    questionTypeLabel: QUESTION_TYPES[questionType],
    proofRequired,
    justificationRequired,
    minimumExpectedElements,
    targetLevel: level,
    recommendedProofTool,
    validationProfile: profile
  };
}

export function normalizeQuestion(question = {}, options = {}) {
  const classification = classifyQuestion(question, options);
  return {
    ...question,
    prompt: String(question.prompt || question.text || "").trim(),
    ...classification
  };
}

export function normalizeExerciseQuestions(exercise = {}) {
  const targetLevel = normalizeQuestionLevel(exercise.level || exercise.targetLevel || "6e");
  return {
    ...exercise,
    questions: Array.isArray(exercise.questions)
      ? exercise.questions.map((question) => normalizeQuestion(question, { targetLevel }))
      : []
  };
}

export function buildQuestionBank(exercises = []) {
  return exercises.flatMap((exercise) => normalizeExerciseQuestions(exercise).questions.map((question, index) => ({
    exerciseId: exercise.id,
    exerciseTitle: exercise.title,
    order: index + 1,
    ...question
  })));
}

export function summarizeQuestionBank(exercises = []) {
  const bank = buildQuestionBank(exercises);
  const countBy = (field, values) => Object.fromEntries(values.map((value) => [value, bank.filter((question) => question[field] === value).length]));
  return {
    total: bank.length,
    byDimension: countBy("dimension", Object.keys(QUESTION_DIMENSIONS)),
    byType: countBy("questionType", Object.keys(QUESTION_TYPES)),
    byLevel: countBy("targetLevel", ["6e", "sec1", "sec2"]),
    proofRequired: bank.filter((question) => question.proofRequired).length,
    justificationRequired: bank.filter((question) => question.justificationRequired).length
  };
}

export function validateQuestionSchema(question = {}) {
  const normalizedQuestion = normalizeQuestion(question, { targetLevel: question.targetLevel });
  const errors = [];
  const warnings = [];
  if (!String(normalizedQuestion.id || "").trim()) errors.push("id manquant");
  if (!normalizedQuestion.prompt) errors.push("texte de la question manquant");
  if (!ALLOWED_DIMENSIONS.has(normalizedQuestion.dimension)) errors.push("dimension invalide");
  if (!ALLOWED_TYPES.has(normalizedQuestion.questionType)) errors.push("type de question invalide");
  if (!ALLOWED_LEVELS.has(normalizedQuestion.targetLevel)) errors.push("niveau cible invalide");
  if (!Number.isInteger(normalizedQuestion.minimumExpectedElements) || normalizedQuestion.minimumExpectedElements < 1) errors.push("nombre minimal d’éléments invalide");
  if (normalizedQuestion.proofRequired && !normalizedQuestion.recommendedProofTool) warnings.push("outil de preuve non défini");
  return { valid: errors.length === 0, errors, warnings, question: normalizedQuestion };
}
