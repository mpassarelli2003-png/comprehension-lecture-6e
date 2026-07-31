import {
  QUESTION_DIMENSIONS,
  classifyQuestion as classifyQuestionModel,
  detectQuestionWord as detectStructuredQuestionWord,
  getQuestionWordHelp as getStructuredQuestionWordHelp,
  normalizeQuestionLevel
} from "./questionClassification";

export const READING_STRATEGY_STORAGE_KEY = "lecture_guided_strategy_v1";

const PROOF_TOOL_LABELS = {
  explicite: "Information explicite",
  inference: "Indice pour inférence",
  reaction: "Exemple pour réagir ou apprécier",
  important: "Idée importante"
};

const LEVEL_LABELS = {
  "6e": "6e année",
  sec1: "Secondaire 1",
  sec2: "Secondaire 2"
};

const LEVEL_DEPTH = {
  "6e": {
    understand: "Dis avec tes mots ce que la question te demande.",
    find: "Relis le texte et choisis une phrase ou un détail utile.",
    respond: "Reprends les mots de la question, réponds, puis ajoute ton passage du texte."
  },
  sec1: {
    understand: "Reformule la question et repère le type de réponse attendu.",
    find: "Choisis un passage précis et vérifie qu’il répond réellement à la question.",
    respond: "Formule une idée complète, ajoute une preuve et explique brièvement le lien."
  },
  sec2: {
    understand: "Détermine le raisonnement attendu et les nuances importantes de la consigne.",
    find: "Sélectionne un indice pertinent, puis évalue sa force comme preuve.",
    respond: "Présente une réponse précise, intègre la preuve et explicite le lien logique."
  }
};

const DIMENSION_GUIDANCE = {
  comprendre: {
    understand: "Je repère l’information exacte demandée.",
    find: "Je cherche l’endroit où le texte donne cette information.",
    respond: "Je réponds directement avec une phrase complète et un appui du texte.",
    starter: "Dans le texte, on apprend que..."
  },
  inferer: {
    understand: "Je cherche ce que le texte me fait comprendre sans le dire mot pour mot.",
    find: "Je réunis un ou plusieurs indices du texte.",
    respond: "Je formule ma déduction et j’explique comment les indices la soutiennent.",
    starter: "Je comprends que... parce qu’un indice du texte montre que..."
  },
  interpreter: {
    understand: "Je repère le sens, le message ou l’intention que je dois expliquer.",
    find: "Je choisis les indices qui éclairent ce sens ou ce message.",
    respond: "Je formule mon interprétation et j’explique le lien avec les indices.",
    starter: "Selon moi, cela signifie que... Un indice du texte montre que..."
  },
  reagir: {
    understand: "Je précise la réaction personnelle demandée.",
    find: "Je choisis un passage qui explique ce qui provoque ma réaction.",
    respond: "Je nomme ma réaction, je l’explique et je la relie au texte.",
    starter: "Je réagis... parce que... Dans le texte..."
  },
  apprecier: {
    understand: "Je repère ce que je dois évaluer, choisir ou juger.",
    find: "Je choisis un exemple du texte qui soutient mon critère ou mon opinion.",
    respond: "Je donne mon jugement, je nomme mon critère et je l’appuie avec le texte.",
    starter: "Selon moi... parce que... Un élément du texte montre que..."
  }
};

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectStrategyLevel(label = "") {
  return normalizeQuestionLevel(label);
}

export function detectStrategyMode(label = "") {
  return normalize(label).includes("simulation") ? "simulation" : "training";
}

export function detectQuestionWord(prompt = "") {
  return detectStructuredQuestionWord(prompt);
}

export function getQuestionWordHelp(word = "quoi") {
  return getStructuredQuestionWordHelp(word);
}

export function classifyQuestion(question = {}) {
  const classification = classifyQuestionModel(question, { targetLevel: question.levelId || question.targetLevel || "6e" });
  const guidance = DIMENSION_GUIDANCE[classification.dimension] || DIMENSION_GUIDANCE.comprendre;
  return {
    id: classification.dimension,
    label: classification.dimensionLabel,
    colorClass: QUESTION_DIMENSIONS[classification.dimension]?.colorClass || "strategyUnderstand",
    nature: classification.questionTypeLabel,
    proofTool: classification.recommendedProofTool,
    ...guidance,
    classification
  };
}

export function questionNeedsJustification(question = {}) {
  return classifyQuestionModel(question, { targetLevel: question.levelId || question.targetLevel || "6e" }).justificationRequired;
}

