const commonProofChoices = [
  "Oui, les informations du texte soutiennent clairement mes idées.",
  "Un peu, mais je dois ajouter une preuve ou un exemple plus précis.",
  "Non, je dois retourner au texte ou à ma feuille de notes."
];

function criterion(id, title, instruction, choices) {
  return { id, title, instruction, choices };
}

export const WRITING_TYPES = [
  {
    id: "opinion",
    title: "Lettre d’opinion",
    defaultAudience: "une personne ou un groupe que je veux convaincre",
    defaultPurpose: "présenter une opinion claire et convaincre le destinataire avec des raisons appuyées par le texte",
    genericFocus: (text) => `Prends position sur une idée, un choix, un comportement ou une situation importante dans « ${text?.title || "le texte"} ». Donne deux raisons et appuie-les avec des éléments précis du texte source.`,
    required: [
      "Adresse-toi clairement au destinataire.",
      "Présente une opinion claire dès l’introduction.",
      "Développe au moins deux raisons différentes.",
      "Appuie tes raisons avec des faits, des exemples ou des informations du texte source.",
      "Termine par une conclusion et un appel, une recommandation ou une phrase forte."
    ],
    plan: [
      { id: "intro", label: "Introduction", instruction: "Formule d’appel, sujet, destinataire et opinion clairement annoncée." },
      { id: "dev1", label: "Développement 1", instruction: "Première raison, preuve du texte et explication du lien." },
      { id: "dev2", label: "Développement 2", instruction: "Deuxième raison différente, preuve et explication." },
      { id: "conclusion", label: "Conclusion", instruction: "Rappel de l’opinion, phrase forte ou appel à l’action, puis signature au besoin." }
    ],
    starters: ["Bonjour,", "Selon moi, ...", "À mon avis, ...", "Je suis convaincu que ...", "Ma première raison est que ...", "Par exemple, dans le texte, ...", "Une autre raison importante est que ...", "Je vous invite donc à ...", "En conclusion, ..."],
    minimumWords: 100,
    minimumParagraphs: 4,
    revisionCriteria: [
      criterion("destinataire", "1. Je m’adresse au bon destinataire", "Je vérifie que le ton, la formule d’appel et les mots choisis conviennent à la personne ou au groupe visé.", ["Oui, mon destinataire est clair et mon ton lui convient.", "Un peu, mais je dois interpeller davantage mon destinataire.", "Non, on ne comprend pas encore à qui j’écris."]),
      criterion("opinion", "2. Mon opinion est claire", "Le lecteur doit comprendre rapidement la position que je défends.", ["Oui, mon opinion est annoncée clairement.", "Un peu, mais ma position doit être précisée.", "Non, je dois formuler une opinion nette."]),
      criterion("raisons", "3. Mes raisons sont différentes et expliquées", "Je vérifie que mes deux raisons ne répètent pas la même idée.", ["Oui, j’ai deux raisons différentes et bien expliquées.", "Un peu, mais une raison doit être développée.", "Non, je dois ajouter ou remplacer une raison."]),
      criterion("preuves", "4. J’appuie mes raisons sur le texte", "Chaque raison importante doit être soutenue par un fait, un exemple ou une information pertinente.", commonProofChoices),
      criterion("conclusion", "5. Ma conclusion cherche un effet sur le lecteur", "Je rappelle mon opinion et je termine avec une recommandation, un appel ou une phrase forte.", ["Oui, ma conclusion rappelle ma position et agit sur le lecteur.", "Un peu, mais ma phrase finale doit être renforcée.", "Non, je dois écrire une vraie conclusion de lettre d’opinion."])
    ],
    successCriteria: [
      "Le destinataire et le but sont reconnaissables.",
      "L’opinion est claire et constante.",
      "Deux raisons différentes sont développées.",
      "Des preuves du texte soutiennent les raisons.",
      "La structure et la conclusion respectent la lettre d’opinion."
    ]
  },
  {
    id: "explicatif",
    title: "Texte explicatif",
    defaultAudience: "des élèves qui veulent comprendre le sujet",
    defaultPurpose: "expliquer clairement un phénomène, une situation ou une idée importante du texte",
    genericFocus: (text) => `Explique un phénomène, une situation, un comportement ou une idée importante présentée dans « ${text?.title || "le texte"} ». Organise l’explication en au moins deux aspects et utilise des informations précises du texte source.`,
    required: [
      "Présente clairement le sujet à expliquer.",
      "Développe au moins deux aspects dans un ordre logique.",
      "Utilise des faits, des exemples ou des informations du texte source.",
      "Explique les liens de cause, de conséquence, de fonctionnement ou d’importance.",
      "Termine par une synthèse de l’explication principale."
    ],
    plan: [
      { id: "intro", label: "Introduction", instruction: "Sujet, question ou phénomène à expliquer et annonce des aspects." },
      { id: "dev1", label: "Développement 1", instruction: "Premier aspect, information précise et explication." },
      { id: "dev2", label: "Développement 2", instruction: "Deuxième aspect, exemple ou fait et lien logique." },
      { id: "conclusion", label: "Conclusion", instruction: "Synthèse de ce qu’il faut comprendre ou retenir." }
    ],
    starters: ["Ce texte permet de comprendre que ...", "Un premier élément important est ...", "Cela s’explique par ...", "Cela signifie que ...", "Un autre aspect est ...", "Par exemple, ...", "Cette information montre que ...", "Pour conclure, ..."],
    minimumWords: 90,
    minimumParagraphs: 4,
    revisionCriteria: [
      criterion("sujet", "1. Le sujet expliqué est précis", "Je vérifie que le lecteur comprend dès le début ce que mon texte va expliquer.", ["Oui, le sujet ou la question est annoncé clairement.", "Un peu, mais mon introduction doit être plus précise.", "Non, je dois annoncer clairement ce que j’explique."]),
      criterion("organisation", "2. Mes aspects suivent un ordre logique", "Je place les informations dans un ordre qui aide le lecteur à comprendre.", ["Oui, mes aspects sont distincts et bien ordonnés.", "Un peu, mais je dois déplacer ou séparer certaines idées.", "Non, je dois reconstruire l’ordre de mon explication."]),
      criterion("explication", "3. J’explique les liens importants", "Je ne fais pas seulement énumérer des faits : j’explique comment, pourquoi ou avec quelles conséquences.", ["Oui, j’explique les liens entre les informations.", "Un peu, mais certaines informations doivent être expliquées.", "Non, mon texte énumère sans vraiment expliquer."]),
      criterion("preuves", "4. Mes explications s’appuient sur le texte", "Les faits et les exemples choisis doivent être exacts et pertinents.", commonProofChoices),
      criterion("synthese", "5. Ma conclusion résume l’essentiel", "Je termine avec l’idée principale à retenir sans ajouter un nouveau sujet.", ["Oui, ma conclusion résume clairement l’explication.", "Un peu, mais je dois mieux faire ressortir l’essentiel.", "Non, je dois ajouter une synthèse finale."])
    ],
    successCriteria: [
      "Le sujet ou le phénomène est clairement présenté.",
      "Deux aspects distincts sont expliqués dans un ordre logique.",
      "Les liens de cause, de conséquence ou de fonctionnement sont explicités.",
      "Les informations du texte sont exactes et bien intégrées.",
      "La conclusion fait ressortir l’essentiel à retenir."
    ]
  },
  {
    id: "reaction",
    title: "Réaction ou appréciation",
    defaultAudience: "une personne qui veut connaître ma réaction au texte",
    defaultPurpose: "présenter une réaction personnelle et l’expliquer avec des passages précis du texte",
    genericFocus: (text) => `Présente ta réaction, ton appréciation ou ton jugement sur un personnage, un événement, une idée ou un passage marquant de « ${text?.title || "le texte"} ». Explique ta réaction et appuie-la avec des détails précis du texte source.`,
    required: [
      "Nomme clairement ta réaction, ton appréciation ou ton jugement.",
      "Explique ce qui a provoqué cette réaction.",
      "Utilise au moins deux passages, événements ou détails précis du texte.",
      "Explique le lien entre ces éléments et ta réaction personnelle.",
      "Termine en disant ce que tu retiens, comprends ou recommandes."
    ],
    plan: [
      { id: "intro", label: "Introduction", instruction: "Titre du texte, élément choisi et réaction générale." },
      { id: "dev1", label: "Développement 1", instruction: "Premier élément du texte, réaction et explication." },
      { id: "dev2", label: "Développement 2", instruction: "Deuxième élément, comparaison ou approfondissement de la réaction." },
      { id: "conclusion", label: "Conclusion", instruction: "Bilan de l’appréciation et idée retenue ou recommandation." }
    ],
    starters: ["J’ai réagi à ce texte parce que ...", "J’ai trouvé intéressant que ...", "Le passage qui m’a le plus marqué est ...", "Cette situation m’a fait penser à ...", "Je comprends mieux que ...", "Je recommande / je ne recommande pas ce texte parce que ...", "En terminant, je retiens que ..."],
    minimumWords: 80,
    minimumParagraphs: 3,
    revisionCriteria: [
      criterion("reaction", "1. Ma réaction est claire", "Le lecteur doit comprendre ce que j’ai ressenti, pensé, apprécié ou jugé.", ["Oui, ma réaction principale est claire.", "Un peu, mais je dois mieux nommer ma réaction.", "Non, je dois formuler une réaction ou une appréciation précise."]),
      criterion("elements", "2. Je choisis des éléments précis du texte", "Je vérifie que les passages ou événements choisis sont pertinents pour expliquer ma réaction.", commonProofChoices),
      criterion("lien", "3. J’explique le lien avec ma réaction", "Je dis pourquoi chaque élément m’a fait réagir ainsi.", ["Oui, j’explique clairement pourquoi ces éléments provoquent ma réaction.", "Un peu, mais certains liens doivent être développés.", "Non, je dois expliquer ma réaction au lieu de seulement raconter le texte."]),
      criterion("organisation", "4. Mon appréciation est organisée", "Je sépare ma réaction générale, mes exemples et mon bilan final.", ["Oui, mon texte suit un ordre clair.", "Un peu, mais je dois mieux séparer mes idées.", "Non, je dois réorganiser mon texte."]),
      criterion("bilan", "5. Ma conclusion dit ce que je retiens", "Je termine par un bilan personnel, une compréhension ou une recommandation.", ["Oui, ma conclusion montre ce que je retiens du texte.", "Un peu, mais ma conclusion doit être approfondie.", "Non, je dois ajouter un bilan personnel."])
    ],
    successCriteria: [
      "La réaction ou l’appréciation est clairement nommée.",
      "Au moins deux éléments précis du texte sont utilisés.",
      "Le lien entre le texte et la réaction personnelle est expliqué.",
      "Les idées sont organisées sans résumer tout le texte.",
      "La conclusion présente un bilan, une compréhension ou une recommandation."
    ]
  }
];

