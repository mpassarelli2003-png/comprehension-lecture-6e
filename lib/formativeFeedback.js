import {
  QUESTION_DIMENSIONS,
  normalizeExerciseQuestions,
  normalizeQuestion
} from "./questionClassification.js";

export const FORMATIVE_FEEDBACK_VERSION = "1.1";

export const FORMATIVE_MESSAGE_PREVIEW = {
  comprendre: {
    missing: "Commence par repérer l’information dans le texte.",
    partial: "Ta réponse donne une idée, mais il manque un appui précis du texte.",
    acceptable: "Ta réponse reprend l’information demandée et s’appuie sur le texte."
  },
  inferer: {
    missing: "Formule d’abord ce que tu déduis.",
    partial: "Ton idée est possible, mais il manque l’indice du texte qui t’a permis de la déduire.",
    acceptable: "Ta réponse fait un lien entre ton idée et un indice du texte."
  },
  interpreter: {
    missing: "Propose une interprétation fidèle au texte.",
    partial: "Ton interprétation doit être soutenue par au moins un élément du texte.",
    acceptable: "Ton interprétation est plausible et reliée au texte."
  },
  reagir: {
    missing: "Nomme ce que tu penses ou ressens.",
    partial: "Tu donnes ton opinion. Ajoute maintenant un lien avec le texte.",
    acceptable: "Ta réaction personnelle est liée à un élément du texte."
  },
  apprecier: {
    missing: "Donne ton opinion sur le texte.",
    partial: "Tu dis ton opinion, mais il manque un critère précis.",
    acceptable: "Ton appréciation contient une opinion, un critère et un exemple du texte."
  }
};

export const FINAL_READING_CHECKLIST = [
  {
    group: "Compréhension",
    items: ["Je réponds à la question.", "Je repère l’information ou les indices utiles."]
  },
  {
    group: "Preuve",
    items: ["J’ajoute un appui du texte quand c’est demandé."]
  },
  {
    group: "Justification",
    items: ["J’explique mon idée."]
  },
  {
    group: "Réaction ou appréciation",
    items: ["Je donne mon opinion.", "Je fais un lien avec le texte.", "J’utilise un critère quand je dois apprécier."]
  },
  {
    group: "Forme",
    items: ["Ma phrase est claire.", "J’ai relu ma réponse."]
  }
];

const APPRECIATION_CRITERIA = {
  personnage: ["personnage", "personnages", "heros", "heroine"],
  intrigue: ["intrigue", "action", "evenements", "histoire"],
  informations: ["information", "informations", "faits", "explications"],
  images: ["image", "images", "illustration", "illustrations"],
  vocabulaire: ["vocabulaire", "mots", "langage", "expressions"],
  passage: ["passage", "scene", "paragraphe", "moment"],
  theme: ["theme", "sujet"],
  message: ["message", "lecon", "valeur"],
  structure: ["structure", "organisation", "debut", "fin", "conclusion"]
};