export function buildReadingStrategy({
  question = null,
  prompt = "",
  type = "",
  proofTypeSuggested = "",
  points = 1,
  dimension = "",
  questionType = "",
  proofRequired,
  justificationRequired,
  minimumExpectedElements,
  levelId = "6e",
  modeId = "training"
} = {}) {
  const safeLevel = LEVEL_DEPTH[levelId] ? levelId : "6e";
  const source = {
    ...(question || {}),
    prompt: question?.prompt || prompt,
    type: question?.type || type,
    proofTypeSuggested: question?.proofTypeSuggested || proofTypeSuggested,
    points: question?.points || points,
    dimension: question?.dimension || dimension,
    questionType: question?.questionType || questionType,
    proofRequired: typeof question?.proofRequired === "boolean" ? question.proofRequired : proofRequired,
    justificationRequired: typeof question?.justificationRequired === "boolean" ? question.justificationRequired : justificationRequired,
    minimumExpectedElements: question?.minimumExpectedElements || minimumExpectedElements,
    targetLevel: question?.targetLevel || safeLevel
  };
  const classification = classifyQuestionModel(source, { targetLevel: safeLevel });
  const displayDimension = classifyQuestion(source);
  const procedureOnly = modeId === "simulation";

  const simulationPhases = {
    understand: {
      title: "Comprendre",
      short: "Je relis la question et je repère ce qu’elle demande.",
      details: ["J’encercle mentalement les mots importants.", "Je détermine la forme de réponse attendue."]
    },
    find: {
      title: "Trouver",
      short: classification.proofRequired ? "Je retourne au texte et je choisis un passage utile." : "Je retourne au texte pour vérifier ma compréhension.",
      details: ["Je vérifie que le passage répond à la question.", classification.proofRequired ? "Je garde au moins un appui du texte." : "Je conserve une note seulement si elle est utile."]
    },
    respond: {
      title: "Répondre",
      short: "Je réponds avec mes mots et je respecte toutes les parties de la consigne.",
      details: ["Je réponds à toute la question.", "Je relis ma réponse avant de continuer."]
    }
  };

  const trainingPhases = {
    understand: {
      title: "Comprendre",
      short: displayDimension.understand,
      details: [
        LEVEL_DEPTH[safeLevel].understand,
        `Mot-question : « ${classification.questionWord} ». ${classification.questionWordHelp}`,
        `La question attend au moins ${classification.minimumExpectedElements} élément${classification.minimumExpectedElements > 1 ? "s" : ""}.`
      ]
    },
    find: {
      title: "Trouver",
      short: displayDimension.find,
      details: [
        LEVEL_DEPTH[safeLevel].find,
        classification.proofRequired
          ? "Je surligne ou j’enregistre au moins un passage avant de continuer."
          : "Je peux enregistrer un passage utile, mais la preuve n’est pas obligatoire."
      ]
    },
    respond: {
      title: "Répondre",
      short: displayDimension.respond,
      details: [
        LEVEL_DEPTH[safeLevel].respond,
        classification.justificationRequired
          ? "Je dois expliquer le lien entre ma réponse et le passage choisi."
          : "Je vérifie que ma phrase répond exactement à la question."
      ]
    }
  };

  const checklist = [
    ...classification.validationProfile.checklist,
    "Ma réponse est une phrase complète et compréhensible."
  ].filter((item, index, array) => array.indexOf(item) === index);

  return {
    levelId: safeLevel,
    levelLabel: LEVEL_LABELS[safeLevel],
    modeId,
    procedureOnly,
    dimension: displayDimension,
    classification,
    questionWord: classification.questionWord,
    questionWordHelp: classification.questionWordHelp,
    questionType: classification.questionType,
    questionTypeLabel: classification.questionTypeLabel,
    needsEvidence: classification.proofRequired,
    needsJustification: classification.justificationRequired,
    minimumExpectedElements: classification.minimumExpectedElements,
    recommendedProofTool: classification.recommendedProofTool,
    recommendedProofLabel: PROOF_TOOL_LABELS[classification.recommendedProofTool] || "Passage utile",
    responseStarter: displayDimension.starter,
    phases: procedureOnly ? simulationPhases : trainingPhases,
    checklist
  };
}

export function phaseForStep(step) {
  if (Number(step) === 4) return "find";
  if (Number(step) >= 5) return "respond";
  return "understand";
}

export function shouldBlockForEvidence({ action = "", currentStep = 0, targetStep = 0, evidenceSaved = false, needsEvidence = true } = {}) {
  if (!needsEvidence || evidenceSaved) return false;
  if (action === "next-question") return true;
  return action === "step" && Number(targetStep) >= 5 && Number(targetStep) > Number(currentStep);
}

export function countEvidenceForExercise(records = {}, { exerciseTitle = "", levelId = "6e", modeId = "training" } = {}) {
  const prefix = `${exerciseTitle}|Question`;
  const suffix = `|${levelId}|${modeId}`;
  return Object.entries(records).filter(([key, value]) => key.startsWith(prefix) && key.endsWith(suffix) && value?.evidenceSaved).length;
}

export function countEvidenceInStudentWork(work = {}, { exerciseId = "", modeId = "" } = {}) {
  const candidate = work && typeof work === "object" ? work : {};
  if (exerciseId && candidate.exerciseId && candidate.exerciseId !== exerciseId) return 0;
  if (modeId && candidate.learningMode && candidate.learningMode !== modeId) return 0;
  const ids = new Set((Array.isArray(candidate.proofs) ? candidate.proofs : [])
    .filter((proof) => String(proof?.text || "").trim())
    .map((proof) => proof?.questionId)
    .filter(Boolean));
  return ids.size;
}

export function hasEvidenceForQuestion(work = {}, { exerciseId = "", modeId = "", questionId = "" } = {}) {
  const candidate = work && typeof work === "object" ? work : {};
  if (!questionId) return false;
  if (exerciseId && candidate.exerciseId && candidate.exerciseId !== exerciseId) return false;
  if (modeId && candidate.learningMode && candidate.learningMode !== modeId) return false;
  return (Array.isArray(candidate.proofs) ? candidate.proofs : []).some((proof) => proof?.questionId === questionId && String(proof?.text || "").trim());
}

export function missingEvidenceCount(totalQuestions = 0, evidenceCount = 0) {
  return Math.max(0, Number(totalQuestions || 0) - Number(evidenceCount || 0));
}

export function makeStrategyKey({ exerciseTitle = "Lecture", questionNumber = "Question", prompt = "", levelId = "6e", modeId = "training" } = {}) {
  return [exerciseTitle, questionNumber, prompt, levelId, modeId].join("|");
}