const PRECISE_WRITING_SITUATIONS = {
  "Les aurores boréales": { suggestedType: "explicatif", audience: "des élèves de 5e année qui préparent une activité scientifique", purpose: "expliquer clairement un phénomène naturel", focus: "Explique simplement ce que sont les aurores boréales, comment elles se forment et pourquoi elles fascinent les gens.", required: ["Décris ce qu’est une aurore boréale.", "Explique au moins deux éléments importants du phénomène.", "Utilise des informations du texte source.", "Termine en expliquant pourquoi ce phénomène peut impressionner les gens."] },
  "M. Vadeboncoeur": { suggestedType: "reaction", audience: "ton enseignante ou ton enseignant", purpose: "montrer ce que tu as compris d’un personnage et de son rôle dans le récit", focus: "Explique si tu trouves que ce personnage est important dans l’histoire et appuie ton point de vue avec des exemples du texte.", required: ["Présente ton opinion sur le personnage.", "Explique au moins deux traits ou actions du personnage.", "Ajoute un exemple du texte.", "Termine par une appréciation personnelle."] },
  "Mille et un flocons": { suggestedType: "opinion", audience: "les élèves de ta classe", purpose: "donner ton opinion sur l’hiver", focus: "Prends position : l’hiver est-il surtout une saison agréable ou difficile ? Appuie ton opinion avec deux raisons et des exemples du texte.", required: ["Présente clairement ton opinion.", "Donne deux raisons.", "Utilise au moins un exemple ou un fait du texte.", "Interpelle ton destinataire et termine par une courte conclusion."] },
  "Pattes dans l’eau": { suggestedType: "reaction", audience: "un ami qui n’a pas lu le texte", purpose: "expliquer ta réaction à une situation vécue par un personnage ou un animal", focus: "Explique ce que tu as ressenti ou pensé devant la situation présentée et appuie ta réaction avec des événements précis du texte.", required: ["Nomme ta réaction principale.", "Explique ce qui a provoqué cette réaction.", "Utilise deux éléments du texte.", "Termine en disant ce que cette situation t’a fait comprendre."] },
  "Pirouette dans les airs": { suggestedType: "reaction", audience: "un élève qui aime les récits d’action", purpose: "apprécier un moment marquant du texte", focus: "Explique quel moment du récit t’a semblé le plus marquant et appuie ton choix avec des détails du texte.", required: ["Nomme le moment choisi.", "Explique pourquoi ce moment est marquant.", "Ajoute au moins deux détails du texte.", "Termine par ton appréciation du récit."] },
  "Le surf au Québec": { suggestedType: "opinion", audience: "des jeunes qui cherchent une nouvelle activité sportive", purpose: "convaincre ou informer sur une activité présentée dans le texte", focus: "Prends position : le surf à pagaie est-il une activité intéressante à essayer au Québec ? Appuie ton opinion avec deux raisons, des bienfaits et des exemples du texte.", required: ["Présente ton opinion clairement.", "Explique au moins deux bienfaits ou intérêts du surf à pagaie.", "Utilise des informations, des faits ou des exemples du texte source.", "Interpelle ton destinataire et termine par une recommandation."] },
  "La chasse aux noix": { suggestedType: "explicatif", audience: "des élèves plus jeunes qui découvrent le comportement des animaux", purpose: "expliquer une stratégie de survie observée dans le texte", focus: "Montre comment l’animal du texte se prépare ou s’organise pour répondre à ses besoins et utilise des exemples précis du texte.", required: ["Présente l’animal ou la situation.", "Explique deux comportements importants.", "Utilise des exemples du texte.", "Termine en expliquant pourquoi cette préparation est utile."] },
  "Le temps des pommes": { suggestedType: "opinion", audience: "ta classe ou le journal de l’école", purpose: "donner ton opinion sur une activité saisonnière", focus: "Prends position : une sortie aux pommes est-elle une activité intéressante à vivre en famille ou avec l’école ? Appuie ton opinion avec deux raisons et des éléments du texte.", required: ["Présente ton opinion.", "Donne deux raisons.", "Utilise au moins un détail du texte.", "Interpelle ton destinataire et termine par une phrase qui résume ton point de vue."] },
  "La légende des ombres chinoises": { suggestedType: "explicatif", audience: "des élèves qui préparent une activité culturelle", purpose: "expliquer l’origine ou l’importance d’une tradition artistique", focus: "Montre ce que cette légende permet de comprendre sur les ombres chinoises et leur valeur culturelle.", required: ["Présente la légende ou la tradition.", "Explique deux éléments importants du texte.", "Utilise des informations du texte source.", "Termine en disant pourquoi cette tradition peut être intéressante."] },
  "L’avenir de la planète": { suggestedType: "opinion", audience: "un producteur ou une productrice de contenu vidéo jeunesse", purpose: "convaincre de créer une capsule vidéo de sensibilisation destinée aux jeunes", focus: "Convaincs le destinataire de produire une capsule vidéo sur la nécessité, pour les jeunes, de poser des gestes concrets afin de protéger la planète.", required: ["Adresse-toi clairement au producteur ou à la productrice.", "Présente ton opinion : une capsule vidéo sur les gestes concrets des jeunes est nécessaire ou très utile.", "Donne deux raisons convaincantes liées à l’importance d’agir pour la planète.", "Utilise des informations, des faits ou des exemples tirés du texte source.", "Propose au moins un geste concret que les jeunes pourraient poser.", "Termine par un appel à l’action clair pour encourager la production de la capsule vidéo."] },
  "Les origines selon la Genèse": { suggestedType: "opinion", audience: "un élève qui étudie les récits anciens", purpose: "réfléchir au message d’un récit patrimonial", focus: "Prends position : ce récit montre-t-il bien que les choix peuvent avoir des conséquences importantes ? Appuie ton opinion avec deux raisons et des événements du récit.", required: ["Présente ton opinion.", "Explique deux raisons liées au récit.", "Utilise des exemples comme l’interdit, le serpent, le choix ou les conséquences.", "Termine en expliquant le message que tu retiens."] }
};