const LEVEL_RULES = {
  "6e": { strongWords: 6, label: "6e année" },
  sec1: { strongWords: 10, label: "Secondaire 1" },
  sec2: { strongWords: 14, label: "Secondaire 2" }
};

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\n;:.-]/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function words(value = "") {
  const text = normalize(value).replace(/[\n;:.-]+/g, " ");
  return text ? text.split(/\s+/).filter(Boolean) : [];
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function hasAny(value, patterns) {
  const text = normalize(value);
  return patterns.some((pattern) => pattern.test(text));
}

function hasPersonalPosition(answer = "") {
  return hasAny(answer, [
    /\bje\b/, /\bj ai\b/, /\bj aime\b/, /\bselon moi\b/, /\ba mon avis\b/,
    /\bje pense\b/, /\bje trouve\b/, /\bje ressens\b/, /\bje me sens\b/,
    /\bje prefere\b/, /\bmon opinion\b/, /\bma reaction\b/
  ]);
}

function hasOpinion(answer = "") {
  return hasAny(answer, [
    /\bj aime\b/, /\bj ai aime\b/, /\bje n aime pas\b/, /\bje prefere\b/,
    /\bselon moi\b/, /\ba mon avis\b/, /\bje pense\b/, /\bje trouve\b/,
    /\bje recommande\b/, /\bje conseille\b/, /\bc est (?:interessant|captivant|utile|clair|emouvant|convaincant|reussi)\b/
  ]);
}

function hasJustificationLanguage(answer = "") {
  return hasAny(answer, [
    /\bparce que\b/, /\bcar\b/, /\bpuisque\b/, /\bdonc\b/, /\bainsi\b/,
    /\bc est pourquoi\b/, /\ben raison de\b/, /\bgrace a\b/, /\bce qui montre\b/,
    /\bcela montre\b/, /\bcela signifie\b/, /\bce passage montre\b/,
    /\bun indice montre\b/, /\bje comprends que\b/
  ]);
}

function hasTextLinkLanguage(answer = "") {
  return hasAny(answer, [
    /\bdans le texte\b/, /\ble texte\b/, /\ble passage\b/, /\bun passage\b/,
    /\bun indice\b/, /\bun element\b/, /\bun exemple\b/, /\ble personnage\b/,
    /\bl auteur\b/, /\bon apprend que\b/, /\bon voit que\b/, /\bcela se voit\b/
  ]);
}

function detectCriterion(answer = "") {
  const text = normalize(answer);
  for (const [criterion, terms] of Object.entries(APPRECIATION_CRITERIA)) {
    if (terms.some((term) => new RegExp(`\\b${term}\\b`).test(text))) return criterion;
  }
  return "";
}

function normalizeEvidence(evidence, context = {}, questionId = "") {
  let proofs = [];
  let exerciseId = "";
  let modeId = "";

  if (Array.isArray(evidence)) {
    proofs = evidence;
  } else if (typeof evidence === "string") {
    proofs = [{ text: evidence, questionId }];
  } else if (evidence && typeof evidence === "object") {
    proofs = Array.isArray(evidence.proofs)
      ? evidence.proofs
      : Array.isArray(evidence.items)
        ? evidence.items
        : evidence.text
          ? [evidence]
          : [];
    exerciseId = String(evidence.exerciseId || evidence.workExerciseId || "");
    modeId = String(evidence.modeId || evidence.learningMode || "");
  }

  const expectedExercise = String(context.exerciseId || "");
  const expectedMode = String(context.modeId || "");
  const scoped = context.allowUnscopedEvidence === true
    || (Boolean(expectedExercise) && Boolean(expectedMode) && exerciseId === expectedExercise && modeId === expectedMode);

  if (!scoped) {
    return { valid: [], rejected: proofs, hasEvidence: false, vague: false, reason: "scope" };
  }

  const valid = [];
  const rejected = [];
  for (const proof of proofs) {
    const text = String(proof?.text || "").trim();
    const sameQuestion = Boolean(questionId) && String(proof?.questionId || "") === String(questionId);
    const sameExercise = !proof?.exerciseId || String(proof.exerciseId) === expectedExercise;
    const sameMode = !proof?.modeId || String(proof.modeId) === expectedMode;
    if (text && sameQuestion && sameExercise && sameMode) valid.push({ ...proof, text });
    else rejected.push(proof);
  }

  const vague = valid.length > 0 && valid.every((proof) => words(proof.text).length < 3 || proof.text.length < 12);
  return { valid, rejected, hasEvidence: valid.length > 0, vague, reason: valid.length ? "" : "missing" };
}

export function estimateAnswerElements(answer = "") {
  const raw = String(answer || "").trim();
  if (!raw) return { count: 0, confidence: "high", signals: [] };

  const strongSegments = raw
    .split(/\n+|;|(?:^|\s)(?:[-•]|\d+[.)])\s+/m)
    .map((item) => item.trim())
    .filter((item) => words(item).length >= 2);
  if (strongSegments.length >= 2) {
    return { count: Math.min(strongSegments.length, 8), confidence: "high", signals: ["liste ou séparateurs clairs"] };
  }

  const text = normalize(raw).replace(/\n/g, " ");
  const connectorMatches = text.match(/\b(premierement|deuxiemement|troisiemement|d abord|ensuite|aussi|de plus|puis|finalement|enfin)\b/g) || [];
  if (connectorMatches.length) {
    return { count: Math.min(1 + unique(connectorMatches).length, 8), confidence: "medium", signals: ["connecteurs d’énumération"] };
  }

  const andMatch = text.match(/^(.{4,})\bet\b(.{4,})$/);
  if (andMatch && words(andMatch[1]).length >= 2 && words(andMatch[2]).length >= 2) {
    return { count: 2, confidence: "medium", signals: ["deux groupes reliés par et"] };
  }

  return { count: 1, confidence: "low", signals: ["un seul élément clairement repérable"] };
}

