export const READING_STRATEGY_STORAGE_KEY = "lecture_guided_strategy_v1";

const QUESTION_WORDS = [
  ["pourquoi", "Je cherche une raison, une cause ou une intention."],
  ["comment", "Je cherche une manière, des étapes, un changement ou une explication."],
  ["combien", "Je cherche un nombre, une quantité ou une durée."],
  ["quand", "Je cherche un moment, une date, une saison ou une époque."],
  ["où", "Je cherche un lieu ou un endroit."],
  ["qui", "Je cherche une personne, un personnage ou un animal."],
  ["quel", "Je cherche un élément précis parmi plusieurs possibilités."],
  ["quoi", "Je cherche une action, une idée, un objet ou une information précise."]
];

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

const DIMENSIONS = {
  comprendre: {
    id: "comprendre",
    label: "Comprendre",
    colorClass: "strategyUnderstand",
    proofTool: "explicite",
    understand: "Je repère l’information exacte demandée.",
    find: "Je cherche l’endroit où le texte donne cette information.",
    respond: "Je réponds directement avec une phrase complète et un appui du texte.",
    starter: "Dans le texte, on apprend que..."
  },
  inferer: {
    id: "inferer",
    label: "Inférer ou interpréter",
    colorClass: "strategyInfer",
    proofTool: "inference",
    understand: "Je cherche ce que le texte me fait comprendre sans le dire mot pour mot.",
    find: "Je réunis un ou plusieurs indices du texte.",
    respond: "Je formule mon interprétation et j’explique comment les indices la soutiennent.",
    starter: "Je comprends que... parce qu’un indice du texte montre que..."
  },
  reagir: {
    id: "reagir",
    label: "Réagir",
    colorClass: "strategyReact",
    proofTool: "reaction",
    understand: "Je précise la réaction personnelle demandée.",
    find: "Je choisis un passage qui explique ce qui provoque ma réaction.",
    respond: "Je nomme ma réaction, je l’explique et je la relie au texte.",
    starter: "Je réagis... parce que... Dans le texte..."
  },
  apprecier: {
    id: "apprecier",
    label: "Apprécier ou porter un jugement",
    colorClass: "strategyAppreciate",
    proofTool: "reaction",
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
  const value = normalize(label);
  if (value.includes("secondaire 2") || value.includes("sec 2")) return "sec2";
  if (value.includes("secondaire 1") || value.includes("sec 1")) return "sec1";
  return "6e";
}

export function detectStrategyMode(label = "") {
  return normalize(label).includes("simulation") ? "simulation" : "training";
}

export function detectQuestionWord(prompt = "") {
  const value = normalize(prompt);
  for (const [word] of QUESTION_WORDS) {
    if (value.includes(normalize(word))) return word;
  }
  if (/\b(quels?|quelles?|lequel|laquelle|lesquels|lesquelles)\b/.test(value)) return "quel";
  if (/\b(que|qu est ce|quoi)\b/.test(value)) return "quoi";
  return "quoi";
}

export function getQuestionWordHelp(word = "quoi") {
  return QUESTION_WORDS.find(([candidate]) => candidate === word)?.[1] || QUESTION_WORDS.at(-1)[1];
}

export function classifyQuestion({ type = "", proofTypeSuggested = "", prompt = "" } = {}) {
  const normalizedType = normalize(type);
  const normalizedProof = normalize(proofTypeSuggested);
  const normalizedPrompt = normalize(prompt);

  if (normalizedType.includes("reagir") || normalizedType.includes("reaction")) {
    return { ...DIMENSIONS.reagir, nature: "Question de réaction personnelle" };
  }
  if (normalizedType.includes("apprecier") || normalizedType.includes("jugement") || normalizedType.includes("critique")) {
    return { ...DIMENSIONS.apprecier, nature: "Question d’appréciation ou de jugement" };
  }
  if (normalizedType.includes("interpret") || normalizedType.includes("infer") || normalizedProof.includes("inference")) {
    return { ...DIMENSIONS.inferer, nature: "Question implicite : indices + déduction" };
  }

  const implicitPrompt = /selon toi|que peut on comprendre|que laisse entendre|montre que|suggere|explique pourquoi/.test(normalizedPrompt);
  if (implicitPrompt && !normalizedProof.includes("explicite")) {
    return { ...DIMENSIONS.inferer, nature: "Question implicite : indices + déduction" };
  }

  return {
    ...DIMENSIONS.comprendre,
    nature: normalizedProof.includes("important") ? "Question de compréhension globale" : "Question explicite : réponse dans le texte",
    proofTool: normalizedProof.includes("important") ? "important" : "explicite"
  };
}

export function questionNeedsJustification({ type = "", prompt = "", points = 1 } = {}) {
  const normalizedType = normalize(type);
  const normalizedPrompt = normalize(prompt);
  return Number(points || 1) >= 2
    || /explique|justifie|appuie|cite|montre|commente|pourquoi|comment|selon toi/.test(normalizedPrompt)
    || /interpret|infer|reagir|reaction|apprecier|jugement/.test(normalizedType);
}

export function buildReadingStrategy({
  prompt = "",
  type = "",
  proofTypeSuggested = "",
  points = 1,
  levelId = "6e",
  modeId = "training"
} = {}) {
  const safeLevel = LEVEL_DEPTH[levelId] ? levelId : "6e";
  const dimension = classifyQuestion({ type, proofTypeSuggested, prompt });
  const questionWord = detectQuestionWord(prompt);
  const needsJustification = questionNeedsJustification({ type, prompt, points });
  const procedureOnly = modeId === "simulation";

  const simulationPhases = {
    understand: {
      title: "Comprendre",
      short: "Je relis la question et je repère ce qu’elle demande.",
      details: ["J’encercle mentalement les mots importants.", "Je détermine la forme de réponse attendue."]
    },
    find: {
      title: "Trouver",
      short: "Je retourne au texte et je choisis un passage utile.",
      details: ["Je vérifie que le passage répond à la question.", "Je garde au moins un appui du texte."]
    },
    respond: {
      title: "Répondre",
      short: "Je réponds avec mes mots et je justifie avec le texte.",
      details: ["Je réponds à toute la question.", "Je relis ma réponse avant de continuer."]
    }
  };

  const trainingPhases = {
    understand: {
      title: "Comprendre",
      short: dimension.understand,
      details: [LEVEL_DEPTH[safeLevel].understand, `Mot-question : « ${questionWord} ». ${getQuestionWordHelp(questionWord)}`]
    },
    find: {
      title: "Trouver",
      short: dimension.find,
      details: [LEVEL_DEPTH[safeLevel].find, "Je surligne ou j’enregistre au moins un passage avant de continuer."]
    },
    respond: {
      title: "Répondre",
      short: dimension.respond,
      details: [LEVEL_DEPTH[safeLevel].respond, needsJustification ? "Je dois expliquer le lien entre ma réponse et le passage choisi." : "Je vérifie que ma phrase répond exactement à la question."]
    }
  };

  const checklist = [
    "J’ai répondu à ce qui est demandé.",
    "J’ai repris des mots importants de la question.",
    "J’ai utilisé au moins un passage ou un indice du texte.",
    ...(needsJustification ? ["J’ai expliqué pourquoi ce passage soutient ma réponse."] : []),
    "Ma réponse est une phrase complète et compréhensible."
  ];

  return {
    levelId: safeLevel,
    levelLabel: LEVEL_LABELS[safeLevel],
    modeId,
    procedureOnly,
    dimension,
    questionWord,
    questionWordHelp: getQuestionWordHelp(questionWord),
    needsEvidence: true,
    needsJustification,
    recommendedProofTool: dimension.proofTool,
    recommendedProofLabel: PROOF_TOOL_LABELS[dimension.proofTool] || "Passage utile",
    responseStarter: dimension.starter,
    phases: procedureOnly ? simulationPhases : trainingPhases,
    checklist
  };
}

export function phaseForStep(step) {
  if (Number(step) === 4) return "find";
  if (Number(step) >= 5) return "respond";
  return "understand";
}

export function makeStrategyKey({ exerciseTitle = "Lecture", questionNumber = "Question", prompt = "", levelId = "6e", modeId = "training" } = {}) {
  return [exerciseTitle, questionNumber, prompt, levelId, modeId].join("|");
}