function composeTask(typeId, sourceTitle, audience, purpose, focus) {
  const opening = typeId === "opinion"
    ? `écris une lettre d’opinion à ${audience}`
    : typeId === "explicatif"
      ? `rédige un texte explicatif destiné à ${audience}`
      : `rédige une réaction ou une appréciation destinée à ${audience}`;
  return `Après avoir lu « ${sourceTitle} », ${opening}. Ton but est de ${purpose}. ${focus}`;
}

export function getWritingType(typeId = "opinion") {
  return WRITING_TYPES.find((type) => type.id === typeId) || WRITING_TYPES[0];
}

export function buildWritingBrief(text, typeId = "opinion") {
  const profile = getWritingType(typeId);
  const preset = PRECISE_WRITING_SITUATIONS[text?.title];
  const usePreset = preset?.suggestedType === profile.id;
  const audience = usePreset ? preset.audience : profile.defaultAudience;
  const purpose = usePreset ? preset.purpose : profile.defaultPurpose;
  const focus = usePreset ? preset.focus : profile.genericFocus(text);
  const required = usePreset ? preset.required : profile.required;
  const sourceTitle = text?.title || "le texte";

  return {
    id: `${text?.id || sourceTitle}:${profile.id}`,
    sourceId: text?.id || "",
    sourceTitle,
    sourceIntention: text?.intention || "",
    typeId: profile.id,
    type: profile.title,
    suggestedType: preset?.suggestedType || profile.id,
    usesTextSpecificSituation: Boolean(usePreset),
    audience,
    purpose,
    focus,
    task: composeTask(profile.id, sourceTitle, audience, purpose, focus),
    required: [...required],
    plan: profile.plan.map((part) => ({ ...part })),
    starters: [...profile.starters],
    minimumWords: profile.minimumWords,
    minimumParagraphs: profile.minimumParagraphs,
    revisionCriteria: profile.revisionCriteria.map((item) => ({ ...item, choices: [...item.choices] })),
    successCriteria: [...profile.successCriteria]
  };
}

export function personalizeWritingBrief(brief, audience, purpose) {
  const safeAudience = String(audience || brief.audience).trim() || brief.audience;
  const safePurpose = String(purpose || brief.purpose).trim() || brief.purpose;
  return {
    ...brief,
    audience: safeAudience,
    purpose: safePurpose,
    task: composeTask(brief.typeId, brief.sourceTitle, safeAudience, safePurpose, brief.focus)
  };
}

export function revisionCheckKey(typeId, criterionId) {
  return `revision-${typeId}-${criterionId}`;
}

export function successCheckKey(typeId, index) {
  return `success-${typeId}-${index}`;
}