function simulationMessage(code, question) {
  const messages = {
    answer: "Vérifie que ta réponse répond directement à la question.",
    evidence: "Vérifie que tu as ajouté un appui du texte.",
    evidencePrecision: "Vérifie que ton appui du texte est assez précis.",
    justification: "Vérifie que tu as expliqué le lien entre ton idée et le texte.",
    textLink: "Vérifie que ton idée personnelle est reliée au texte.",
    personal: "Vérifie que ta réponse contient ta réaction ou ton opinion personnelle.",
    criterion: "Vérifie que ton appréciation contient un critère précis.",
    elements: `Vérifie que ta réponse contient ${question.minimumExpectedElements} éléments distincts.`,
    allParts: "Vérifie que ta réponse répond à toutes les parties de la question."
  };
  return messages[code] || messages.answer;
}

function trainingNextStep(code, levelId, question) {
  const steps = {
    "6e": {
      answer: "Écris une phrase courte qui répond directement à la question.",
      evidence: "Ajoute un appui du texte. Tu peux commencer par : « Dans le texte, je vois que… »",
      evidencePrecision: "Choisis un passage plus précis du texte.",
      justification: "Ajoute une phrase qui explique pourquoi ton appui soutient ton idée.",
      textLink: "Ajoute un lien clair avec ce qui se passe dans le texte.",
      personal: "Ajoute ce que toi tu penses ou ressens.",
      criterion: "Nomme un critère précis, par exemple le personnage, le message ou le passage.",
      elements: `Ajoute l’élément manquant pour en avoir ${question.minimumExpectedElements}.`,
      allParts: "Relis la question et réponds à sa deuxième partie."
    },
    sec1: {
      answer: "Formule une réponse complète et précise.",
      evidence: "Ajoute un indice précis du texte et relie-le à ton idée.",
      evidencePrecision: "Remplace l’appui vague par un passage plus précis.",
      justification: "Explique clairement le lien entre ton idée et l’appui choisi.",
      textLink: "Relie clairement ta position à un élément du texte.",
      personal: "Ajoute ta position personnelle, puis relie-la au texte.",
      criterion: "Précise le critère sur lequel repose ton appréciation.",
      elements: `Distingue clairement les ${question.minimumExpectedElements} éléments demandés.`,
      allParts: "Complète la partie de la question qui n’est pas encore traitée."
    },
    sec2: {
      answer: "Précise ton idée afin qu’elle réponde exactement à la consigne.",
      evidence: "Ajoute l’indice du texte qui rend ton raisonnement convaincant.",
      evidencePrecision: "Sélectionne un appui plus précis et plus pertinent.",
      justification: "Explicite le lien logique entre ton idée et la preuve retenue.",
      textLink: "Rends explicite le lien entre ta position et le texte.",
      personal: "Formule ta position, puis justifie-la en restant fidèle au texte.",
      criterion: "Nomme et applique un critère d’appréciation précis.",
      elements: `Organise les ${question.minimumExpectedElements} éléments demandés de façon distincte et cohérente.`,
      allParts: "Vérifie la cohérence de ta réponse avec chacune des parties de la consigne."
    }
  };
  return (steps[levelId] || steps["6e"])[code] || steps[levelId]?.answer || steps["6e"].answer;
}

