const correctionGroups = [
  {
    id: "mots",
    title: "1. Orthographe des mots courants",
    steps: ["Je relis mon texte lentement.", "Je mets un ? au-dessus des mots dont je doute.", "Je vérifie ces mots dans un dictionnaire ou une liste orthographique."]
  },
  {
    id: "noms",
    title: "2. Nombre du nom",
    steps: ["Je cherche les noms.", "Je demande : un seul ou plusieurs ?", "J’ajoute ou je vérifie le s ou le x au pluriel." ]
  },
  {
    id: "determinants",
    title: "3. Accord du déterminant avec le nom",
    steps: ["Je relie le déterminant au nom.", "Je vérifie le genre : masculin ou féminin.", "Je vérifie le nombre : singulier ou pluriel."]
  },
  {
    id: "adjectifs",
    title: "4. Accord de l’adjectif",
    steps: ["Je trouve le nom que l’adjectif décrit.", "Je vérifie le féminin ou le masculin.", "Je vérifie le singulier ou le pluriel." ]
  },
  {
    id: "verbes-pronom",
    title: "5. Accord du verbe avec un pronom sujet",
    steps: ["Je repère les pronoms : je, tu, il, elle, nous, vous, ils, elles.", "Je trouve le verbe lié au pronom.", "Je vérifie la terminaison du verbe." ]
  },
  {
    id: "verbes-groupe",
    title: "6. Accord du verbe avec un groupe du nom sujet",
    steps: ["Je trouve le verbe.", "Je pose la question : qui est-ce qui ?", "Je remplace le sujet par il, elle, ils ou elles pour vérifier l’accord." ]
  },
  {
    id: "ponctuation",
    title: "7. Ponctuation et majuscules",
    steps: ["Je vérifie chaque début de phrase.", "Je vérifie chaque fin de phrase.", "Je coupe les phrases trop longues." ]
  }
];

function approximateErrorPercent(draft, checks) {
  const words = String(draft || "").trim().split(/\s+/).filter(Boolean).length;
  const done = correctionGroups.filter((group) => checks[`correction-${group.id}`]).length;
  if (!words) return "Aucun brouillon à corriger.";
  if (done >= 6) return "Correction avancée : tu as vérifié presque toutes les grandes catégories.";
  if (done >= 3) return "Correction en cours : continue avec les catégories restantes.";
  return "Correction à commencer : vérifie une catégorie à la fois.";
}

export default function Step6Correction({ draft, checks, setChecks }) {
  const doneCount = correctionGroups.filter((group) => checks[`correction-${group.id}`]).length;

  return (
    <div>
      <h2>Étape 6 — Je corrige les erreurs fréquentes</h2>

      <div className="card yellow">
        <b>But de cette étape</b>
        <p>Maintenant que tes idées sont révisées, tu corriges la langue. Ne corrige pas tout en même temps : fais plusieurs balayages.</p>
      </div>

      <div className="card green">
        <b>Méthode par balayages</b>
        <p>1. Je vérifie les mots dont je doute.</p>
        <p>2. Je vérifie les noms et les groupes du nom.</p>
        <p>3. Je vérifie les verbes.</p>
        <p>4. Je vérifie la ponctuation.</p>
      </div>

      <div className="card">
        <b>Tableau de bord de correction</b>
        <p>Catégories vérifiées : <b>{doneCount}</b> / {correctionGroups.length}</p>
        <p className={doneCount >= 6 ? "green" : "yellow"}>{approximateErrorPercent(draft, checks)}</p>
      </div>

      {correctionGroups.map((group) => (
        <div className="card" key={group.id}>
          <h3>{group.title}</h3>
          <ol>{group.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          <label style={{display: "block", marginTop: 10}}>
            <input
              type="checkbox"
              checked={!!checks[`correction-${group.id}`]}
              onChange={() => setChecks({...checks, [`correction-${group.id}`]: !checks[`correction-${group.id}`]})}
            /> J’ai fait ce balayage dans mon texte.
          </label>
        </div>
      ))}

      <div className="card yellow">
        <b>Conseil pour l’épreuve</b>
        <p>Chaque correction doit laisser une trace mentale claire : je ne devine pas, je vérifie avec une règle, un outil ou une relecture ciblée.</p>
      </div>
    </div>
  );
}
