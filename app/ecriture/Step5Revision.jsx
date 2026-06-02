function paragraphCount(text) {
  return String(text || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).length;
}

function hasAny(text, words) {
  const lower = String(text || "").toLowerCase();
  return words.some((word) => lower.includes(word.toLowerCase()));
}

export default function Step5Revision({ draft, checks, setChecks, preciseSituation, plan, wordCount }) {
  const revisionItems = [
    {
      id: "consigne",
      title: "1. Je réponds vraiment à la consigne",
      instruction: "Je relis la consigne et je vérifie si mon brouillon parle du bon sujet.",
      choices: [
        "Oui, mon texte répond clairement à la consigne précise.",
        "Un peu, mais je dois ajouter des détails liés à la consigne.",
        "Non, je dois revenir au sujet demandé."
      ]
    },
    {
      id: "structure",
      title: "2. Mon texte est bien organisé",
      instruction: "Je vérifie si mon texte a une introduction, des paragraphes de développement et une conclusion.",
      choices: [
        "Oui, mes parties sont faciles à reconnaître.",
        "Un peu, mais je dois mieux séparer ou organiser mes paragraphes.",
        "Non, je dois replacer mes idées dans un ordre plus clair."
      ]
    },
    {
      id: "preuves",
      title: "3. J’utilise le texte source",
      instruction: "Je vérifie si mes idées sont appuyées par une preuve, un exemple ou une information du texte lu.",
      choices: [
        "Oui, j’ai utilisé des informations précises du texte source.",
        "Un peu, mais je dois ajouter au moins une preuve ou un exemple.",
        "Non, mon texte ressemble trop à une opinion sans appui."
      ]
    },
    {
      id: "explication",
      title: "4. J’explique mes idées",
      instruction: "Je ne fais pas seulement nommer une preuve. J’explique pourquoi elle est importante.",
      choices: [
        "Oui, j’explique le lien entre mes preuves et mon idée.",
        "Un peu, mais certaines idées doivent être mieux expliquées.",
        "Non, je dois ajouter des phrases qui expliquent mes idées."
      ]
    },
    {
      id: "vocabulaire",
      title: "5. J’améliore mes mots",
      instruction: "Je remplace les répétitions et les mots vagues par des mots plus précis.",
      choices: [
        "Oui, mes mots sont précis et variés.",
        "Un peu, mais je dois remplacer quelques répétitions.",
        "Non, je dois améliorer mon vocabulaire."
      ]
    }
  ];

  const words = wordCount(draft);
  const paragraphs = paragraphCount(draft);
  const hasTextProofWords = hasAny(draft, ["dans le texte", "par exemple", "on apprend", "le texte dit", "un exemple"]);
  const hasConclusionWords = hasAny(draft, ["en conclusion", "finalement", "pour conclure", "je retiens"]);
  const checkedCount = revisionItems.filter((item) => checks[`revision-${item.id}`]).length;

  return (
    <div>
      <h2>Étape 5 — Je révise mes idées</h2>

      <div className="card yellow">
        <b>But de cette étape</b>
        <p>Réviser ne veut pas dire corriger les fautes tout de suite. Ici, tu vérifies d’abord si ton texte est clair, complet et bien organisé.</p>
      </div>

      <div className="card green">
        <b>Méthode orthopédagogique : C-O-P-E</b>
        <p><b>C — Consigne :</b> est-ce que je réponds au sujet demandé ?</p>
        <p><b>O — Organisation :</b> est-ce que mes idées sont placées dans un ordre logique ?</p>
        <p><b>P — Preuves :</b> est-ce que j’utilise le texte source ?</p>
        <p><b>E — Explication :</b> est-ce que j’explique mes idées avec mes mots ?</p>
      </div>

      <div className="card">
        <b>Consigne à vérifier</b>
        <p>{preciseSituation.task}</p>
        <b>Mon texte devait inclure :</b>
        <ul>{preciseSituation.required.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>

      <div className="card">
        <b>Tableau de bord de révision</b>
        <p>Mots dans le brouillon : <b>{words}</b></p>
        <p>Paragraphes : <b>{paragraphs}</b></p>
        <p>Indices de preuve trouvés : <b>{hasTextProofWords ? "oui" : "à vérifier"}</b></p>
        <p>Conclusion repérée : <b>{hasConclusionWords ? "oui" : "à vérifier"}</b></p>
        <p>Critères de révision répondus : <b>{checkedCount}</b> / {revisionItems.length}</p>
      </div>

      {revisionItems.map((item) => (
        <div className="card" key={item.id}>
          <h3>{item.title}</h3>
          <p>{item.instruction}</p>
          {item.choices.map((choice) => (
            <label key={choice} style={{display: "block", margin: "8px 0"}}>
              <input
                type="radio"
                name={`revision-${item.id}`}
                checked={checks[`revision-${item.id}`] === choice}
                onChange={() => setChecks({...checks, [`revision-${item.id}`]: choice})}
              /> {choice}
            </label>
          ))}
        </div>
      ))}

      <div className="card yellow">
        <b>Actions de révision possibles</b>
        <p>Si tu as répondu « Un peu » ou « Non », retourne à l’étape 4 et améliore ton brouillon.</p>
        <ul>
          <li>Ajoute une preuve du texte.</li>
          <li>Ajoute une phrase qui explique ton idée.</li>
          <li>Sépare une longue partie en deux paragraphes.</li>
          <li>Remplace un mot vague comme « chose », « affaire », « bon » ou « intéressant ».</li>
        </ul>
      </div>

      <details className="card">
        <summary>Voir mon plan pour comparer</summary>
        <p><b>Introduction :</b> {plan.intro || "À compléter"}</p>
        <p><b>Développement 1 :</b> {plan.dev1 || "À compléter"}</p>
        <p><b>Développement 2 :</b> {plan.dev2 || "À compléter"}</p>
        <p><b>Conclusion :</b> {plan.conclusion || "À compléter"}</p>
      </details>
    </div>
  );
}