function diagnosticMessage(code, question, facts) {
  if (code === "answer") return FORMATIVE_MESSAGE_PREVIEW[question.dimension]?.missing || "Commence ta réponse.";
  if (code === "evidencePrecision") return "Ton appui est présent, mais il doit être plus précis.";
  if (code === "elements") {
    if (facts.elements.count === 1 && question.minimumExpectedElements === 2) return "Tu as trouvé un élément. Il en manque un deuxième.";
    return `Vérifie que ta réponse contient ${question.minimumExpectedElements} éléments distincts.`;
  }
  if (code === "criterion") {
    return facts.opinion ? "Tu dis ton opinion, mais il manque un critère précis." : "Ajoute un critère précis à ton appréciation.";
  }
  if (code === "personal") {
    if (question.dimension === "reagir" && facts.evidenceState.hasEvidence) return "Tu as nommé un élément du texte. Ajoute ce que toi tu penses ou ressens.";
    return question.dimension === "apprecier" ? "Donne clairement ton opinion." : "Ajoute ce que toi tu penses ou ressens.";
  }
  if (code === "textLink") {
    return question.dimension === "interpreter"
      ? "Ton idée est personnelle. Ajoute un lien clair avec ce qui se passe dans le texte."
      : "Tu donnes ton opinion. Ajoute maintenant un lien avec le texte.";
  }
  if (code === "evidence") {
    if (question.dimension === "inferer") return "Ton idée est possible, mais il manque l’indice du texte qui t’a permis de la déduire.";
    if (question.dimension === "interpreter") return "Ton interprétation doit être soutenue par au moins un élément du texte.";
    if (question.dimension === "reagir") return "Tu donnes ton opinion. Ajoute maintenant un lien avec le texte.";
    if (question.dimension === "apprecier" && facts.criterion) return "Tu as un critère. Ajoute un exemple du texte.";
    return "Ta réponse donne une idée, mais il manque un appui précis du texte.";
  }
  if (code === "justification") {
    if ((question.dimension === "inferer" || question.dimension === "interpreter") && facts.evidenceState.hasEvidence) {
      return "Tu as trouvé un indice. Explique maintenant ce qu’il te fait comprendre.";
    }
    return "Ton idée est présente. Explique maintenant le lien avec le texte.";
  }
  return trainingNextStep(code, facts.levelId, question);
}

function addCriterion(list, id, label, status, message) {
  list.push({ id, label, status, message });
}

function orderMissing(codes, dimension) {
  const priorities = {
    comprendre: ["answer", "evidence", "evidencePrecision", "justification", "elements"],
    inferer: ["answer", "evidence", "evidencePrecision", "justification", "elements"],
    interpreter: ["answer", "evidence", "evidencePrecision", "textLink", "justification", "elements"],
    reagir: ["answer", "personal", "evidence", "textLink", "justification", "elements"],
    apprecier: ["answer", "personal", "criterion", "evidence", "evidencePrecision", "justification", "elements"]
  };
  const order = priorities[dimension] || priorities.comprendre;
  return unique(codes).sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
}

