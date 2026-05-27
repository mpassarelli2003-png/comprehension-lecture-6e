"use client";

import { useMemo, useState } from "react";

const sampleExercise = {
  id: "sample-1",
  title: "La boîte à messages du parc",
  level: "6e année",
  textType: "narratif",
  intention: "Lire pour comprendre comment un petit geste peut transformer une communauté.",
  text: `Dans le quartier des Érables, Samir traversait le parc chaque matin pour se rendre à l'école. Il remarquait souvent que les bancs étaient occupés par des personnes qui semblaient pressées, fatiguées ou seules. Personne ne se parlait vraiment, même si tout le monde se croisait au même endroit.

Un lundi, Samir trouva une vieille boîte de bois près du grand érable. Avec l'accord de sa grand-mère, il la nettoya, la peintura et y inscrivit : « Dépose ici un mot gentil pour quelqu'un du quartier. » Le lendemain, il y glissa le premier message : « Merci à la personne qui ramasse les déchets près du terrain de jeux. »

Au début, les passants lisaient l'affiche avec curiosité sans oser participer. Puis, une fillette déposa un dessin. Un voisin écrivit un mot d'encouragement pour le jardinier bénévole. Une dame remercia les enfants qui lui avaient rapporté son foulard. Peu à peu, la boîte se remplit de phrases simples, mais lumineuses.

À la fin du mois, les habitants organisèrent une petite rencontre autour de l'érable. Des personnes qui se saluaient à peine se mirent à discuter. Samir comprit alors que son idée n'avait pas seulement rempli une boîte : elle avait ouvert une porte entre les gens. Depuis ce jour, le parc ne fut plus seulement un lieu de passage, mais un lieu de rencontre.`,
  questions: [
    { id: "q1", prompt: "Qui est le personnage principal du récit ?", type: "comprendre", points: 1, expectedAnswer: "Le personnage principal est Samir.", hints: ["Cherche le nom du personnage qui revient souvent.", "Le personnage principal pose l'action importante.", "Commence par : Le personnage principal est..."] },
    { id: "q2", prompt: "Pourquoi Samir installe-t-il une boîte à messages dans le parc ?", type: "comprendre", points: 2, expectedAnswer: "Il l'installe parce qu'il remarque que les gens se croisent sans se parler et il veut encourager les gestes gentils dans le quartier.", hints: ["Le mot pourquoi cherche une raison.", "Relis le premier paragraphe et le début du deuxième.", "Commence par : Samir installe la boîte parce que..."] },
    { id: "q3", prompt: "Que signifie la phrase : elle avait ouvert une porte entre les gens ?", type: "interpreter", points: 2, expectedAnswer: "Cette phrase signifie que la boîte a aidé les habitants à se parler, à se rapprocher et à créer des liens.", hints: ["Ce n'est pas une vraie porte. C'est une expression.", "Cherche ce qui change dans le quartier à la fin.", "Commence par : Cette phrase veut dire que..."] },
    { id: "q4", prompt: "Comment aurais-tu réagi si tu avais découvert cette boîte dans ton quartier ? Explique avec un élément du texte.", type: "reagir", points: 2, expectedAnswer: "Réponse personnelle appuyée sur le texte.", hints: ["Tu peux parler de toi, mais tu dois aussi utiliser le texte.", "Choisis un passage sur les messages ou la rencontre finale.", "Commence par : J'aurais réagi... parce que..."] },
    { id: "q5", prompt: "As-tu apprécié ce récit ? Donne ton opinion en utilisant un critère précis.", type: "apprecier", points: 2, expectedAnswer: "Réponse personnelle avec critère précis et exemple du texte.", hints: ["Choisis un critère : thème, personnage, fin, message ou vocabulaire.", "Ajoute un exemple du texte.", "Commence par : J'ai apprécié ce récit parce que..."] }
  ]
};

const wordHelp = {
  qui: "Je cherche une personne, un personnage ou un animal.",
  où: "Je cherche un lieu ou un endroit.",
  quand: "Je cherche un moment, une date, une saison ou une époque.",
  pourquoi: "Je cherche une raison ou une cause.",
  comment: "Je cherche une manière, une méthode ou une façon.",
  combien: "Je cherche un nombre, une quantité ou une durée.",
  quoi: "Je cherche une action, une idée ou un objet."
};

