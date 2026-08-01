export const WRITING_MINISTRY_FEEDBACK_VERSION = "1.0";

export const WRITING_MINISTRY_CRITERIA = [
  {
    id: "adaptation",
    label: "Adaptation à la situation d’écriture",
    studentPrompt: "Mon texte respecte-t-il le sujet, le destinataire, le but et le type de texte?"
  },
  {
    id: "coherence",
    label: "Cohérence du texte",
    studentPrompt: "Mes idées sont-elles regroupées, ordonnées et reliées clairement?"
  },
  {
    id: "vocabulary",
    label: "Utilisation d’un vocabulaire approprié",
    studentPrompt: "Mes mots sont-ils précis, variés et adaptés au destinataire?"
  },
  {
    id: "sentences",
    label: "Construction des phrases et ponctuation appropriées",
    studentPrompt: "Mes phrases sont-elles complètes, lisibles et bien ponctuées?"
  },
  {
    id: "orthography",
    label: "Respect de l’orthographe d’usage et grammaticale",
    studentPrompt: "Ai-je vérifié les mots, les groupes du nom et les accords des verbes?"
  }
];

export const WRITING_SIMULATION_CHECKLIST = [
  "Je vérifie le sujet, le destinataire, le but et le type de texte.",
  "Je vérifie l’ordre des idées, les paragraphes et les marqueurs de relation.",
  "Je vérifie que mes mots sont précis, variés et appropriés.",
  "Je vérifie la construction de chaque phrase, les majuscules et la ponctuation.",
  "Je vérifie l’orthographe des mots et les accords grammaticaux."
];

const RELATION_MARKERS = [
  "d’abord", "tout d’abord", "premièrement", "ensuite", "puis", "de plus",
  "aussi", "par ailleurs", "cependant", "pourtant", "mais", "donc", "ainsi",
  "parce que", "car", "en effet", "par exemple", "finalement", "enfin",
  "en conclusion", "pour conclure", "en terminant"
];

const CONCLUSION_MARKERS = [
  "en conclusion", "pour conclure", "finalement", "en terminant", "je retiens",
  "je vous invite", "en résumé", "pour finir"
];

const VAGUE_WORDS = [
  "chose", "choses", "truc", "trucs", "affaire", "affaires", "ça", "cela",
  "bien", "beau", "belle", "bon", "bonne", "intéressant", "intéressante"
];

const STOP_WORDS = new Set([
  "alors", "au", "aux", "avec", "ce", "ces", "cette", "comme", "dans", "de",
  "des", "du", "elle", "elles", "en", "et", "est", "il", "ils", "je", "la",
  "le", "les", "leur", "leurs", "mais", "mes", "mon", "ne", "nous", "on",
  "ou", "par", "pas", "plus", "pour", "que", "qui", "sa", "se", "ses", "son",
  "sur", "ta", "te", "tes", "tu", "un", "une", "vos", "votre", "vous", "y"
]);

function cleanText(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function normalizeWord(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^[^a-zà-ÿœ]+|[^a-zà-ÿœ]+$/gi, "");
}