export function evaluateReadingAnswer(questionInput = {}, answer = "", evidence = {}, context = {}) {
  const question = normalizeQuestion(questionInput, { targetLevel: context.levelId || questionInput.targetLevel });
  const levelId = LEVEL_RULES[context.levelId] ? context.levelId : question.targetLevel;
  const modeId = context.modeId === "simulation" ? "simulation" : "training";
  const answerText = String(answer || "").trim();
  const answerWords = words(answerText).length;
  const evidenceState = normalizeEvidence(evidence, { ...context, modeId }, question.id);
  const elements = estimateAnswerElements(answerText);
  const personal = hasPersonalPosition(answerText);
  const opinion = hasOpinion(answerText);
  const criterion = detectCriterion(answerText);
  const justificationLanguage = hasJustificationLanguage(answerText);
  const textLinkLanguage = hasTextLinkLanguage(answerText);
  const hasExplainedLink = justificationLanguage || (textLinkLanguage && answerWords >= 7);

  const missing = [];
  const strengths = [];
  const criteria = [];

  if (!answerText) {
    missing.push("answer");
    addCriterion(criteria, "answer", "Réponse à la question", "missing", "Aucune réponse n’est encore écrite.");
  } else {
    strengths.push("Une réponse est commencée.");
    addCriterion(criteria, "answer", "Réponse à la question", "met", "Une idée est formulée.");
  }

  if (question.proofRequired) {
    if (!evidenceState.hasEvidence) {
      missing.push("evidence");
      addCriterion(criteria, "evidence", "Appui du texte", "missing", "Aucun appui valide du travail actuel n’est enregistré.");
    } else if (evidenceState.vague) {
      missing.push("evidencePrecision");
      strengths.push("Un appui du texte est enregistré.");
      addCriterion(criteria, "evidence", "Appui du texte", "partial", "L’appui est présent, mais il reste vague.");
    } else {
      strengths.push("Un appui précis du texte est présent.");
      addCriterion(criteria, "evidence", "Appui du texte", "met", "Un appui valide du travail actuel est enregistré.");
    }
  } else {
    addCriterion(criteria, "evidence", "Appui du texte", "optional", "L’appui du texte est facultatif pour cette question.");
  }

  if (question.justificationRequired) {
    if (!answerText || !hasExplainedLink) {
      missing.push("justification");
      addCriterion(criteria, "justification", "Justification", "missing", "Le lien entre l’idée et l’appui n’est pas encore expliqué.");
    } else {
      strengths.push("Le lien avec l’idée est expliqué.");
      addCriterion(criteria, "justification", "Justification", "met", "Une explication relie l’idée à l’appui.");
    }
  } else {
    addCriterion(criteria, "justification", "Justification", "optional", "Une justification développée n’est pas obligatoire.");
  }

  if (question.dimension === "inferer") {
    if (answerText && !evidenceState.hasEvidence) strengths.push("Ton idée constitue une déduction possible.");
    else if (evidenceState.hasEvidence && !hasExplainedLink) strengths.push("Tu as trouvé un indice du texte.");
    else if (answerText && evidenceState.hasEvidence && hasExplainedLink) strengths.push("Ta déduction est reliée à un indice du texte.");
  }

  if (question.dimension === "interpreter") {
    if (personal && !evidenceState.hasEvidence && !textLinkLanguage) {
      missing.push("textLink");
      addCriterion(criteria, "interpretation", "Fidélité au texte", "partial", "L’idée est personnelle, mais le lien avec le texte n’est pas visible.");
    } else if (answerText && evidenceState.hasEvidence) {
      strengths.push("Une interprétation est reliée au texte.");
      addCriterion(criteria, "interpretation", "Fidélité au texte", "met", "L’interprétation s’appuie sur le texte.");
    }
  }

  if (question.dimension === "reagir") {
    if (!personal) {
      missing.push("personal");
      addCriterion(criteria, "personal", "Réaction personnelle", "missing", "La réaction ou l’opinion personnelle n’est pas encore formulée.");
    } else {
      strengths.push("Ta réaction personnelle est formulée.");
      addCriterion(criteria, "personal", "Réaction personnelle", "met", "Une position personnelle est présente.");
    }
    if (personal && !evidenceState.hasEvidence && !textLinkLanguage) missing.push("textLink");
  }

  if (question.dimension === "apprecier") {
    if (!opinion) {
      missing.push("personal");
      addCriterion(criteria, "opinion", "Opinion", "missing", "L’opinion n’est pas encore formulée clairement.");
    } else {
      strengths.push("Ton opinion est claire.");
      addCriterion(criteria, "opinion", "Opinion", "met", "Une opinion est formulée.");
    }
    if (!criterion) {
      missing.push("criterion");
      addCriterion(criteria, "criterion", "Critère d’appréciation", "missing", "Aucun critère précis n’est nommé.");
    } else {
      strengths.push(`Ton critère porte sur : ${criterion}.`);
      addCriterion(criteria, "criterion", "Critère d’appréciation", "met", `Le critère « ${criterion} » est repéré.`);
    }
  }

  if (question.minimumExpectedElements > 1) {
    if (elements.count < question.minimumExpectedElements || elements.confidence === "low") {
      missing.push("elements");
      const cautious = elements.confidence === "low"
        ? `Le système ne peut pas confirmer ${question.minimumExpectedElements} éléments distincts.`
        : `${elements.count} élément(s) sont clairement repérés sur ${question.minimumExpectedElements}.`;
      addCriterion(criteria, "elements", "Nombre d’éléments", "partial", cautious);
    } else {
      strengths.push(`${question.minimumExpectedElements} éléments distincts sont repérables.`);
      addCriterion(criteria, "elements", "Nombre d’éléments", "met", "Le nombre minimal d’éléments est atteint.");
    }
  }

  const blockingMissing = orderMissing(missing, question.dimension).filter((code) => [
    "answer", "evidence", "evidencePrecision", "justification", "personal", "criterion", "elements", "textLink"
  ].includes(code));

  let status = "partial";
  if (!answerText) status = "missing";
  else if (blockingMissing.length === 0) {
    const strong = answerWords >= (LEVEL_RULES[levelId] || LEVEL_RULES["6e"]).strongWords
      && (!question.proofRequired || (evidenceState.hasEvidence && !evidenceState.vague))
      && (!question.justificationRequired || hasExplainedLink)
      && (question.minimumExpectedElements <= 1 || elements.confidence !== "low");
    status = strong ? "strong" : "acceptable";
  }

  if (status === "acceptable" || status === "strong") {
    const success = FORMATIVE_MESSAGE_PREVIEW[question.dimension]?.acceptable;
    if (success) strengths.unshift(success);
  }

  const facts = { evidenceState, elements, personal, opinion, criterion, levelId };
  const firstMissing = blockingMissing[0] || "";
  const nextStep = firstMissing
    ? modeId === "simulation"
      ? simulationMessage(firstMissing, question)
      : firstMissing === "answer"
        ? FORMATIVE_MESSAGE_PREVIEW[question.dimension]?.missing || trainingNextStep(firstMissing, levelId, question)
        : trainingNextStep(firstMissing, levelId, question)
    : modeId === "simulation"
      ? "Relis ta réponse et vérifie les exigences de forme avant de continuer."
      : status === "strong"
        ? "Ta réponse est bien structurée. Relis-la une dernière fois."
        : "Relis ta réponse et précise-la seulement si nécessaire.";

  const publicMissing = blockingMissing.map((code) => ({
    code,
    message: modeId === "simulation"
      ? simulationMessage(code, question)
      : diagnosticMessage(code, question, facts)
  }));

  const publicStrengths = modeId === "simulation"
    ? (answerText ? ["Une réponse est écrite."] : [])
    : unique(strengths).slice(0, 4);
  const publicCriteria = modeId === "simulation"
    ? criteria.map(({ id, label, status: criterionStatus }) => ({
        id,
        label,
        status: criterionStatus,
        message: criterionStatus === "met" || criterionStatus === "optional"
          ? "Exigence de forme présente ou facultative."
          : "Exigence de forme à vérifier."
      }))
    : criteria;

  return {
    version: FORMATIVE_FEEDBACK_VERSION,
    status,
    missing: publicMissing,
    strengths: publicStrengths,
    nextStep,
    criterionFeedback: publicCriteria,
    canContinue: blockingMissing.length === 0,
    canSubmit: blockingMissing.length === 0,
    procedureOnly: modeId === "simulation",
    question: {
      id: question.id,
      dimension: question.dimension,
      questionType: question.questionType,
      proofRequired: question.proofRequired,
      justificationRequired: question.justificationRequired,
      minimumExpectedElements: question.minimumExpectedElements,
      targetLevel: question.targetLevel
    },
    diagnostics: {
      answerWords,
      validEvidenceCount: evidenceState.valid.length,
      rejectedEvidenceCount: evidenceState.rejected.length,
      evidenceVague: evidenceState.vague,
      estimatedElements: elements.count,
      elementConfidence: elements.confidence,
      hasPersonalPosition: personal,
      hasOpinion: opinion,
      appreciationCriterion: criterion,
      hasJustificationLanguage: justificationLanguage,
      hasTextLinkLanguage: textLinkLanguage
    }
  };
}