function detectQuestionWord(prompt) {
  const lower = prompt.toLowerCase();
  if (lower.includes("pourquoi")) return "pourquoi";
  if (lower.includes("comment")) return "comment";
  if (lower.includes("combien")) return "combien";
  if (lower.includes("quand")) return "quand";
  if (lower.includes("où")) return "où";
  if (lower.includes("qui")) return "qui";
  return "quoi";
}

function starter(type) {
  if (type === "comprendre") return "Je réponds : ";
  if (type === "interpreter") return "Je pense que cela veut dire que... Dans le texte, on voit que...";
  if (type === "reagir") return "J'aurais réagi... parce que... Dans le texte...";
  return "J'ai apprécié ce récit parce que... Par exemple...";
}

export default function Home() {
  const [view, setView] = useState("home");
  const [exercise, setExercise] = useState(sampleExercise);
  const [adminJson, setAdminJson] = useState(JSON.stringify(sampleExercise, null, 2));
  const [step, setStep] = useState(1);
  const [qIndex, setQIndex] = useState(0);
  const [big, setBig] = useState(false);
  const [spaced, setSpaced] = useState(false);
  const [notes, setNotes] = useState({});
  const [selected, setSelected] = useState("");
  const [proofs, setProofs] = useState([]);
  const [answers, setAnswers] = useState({});
  const [checks, setChecks] = useState({});

  const paragraphs = useMemo(() => exercise.text.split("\n").filter(Boolean), [exercise.text]);
  const question = exercise.questions[qIndex];
  const currentWord = detectQuestionWord(question?.prompt || "");
  const currentProofs = proofs.filter((p) => p.questionId === question?.id);

  function importExercise() {
    try {
      const parsed = JSON.parse(adminJson);
      setExercise(parsed);
      setView("home");
      setStep(1);
      setQIndex(0);
      setAnswers({});
      setProofs([]);
      setChecks({});
    } catch {
      alert("Le JSON contient une erreur.");
    }
  }

  function getSelection() {
    setSelected(window.getSelection()?.toString() || "");
  }

  function addProof(kind) {
    if (!selected.trim()) return;
    setProofs([...proofs, { id: Date.now(), questionId: question.id, text: selected.trim(), kind }]);
    setSelected("");
  }

  if (view === "home") return (
    <main className="page"><section className="card">
      <h1>Lecture 6e année Québec</h1>
      <p>Application de pratique guidée : lire, comprendre la question, trouver une preuve dans le texte, répondre et s'auto-corriger.</p>
      <div className="grid three">
        <button className="blue" onClick={() => setView("student")}>Je pratique</button>
        <button className="green" onClick={() => setView("teacher")}>Espace enseignant</button>
        <button className="violet" onClick={() => setView("progress")}>Mes progrès</button>
      </div>
    </section></main>
  );

  if (view === "teacher") return (
    <main className="page"><section className="card">
      <button onClick={() => setView("home")}>Accueil</button>
      <h1>Espace enseignant</h1>
      <p>Colle ici un exercice en format JSON. Utilise seulement des textes dont tu as les droits.</p>
      <textarea style={{minHeight:520}} value={adminJson} onChange={(e) => setAdminJson(e.target.value)} />
      <button className="green" onClick={importExercise}>Importer cet exercice</button>
    </section></main>
  );

  if (view === "progress") return (
    <main className="page"><section className="card">
      <button onClick={() => setView("home")}>Accueil</button>
      <h1>Mes progrès</h1>
      {exercise.questions.map((q, i) => <div className="card" key={q.id}>
        <b>Question {i + 1} : {q.prompt}</b>
        <p>Réponse : {answers[q.id] || "Non répondue"}</p>
        <p>Preuves : {proofs.filter((p) => p.questionId === q.id).length}</p>
      </div>)}
    </section></main>
  );

  return (
    <main className="page">
      <div className="card">
        <button onClick={() => setView("home")}>Accueil</button>
        {[1,2,3,4,5,6].map((n) => <button key={n} className={step === n ? "blue" : ""} onClick={() => setStep(n)}>Étape {n}</button>)}
      </div>
      <div className="grid cols">
        <section className="card">
          <h1>{exercise.title}</h1>
          <p><b>{exercise.level}</b> - Texte {exercise.textType}</p>
          <p className="yellow">Intention : {exercise.intention}</p>
          <button onClick={() => setBig(!big)}>Gros texte</button>
          <button onClick={() => setSpaced(!spaced)}>Espacement</button>
          <div onMouseUp={getSelection} className={`reader ${big ? "big" : ""} ${spaced ? "spaced" : ""}`}>
            {paragraphs.map((p, i) => <div className="para" key={i}>
              <p>{p}</p>
              {step === 2 && <input value={notes[i] || ""} onChange={(e) => setNotes({...notes, [i]: e.target.value})} placeholder="Je résume ce paragraphe en quelques mots..." />}
            </div>)}
          </div>
        </section>
        <section className="card">
          {step === 1 && <div><h2>Étape 1 — Avant de lire</h2><ul className="list"><li>Je lis le titre.</li><li>Je prédis le sujet.</li><li>J'active ce que je connais déjà.</li><li>Je lis l'intention de lecture.</li></ul></div>}
          {step === 2 && <div><h2>Étape 2 — Pendant la lecture</h2><p>Lis un paragraphe à la fois et écris une idée courte.</p><ul className="list"><li>Je relis si je bloque.</li><li>Je regarde autour d'un mot difficile.</li><li>Je repère les idées importantes.</li></ul></div>}
          {step >= 3 && <div>
            <div className="card"><b>Question {qIndex + 1} / {exercise.questions.length}</b><h2>{question.prompt}</h2><p>{question.type} - {question.points} point(s)</p></div>
            <button disabled={qIndex === 0} onClick={() => setQIndex(Math.max(0, qIndex - 1))}>Question précédente</button>
            <button disabled={qIndex === exercise.questions.length - 1} onClick={() => setQIndex(Math.min(exercise.questions.length - 1, qIndex + 1))}>Question suivante</button>
            {step === 3 && <div><h2>Étape 3 — Je comprends la question</h2><p className="yellow">Mot-question : {currentWord}</p><p>{wordHelp[currentWord]}</p></div>}
            {step === 4 && <div><h2>Étape 4 — Je trouve mes preuves</h2><p>Sélection actuelle : <b>{selected || "Aucun texte sélectionné"}</b></p><button onClick={() => addProof("explicite")}>Information explicite</button><button onClick={() => addProof("inference")}>Indice pour inférence</button><button onClick={() => addProof("reaction")}>Exemple pour réagir</button><button onClick={() => addProof("important")}>Idée importante</button>{currentProofs.map((p) => <p className="yellow" key={p.id}>{p.kind} : {p.text}</p>)}</div>}
            {step === 5 && <div><h2>Étape 5 — J'écris ma réponse</h2><button className="green" onClick={() => setAnswers({...answers, [question.id]: starter(question.type)})}>Insérer un début de phrase</button><textarea value={answers[question.id] || ""} onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})} placeholder="Écris ta réponse complète ici..." /><details><summary>Voir les indices</summary><ol>{question.hints.map((h) => <li key={h}>{h}</li>)}</ol></details></div>}
            {step === 6 && <div><h2>Étape 6 — Je vérifie</h2>{["J'ai répondu à la question.","J'ai utilisé une preuve du texte.","Ma réponse est complète.","Mon explication est claire.","J'ai relu ma réponse."].map((c) => <label key={c} style={{display:"block", margin:"8px"}}><input type="checkbox" checked={!!checks[c]} onChange={(e) => setChecks({...checks, [c]: e.target.checked})} /> {c}</label>)}<p><b>Réponse actuelle :</b></p><p>{answers[question.id] || "Aucune réponse."}</p><details><summary>Corrigé enseignant</summary><p>{question.expectedAnswer}</p></details></div>}
          </div>}
        </section>
      </div>
    </main>
  );
}