function wordsOf(value) {
  return cleanText(value)
    .split(/\s+/)
    .map((word) => word.replace(/^[«“"'’([{]+|[»”"'’),.;:!?\]}]+$/g, ""))
    .filter(Boolean);
}

function paragraphsOf(value) {
  const source = cleanText(value);
  if (!source) return [];
  const separated = source.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  if (separated.length > 1) return separated;
  return source.split(/\n+/).map((item) => item.trim()).filter(Boolean);
}

function sentencesOf(value) {
  const source = cleanText(value);
  if (!source) return [];
  const matches = source.match(/[^.!?\n]+(?:[.!?]+|$)/g) || [];
  return matches.map((item) => item.trim()).filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function containsPhrase(source, phrase) {
  return source.toLocaleLowerCase("fr").includes(phrase.toLocaleLowerCase("fr"));
}

function relationMarkersIn(value) {
  const source = cleanText(value);
  return RELATION_MARKERS.filter((marker) => containsPhrase(source, marker));
}

function repeatedContentWords(value) {
  const counts = new Map();
  for (const raw of wordsOf(value)) {
    const word = normalizeWord(raw);
    if (word.length < 4 || STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));
}

function vagueWordsIn(value) {
  const normalizedWords = wordsOf(value).map(normalizeWord);
  return VAGUE_WORDS
    .map((word) => ({ word, count: normalizedWords.filter((item) => item === normalizeWord(word)).length }))
    .filter((item) => item.count > 0);
}

function sentenceSignals(value) {
  const sentences = sentencesOf(value);
  const details = sentences.map((sentence, index) => {
    const wordCount = wordsOf(sentence).length;
    const terminalPunctuation = /[.!?][»”"')\]]*$/.test(sentence);
    const startsWithCapital = /^[«“"'’([{]*[A-ZÀ-ÖØ-Þ]/.test(sentence);
    return {
      index,
      wordCount,
      terminalPunctuation,
      startsWithCapital,
      tooShort: wordCount > 0 && wordCount < 4,
      tooLong: wordCount > 34
    };
  });
  return {
    count: sentences.length,
    tooShortCount: details.filter((item) => item.tooShort).length,
    tooLongCount: details.filter((item) => item.tooLong).length,
    missingTerminalPunctuationCount: details.filter((item) => !item.terminalPunctuation).length,
    missingCapitalCount: details.filter((item) => !item.startsWithCapital).length,
    details
  };
}

function agreementZones(value) {
  const source = cleanText(value);
  const pluralGroups = (source.match(/\b(?:les|des|mes|tes|ses|ces|nos|vos|leurs)\s+[a-zà-ÿœ-]+/gi) || []).length;
  const subjectPronouns = (source.match(/\b(?:je|tu|il|elle|on|nous|vous|ils|elles)\s+(?:ne\s+)?[a-zà-ÿœ'-]+/gi) || []).length;
  const pastParticiples = (source.match(/\b(?:a|as|avons|avez|ont|est|sont|était|étaient)\s+[a-zà-ÿœ-]+(?:é|ée|és|ées|i|ie|is|ies|u|ue|us|ues)\b/gi) || []).length;
  return { pluralGroups, subjectPronouns, pastParticiples };
}

function criterionResult(id, label, state, summary, evidence = [], actions = []) {
  return {
    id,
    label,
    state,
    summary,
    evidence: unique(evidence).slice(0, 3),
    actions: unique(actions).slice(0, 3)
  };
}

function adaptationCriterion(text, context) {
  const missing = [];
  if (!cleanText(context.audience)) missing.push("le destinataire");
  if (!cleanText(context.purpose)) missing.push("le but");
  if (!cleanText(context.textType)) missing.push("le type de texte");
  if (!text) missing.push("le brouillon");

  const evidence = [];
  if (cleanText(context.audience)) evidence.push(`Destinataire indiqué : ${cleanText(context.audience)}.`);
  if (cleanText(context.purpose)) evidence.push(`But indiqué : ${cleanText(context.purpose)}.`);
  if (cleanText(context.textType)) evidence.push(`Type de texte : ${cleanText(context.textType)}.`);

  if (missing.length) {
    return criterionResult(
      "adaptation",
      WRITING_MINISTRY_CRITERIA[0].label,
      "review",
      `La situation d’écriture est incomplète : ${missing.join(", ")}.`,
      evidence,
      ["Relis la consigne et précise le destinataire, le but et le type de texte avant de réviser le contenu."]
    );
  }

  return criterionResult(
    "adaptation",
    WRITING_MINISTRY_CRITERIA[0].label,
    "check",
    "Le contrat d’écriture est présent. La pertinence exacte des idées doit encore être vérifiée par une relecture humaine.",
    evidence,
    ["Relis chaque paragraphe et demande-toi s’il aide réellement à accomplir le but auprès du destinataire."]
  );
}

function coherenceCriterion(text, context) {
  const paragraphs = paragraphsOf(text);
  const markers = relationMarkersIn(text);
  const minimumParagraphs = Math.max(1, Number(context.minimumParagraphs || 3));
  const conclusionPresent = CONCLUSION_MARKERS.some((marker) => containsPhrase(text, marker));
  const actions = [];
  const evidence = [`${paragraphs.length} paragraphe(s) repéré(s).`, `${markers.length} marqueur(s) de relation différent(s) repéré(s).`];

  if (paragraphs.length < minimumParagraphs) actions.push(`Vérifie si tes idées devraient être séparées en au moins ${minimumParagraphs} paragraphes.`);
  if (markers.length < 2) actions.push("Ajoute ou vérifie des marqueurs de relation pour montrer l’ordre, la cause, l’opposition ou la conclusion.");
  if (!conclusionPresent) actions.push("Vérifie que la fin du texte ferme clairement le sujet sans ajouter une nouvelle grande idée.");

  return criterionResult(
    "coherence",
    WRITING_MINISTRY_CRITERIA[1].label,
    actions.length ? "review" : "check",
    actions.length
      ? "Certains indices d’organisation sont à revoir. Le moteur ne peut pas juger seul la logique complète des idées."
      : "Les paragraphes et les liens entre les idées sont visibles. La progression logique doit encore être relue.",
    evidence,
    actions.length ? actions : ["Compare l’ordre de tes paragraphes avec ton plan et vérifie qu’une idée prépare bien la suivante."]
  );
}

function vocabularyCriterion(text) {
  const words = wordsOf(text);
  const normalized = words.map(normalizeWord).filter(Boolean);
  const distinct = new Set(normalized);
  const repeated = repeatedContentWords(text);
  const vague = vagueWordsIn(text);
  const varietyRatio = normalized.length ? Math.round((distinct.size / normalized.length) * 100) : 0;
  const actions = [];

  if (repeated.length) actions.push(`Relis les répétitions fréquentes, notamment « ${repeated.slice(0, 3).map((item) => item.word).join(" », « ")} », et remplace seulement celles qui nuisent à la précision.`);
  if (vague.length) actions.push(`Vérifie si des mots généraux comme « ${vague.slice(0, 3).map((item) => item.word).join(" », « ")} » peuvent être précisés.`);
  if (words.length && varietyRatio < 38) actions.push("Relis les mots répétés et cherche des formulations plus précises sans changer ton idée.");

  return criterionResult(
    "vocabulary",
    WRITING_MINISTRY_CRITERIA[2].label,
    actions.length ? "review" : "check",
    actions.length
      ? "Des répétitions ou des mots généraux méritent une relecture ciblée. Ils ne sont pas automatiquement des erreurs."
      : "Aucun signal important de répétition n’est détecté. Le sens exact et le registre doivent encore être vérifiés humainement.",
    [`${words.length} mot(s) analysé(s).`, `Indice descriptif de variété : ${varietyRatio} %.`, `${repeated.length} répétition(s) fréquente(s) repérée(s).`],
    actions.length ? actions : ["Relis les noms, les verbes et les adjectifs importants : sont-ils précis et adaptés au destinataire?"]
  );
}

function sentencesCriterion(text) {
  const signals = sentenceSignals(text);
  const actions = [];
  if (!signals.count) actions.push("Écris au moins une phrase complète avant d’utiliser cette vérification.");
  if (signals.tooShortCount) actions.push(`Relis ${signals.tooShortCount} phrase(s) de moins de quatre mots : elles peuvent être voulues, mais vérifie qu’elles sont complètes.`);
  if (signals.tooLongCount) actions.push(`Relis ${signals.tooLongCount} phrase(s) de plus de 34 mots et vérifie si elles doivent être divisées.`);
  if (signals.missingTerminalPunctuationCount) actions.push(`Vérifie la ponctuation finale de ${signals.missingTerminalPunctuationCount} phrase(s) ou segment(s).`);
  if (signals.missingCapitalCount) actions.push(`Vérifie la majuscule au début de ${signals.missingCapitalCount} phrase(s) ou segment(s).`);

  return criterionResult(
    "sentences",
    WRITING_MINISTRY_CRITERIA[3].label,
    actions.length ? "review" : "check",
    actions.length
      ? "Des phrases ou des signes de ponctuation doivent être relus. Le moteur signale des zones, sans réécrire les phrases."
      : "Aucun signal simple de longueur, de majuscule ou de ponctuation finale n’est détecté. La syntaxe complète doit encore être vérifiée.",
    [
      `${signals.count} phrase(s) ou segment(s) analysé(s).`,
      `${signals.tooLongCount} phrase(s) très longue(s).`,
      `${signals.tooShortCount} phrase(s) très courte(s).`
    ],
    actions.length ? actions : ["Lis chaque phrase à voix basse et vérifie qu’elle contient tous les mots nécessaires et une ponctuation claire."]
  );
}

function orthographyCriterion(text) {
  const zones = agreementZones(text);
  const total = zones.pluralGroups + zones.subjectPronouns + zones.pastParticiples;
  const actions = [
    "Fais un balayage des mots dont tu doutes avec un dictionnaire ou une liste orthographique.",
    zones.pluralGroups ? `Vérifie les accords dans les ${zones.pluralGroups} groupe(s) du nom au pluriel repéré(s).` : "Vérifie les déterminants, les noms et les adjectifs dans chaque groupe du nom.",
    zones.subjectPronouns ? `Vérifie les terminaisons des verbes dans les ${zones.subjectPronouns} zone(s) avec un pronom sujet repérée(s).` : "Repère chaque verbe, trouve son sujet et vérifie leur accord."
  ];
  if (zones.pastParticiples) actions.push(`Relis les ${zones.pastParticiples} zone(s) contenant un auxiliaire et une forme participiale.`);

  return criterionResult(
    "orthography",
    WRITING_MINISTRY_CRITERIA[4].label,
    text ? "check" : "review",
    text
      ? "Le moteur repère seulement des zones où appliquer des règles. Il ne compte pas les fautes et ne corrige aucun mot."
      : "Aucun texte n’est disponible pour préparer les balayages de correction.",
    [`${zones.pluralGroups} groupe(s) du nom pluriel repéré(s).`, `${zones.subjectPronouns} zone(s) sujet-verbe repérée(s).`, `${total} zone(s) d’accord à vérifier au total.`],
    actions
  );
}

export function buildWritingSimulationChecklist() {
  return WRITING_MINISTRY_CRITERIA.map((criterion, index) => ({
    id: criterion.id,
    label: criterion.label,
    prompt: criterion.studentPrompt,
    action: WRITING_SIMULATION_CHECKLIST[index]
  }));
}

export function analyzeWritingForRevision(input = {}) {
  const text = cleanText(input.text);
  const mode = input.mode === "simulation" ? "simulation" : "training";
  const context = {
    audience: cleanText(input.audience),
    purpose: cleanText(input.purpose),
    textType: cleanText(input.textType),
    minimumParagraphs: Number(input.minimumParagraphs || 3)
  };
  const checklist = buildWritingSimulationChecklist();

  if (mode === "simulation") {
    return {
      version: WRITING_MINISTRY_FEEDBACK_VERSION,
      mode,
      status: text ? "checklist" : "empty",
      criteria: checklist.map((item) => ({ ...item, state: "self-check" })),
      strengths: [],
      improvements: [],
      nextStep: "",
      checklist,
      signals: null,
      studentTextChanged: false
    };
  }

  const criteria = [
    adaptationCriterion(text, context),
    coherenceCriterion(text, context),
    vocabularyCriterion(text),
    sentencesCriterion(text),
    orthographyCriterion(text)
  ];
  const reviewCriteria = criteria.filter((criterion) => criterion.state === "review");
  const strengths = criteria
    .filter((criterion) => criterion.state === "check")
    .slice(0, 2)
    .map((criterion) => `${criterion.label} : ${criterion.summary}`);
  const improvements = reviewCriteria
    .flatMap((criterion) => criterion.actions.map((action) => `${criterion.label} — ${action}`))
    .slice(0, 3);
  const nextStep = improvements[0] || "Choisis un critère, relis ton texte et apporte toi-même une modification précise.";

  return {
    version: WRITING_MINISTRY_FEEDBACK_VERSION,
    mode,
    status: !text ? "empty" : reviewCriteria.length ? "partial" : "ready-to-review",
    criteria,
    strengths,
    improvements,
    nextStep,
    checklist,
    signals: {
      wordCount: wordsOf(text).length,
      paragraphCount: paragraphsOf(text).length,
      sentenceCount: sentencesOf(text).length,
      relationMarkerCount: relationMarkersIn(text).length
    },
    studentTextChanged: false
  };
}

export function validateWritingFeedbackSafety(feedback) {
  const errors = [];
  if (!feedback || typeof feedback !== "object") return { valid: false, errors: ["rétroaction absente"] };
  const forbiddenKeys = ["correctedText", "replacementText", "rewrittenText", "expectedAnswer", "studentAnswer"];
  const serialized = JSON.stringify(feedback);
  forbiddenKeys.forEach((key) => {
    if (serialized.includes(`\"${key}\"`)) errors.push(`champ interdit : ${key}`);
  });
  if (feedback.studentTextChanged !== false) errors.push("la rétroaction ne doit jamais déclarer une modification du texte");
  if (feedback.mode === "simulation" && (feedback.strengths?.length || feedback.improvements?.length || feedback.nextStep)) {
    errors.push("la simulation doit afficher seulement la liste de vérification");
  }
  return { valid: errors.length === 0, errors };
}