export function evaluateExerciseSubmission(exerciseInput = {}, work = {}, context = {}) {
  const exercise = normalizeExerciseQuestions(exerciseInput);
  const modeId = context.modeId === "simulation" ? "simulation" : "training";
  const exerciseId = String(exercise.id || "");
  const scopedWork = work && typeof work === "object" ? work : {};
  const scopeValid = String(scopedWork.exerciseId || "") === exerciseId
    && String(scopedWork.learningMode || "") === modeId;
  const answers = scopeValid && scopedWork.answers && typeof scopedWork.answers === "object" ? scopedWork.answers : {};
  const proofs = scopeValid && Array.isArray(scopedWork.proofs) ? scopedWork.proofs : [];

  const results = exercise.questions.map((question) => evaluateReadingAnswer(
    question,
    answers[question.id] || "",
    { proofs, exerciseId: scopedWork.exerciseId, modeId: scopedWork.learningMode },
    { exerciseId, modeId, levelId: question.targetLevel }
  ));

  const completeQuestions = results.filter((result) => ["acceptable", "strong"].includes(result.status)).length;
  const partialQuestions = results.filter((result) => result.status === "partial").length;
  const missingQuestions = results.filter((result) => result.status === "missing").length;
  const hasMissing = (result, codes) => result.missing.some((item) => codes.includes(item.code));
  const countAnyMissing = (codes) => results.filter((result) => hasMissing(result, codes)).length;

  return {
    completeQuestions,
    partialQuestions,
    missingQuestions,
    missingEvidence: countAnyMissing(["evidence", "evidencePrecision"]),
    missingJustification: countAnyMissing(["justification", "textLink"]),
    missingElements: countAnyMissing(["elements"]),
    missingPersonalPosition: countAnyMissing(["personal"]),
    missingCriterion: countAnyMissing(["criterion"]),
    readyToSubmit: results.every((result) => result.canSubmit),
    scopeValid,
    results: results.map((result, index) => ({
      questionId: exercise.questions[index]?.id,
      order: index + 1,
      status: result.status,
      missing: result.missing
    }))
  };
}

