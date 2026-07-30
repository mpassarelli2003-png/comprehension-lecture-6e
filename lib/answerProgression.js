export const ANSWER_GUARD_STORAGE_KEY = "lecture_answer_guard_v1";
export const ANSWER_LOCK_SECONDS = 8;

const LEVEL_RULES = {
  "6e": {
    minimumWords: 2,
    minimumCharacters: 8,
    label: "6e année",
    trainingSupport: [
      "Relis le mot-question et demande-toi ce qu’il faut nommer ou expliquer.",
      "Commence par une phrase simple qui répond directement à la question.",
      "Ajoute ensuite un détail ou un passage du texte qui soutient ton idée."
    ],
    simulationSupport: [
      "Relis la consigne sans chercher d’indice extérieur.",
      "Écris une phrase qui répond directement à la question.",
      "Ajoute un élément du texte lorsque la question demande une justification."
    ]
  },
  sec1: {
    minimumWords: 4,
    minimumCharacters: 18,
    label: "Secondaire 1",
    trainingSupport: [
      "Reformule la question avec tes mots pour vérifier ce qu’elle demande.",
      "Écris ton idée principale en une phrase complète.",
      "Ajoute un indice précis du texte et explique brièvement le lien."
    ],
    simulationSupport: [
      "Relis la consigne et repère les verbes importants.",
      "Formule une réponse complète et autonome.",
      "Vérifie qu’un élément précis du texte soutient ton idée."
    ]
  },
  sec2: {
    minimumWords: 6,
    minimumCharacters: 28,
    label: "Secondaire 2",
    trainingSupport: [
      "Identifie l’idée, l’interprétation ou le jugement demandé.",
      "Formule une réponse précise avant d’ajouter ta preuve.",
      "Explique pourquoi le passage choisi soutient réellement ton raisonnement."
    ],
    simulationSupport: [
      "Relis la consigne et détermine le type de raisonnement attendu.",
      "Rédige une réponse précise sans aide de contenu.",
      "Ajoute une preuve pertinente et explique son lien avec ta réponse."
    ]
  }
};

export function detectLevelId(label = "") {
  const value = String(label).toLowerCase();
  if (value.includes("secondaire 2") || value.includes("sec. 2") || value.includes("sec 2")) return "sec2";
  if (value.includes("secondaire 1") || value.includes("sec. 1") || value.includes("sec 1")) return "sec1";
  return "6e";
}

export function detectModeId(label = "") {
  return String(label).toLowerCase().includes("simulation") ? "simulation" : "training";
}

export function evaluateMinimumAnswer(answer, levelId = "6e") {
  const rule = LEVEL_RULES[levelId] || LEVEL_RULES["6e"];
  const normalized = String(answer || "").replace(/\s+/g, " ").trim();
  const words = normalized ? normalized.split(" ").filter(Boolean).length : 0;
  return {
    ok: words >= rule.minimumWords && normalized.length >= rule.minimumCharacters,
    empty: normalized.length === 0,
    words,
    characters: normalized.length,
    minimumWords: rule.minimumWords,
    minimumCharacters: rule.minimumCharacters,
    levelLabel: rule.label
  };
}

export function getProgressiveSupport(levelId = "6e", modeId = "training", attempt = 2) {
  const rule = LEVEL_RULES[levelId] || LEVEL_RULES["6e"];
  const items = modeId === "simulation" ? rule.simulationSupport : rule.trainingSupport;
  const visibleCount = attempt >= 3 ? items.length : Math.min(2, items.length);
  return {
    title: modeId === "simulation" ? "Aide de procédure obligatoire" : `Aide obligatoire — ${rule.label}`,
    note: modeId === "simulation"
      ? "Cette aide rappelle seulement la méthode. Elle ne donne ni réponse ni indice de contenu."
      : "Cette aide guide la démarche sans fournir la réponse finale.",
    items: items.slice(0, visibleCount)
  };
}