export function summarizeFeedbackCoverage(exercises = []) {
  const questions = exercises.flatMap((exercise) => normalizeExerciseQuestions(exercise).questions);
  const byDimension = Object.fromEntries(Object.keys(QUESTION_DIMENSIONS).map((dimension) => [
    dimension,
    questions.filter((question) => question.dimension === dimension).length
  ]));
  const unclear = questions.filter((question) => !FORMATIVE_MESSAGE_PREVIEW[question.dimension]
    || !question.validationProfile?.checklist?.length
    || !question.id
    || !question.prompt);
  return {
    evaluable: questions.length - unclear.length,
    total: questions.length,
    proofRequired: questions.filter((question) => question.proofRequired).length,
    justificationRequired: questions.filter((question) => question.justificationRequired).length,
    byDimension,
    unclear: unclear.map((question) => question.id || "question sans id")
  };
}

export function validateFeedbackCoverage(exercises = []) {
  const summary = summarizeFeedbackCoverage(exercises);
  return {
    valid: summary.unclear.length === 0 && summary.evaluable === summary.total,
    summary,
    message: summary.unclear.length
      ? `${summary.unclear.length} question(s) sans règle de rétroaction claire.`
      : `${summary.evaluable} question(s) évaluables : toutes les dimensions ont une règle de rétroaction.`
  };
}
