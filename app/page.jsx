"use client";

import { useMemo, useState } from "react";
import exercises, { getAutoCorrectionGrid } from "./data/exercises";

const wordHelp = {
  qui: "Je cherche une personne, un personnage ou un animal.",
  où: "Je cherche un lieu ou un endroit.",
  quand: "Je cherche un moment, une date, une saison ou une époque.",
  pourquoi: "Je cherche une raison ou une cause.",
  comment: "Je cherche une manière, une méthode ou une façon.",
  combien: "Je cherche un nombre, une quantité ou une durée.",
  quoi: "Je cherche une action, une idée ou un objet."
};

const proofTools = {
  explicite: { label: "Information explicite", className: "blue", title: "C'est écrit clairement dans le texte.", text: "Utilise cet outil quand la réponse est directement écrite. Tu peux presque pointer la phrase avec ton doigt.", question: "Est-ce que je peux copier une partie du texte pour répondre ?" },
  inference: { label: "Indice pour inférence", className: "yellow", title: "Je dois lire entre les lignes.", text: "Utilise cet outil quand la réponse n'est pas écrite mot pour mot. Tu dois prendre des indices et faire une petite déduction.", question: "Qu'est-ce que le texte me fait comprendre sans le dire directement ?" },
  reaction: { label: "Exemple pour réagir", className: "pink", title: "Je donne mon avis avec une preuve.", text: "Utilise cet outil quand la question te demande ce que tu penses, ce que tu ressens ou comment tu aurais réagi.", question: "Quel passage du texte explique ma réaction ?" },
  important: { label: "Idée importante", className: "green", title: "C'est une idée essentielle du texte.", text: "Utilise cet outil pour surligner une information qui aide à comprendre le message, le problème, la solution ou l'idée principale.", question: "Si j'enlève cette information, est-ce que je comprends moins bien le texte ?" }
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
  if (type === "comprendre") return "Dans le texte, on apprend que...";
  if (type === "interpreter") return "Je pense que cela veut dire que... Dans le texte, un indice montre que...";
  if (type === "reagir") return "Je réagirais... parce que... Dans le texte...";
  if (type === "jugement") return "Selon moi... parce que... Un élément du texte montre que...";
  return "J'ai apprécié... parce que... Par exemple...";
}

function responseTarget(q, word) {
  const base = q.points >= 2 ? "Réponse développée : idée + preuve + explication." : "Réponse courte, mais complète.";
  if (q.type === "reagir") return base + " Tu dois parler de toi ET du texte.";
  if (q.type === "apprecier") return base + " Tu dois donner un critère : personnage, message, fin, vocabulaire ou passage.";
  if (q.type === "jugement") return base + " Tu dois donner ton opinion critique avec un élément du texte.";
  if (q.type === "interpreter") return base + " Tu dois expliquer ce que tu comprends avec des indices.";
  if (word === "pourquoi") return base + " Tu dois donner une raison.";
  if (word === "comment") return base + " Tu dois expliquer la manière ou les étapes.";
  return base + " Tu dois répondre exactement à ce qui est demandé.";
}

function correctionTitle(type) {
  if (type === "comprendre") return "Réponse attendue";
  if (type === "interpreter") return "Exemple de réponse plausible";
  if (type === "reagir") return "Exemple de réaction justifiée";
  if (type === "apprecier") return "Exemple d'appréciation";
  if (type === "jugement") return "Exemple de jugement critique";
  return "Corrigé";
}

export default function Home() {
  const [view, setView] = useState("home");
  const [exercise, setExercise] = useState(exercises[0]);
  const [adminJson, setAdminJson] = useState(JSON.stringify(exercises[0], null, 2));
  const [step, setStep] = useState(1);
  const [qIndex, setQIndex] = useState(0);
  const [big, setBig] = useState(false);
  const [spaced, setSpaced] = useState(false);
  const [notes, setNotes] = useState({});
  const [selected, setSelected] = useState("");
  const [proofs, setProofs] = useState([]);
  const [answers, setAnswers] = useState({});
  const [checks, setChecks] = useState({});
  const [activeProofTool, setActiveProofTool] = useState("explicite");

  const paragraphs = useMemo(() => exercise.text.split("\n").filter(Boolean), [exercise.text]);
  const question = exercise.questions[qIndex];
  const currentWord = detectQuestionWord(question?.prompt || "");
  const currentProofs = proofs.filter((p) => p.questionId === question?.id);
  const activeTool = proofTools[activeProofTool];
  const checkKey = (label) => `${exercise.id}-${question?.id}-${label}`;

  function resetForExercise(nextExercise) {
    setExercise(nextExercise);
    setAdminJson(JSON.stringify(nextExercise, null, 2));
    setStep(1);
    setQIndex(0);
    setNotes({});
    setSelected("");
    setProofs([]);
    setAnswers({});
    setChecks({});
    setView("student");
  }

  function importExercise() {
    try {
      const parsed = JSON.parse(adminJson);
      resetForExercise(parsed);
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

  function deleteProof(id) {
    setProofs(proofs.filter((p) => p.id !== id));
  }

  function changeProofKind(id, kind) {
    setProofs(proofs.map((p) => p.id === id ? { ...p, kind } : p));
  }

  function useProofInAnswer(text) {
    const previous = answers[question.id] || "";
    const prefix = previous.trim() ? "\nPreuve du texte : " : "Preuve du texte : ";
    setAnswers({ ...answers, [question.id]: previous + prefix + text });
  }

  function clearQuestionProofs() {
    if (window.confirm("Veux-tu effacer tous les surlignages de cette question ?")) {
      setProofs(proofs.filter((p) => p.questionId !== question.id));
    }
  }

  if (view === "home") {
    return <main className="page"><section className="card"><h1>Lecture 6e année Québec</h1><p>Application de pratique guidée : lire, comprendre la question, trouver une preuve, répondre et vérifier.</p><div className="grid three"><button className="blue" onClick={() => setView("choose")}>Choisir une lecture</button><button className="green" onClick={() => setView("teacher")}>Espace enseignant</button><button className="violet" onClick={() => setView("progress")}>Mes progrès</button></div></section></main>;
  }

  if (view === "choose") {
    return <main className="page"><button onClick={() => setView("home")}>Accueil</button><h1>Choisir une lecture</h1><div className="grid three">{exercises.map((ex) => <section className="card" key={ex.id}><h2>{ex.title}</h2><p><b>{ex.textType}</b> — {ex.category}</p><p>{ex.description}</p><p>{ex.questions.length} questions</p><button className="blue" onClick={() => resetForExercise(ex)}>Commencer</button></section>)}</div></main>;
  }

  if (view === "teacher") {
    return <main className="page"><section className="card"><button onClick={() => setView("home")}>Accueil</button><h1>Espace enseignant</h1><p>Choisir un exercice intégré ou coller un exercice en JSON.</p><select value={exercise.id} onChange={(e) => { const ex = exercises.find((item) => item.id === e.target.value); if (ex) setAdminJson(JSON.stringify(ex, null, 2)); }}><option value="">Choisir un texte</option>{exercises.map((ex) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}</select><textarea style={{minHeight:520}} value={adminJson} onChange={(e) => setAdminJson(e.target.value)} /><button className="green" onClick={importExercise}>Importer / utiliser cet exercice</button></section></main>;
  }

  if (view === "progress") {
    return <main className="page"><section className="card"><button onClick={() => setView("home")}>Accueil</button><h1>Mes progrès</h1><p>Texte actuel : <b>{exercise.title}</b></p>{exercise.questions.map((q, i) => <div className="card" key={q.id}><b>Question {i + 1} : {q.prompt}</b><p>Réponse : {answers[q.id] || "Non répondue"}</p><p>Preuves : {proofs.filter((p) => p.questionId === q.id).length}</p></div>)}</section></main>;
  }

  return <main className="page"><div className="card"><button onClick={() => setView("home")}>Accueil</button><button onClick={() => setView("choose")}>Changer de texte</button>{[1,2,3,4,5,6].map((n) => <button key={n} className={step === n ? "blue" : ""} onClick={() => setStep(n)}>Étape {n}</button>)}</div><div className="grid cols"><section className="card"><h1>{exercise.title}</h1><p><b>{exercise.level}</b> — {exercise.textType} — {exercise.category}</p><p className="yellow">Intention : {exercise.intention}</p><button onClick={() => setBig(!big)}>Gros texte</button><button onClick={() => setSpaced(!spaced)}>Espacement</button><div onMouseUp={getSelection} className={`reader ${big ? "big" : ""} ${spaced ? "spaced" : ""}`}>{paragraphs.map((p, i) => <div className="para" key={i}><p>{p}</p>{step === 2 && <input value={notes[i] || ""} onChange={(e) => setNotes({...notes, [i]: e.target.value})} placeholder="Je résume ce paragraphe en quelques mots..." />}</div>)}</div></section><section className="card">{step === 1 && <div><h2>Étape 1 — Avant de lire</h2><ul className="list"><li>Je lis le titre.</li><li>Je prédis le sujet.</li><li>J'active ce que je connais déjà.</li><li>Je lis l'intention de lecture.</li></ul></div>}{step === 2 && <div><h2>Étape 2 — Pendant la lecture</h2><p>Lis un paragraphe à la fois et écris une idée courte.</p><ul className="list"><li>Je relis si je bloque.</li><li>Je regarde autour d'un mot difficile.</li><li>Je repère les idées importantes.</li></ul></div>}{step >= 3 && <div><div className="card"><b>Question {qIndex + 1} / {exercise.questions.length}</b><h2>{question.prompt}</h2><p>{question.type} — {question.points} point(s)</p></div><button disabled={qIndex === 0} onClick={() => setQIndex(Math.max(0, qIndex - 1))}>Question précédente</button><button disabled={qIndex === exercise.questions.length - 1} onClick={() => setQIndex(Math.min(exercise.questions.length - 1, qIndex + 1))}>Question suivante</button>{step === 3 && <div><h2>Étape 3 — Je comprends la question</h2><p className="yellow">Mot-question : {currentWord}</p><p>{wordHelp[currentWord]}</p><p><b>Ma première réponse</b></p><textarea value={answers[question.id] || ""} onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})} placeholder="Écris ici ta première réponse. Tu pourras l'améliorer aux étapes 4 et 5." /><p className="yellow">Conseil : réponds avec les mots de la question, puis retourne au texte pour trouver une preuve.</p></div>}{step === 4 && <div><h2>Étape 4 — Je trouve mes preuves</h2><p>Sélectionne un bout du texte à gauche, choisis l'outil qui convient, puis appuie sur Surligner.</p><p>Sélection actuelle : <b>{selected || "Aucun texte sélectionné"}</b></p><div>{Object.entries(proofTools).map(([key, tool]) => <button key={key} className={activeProofTool === key ? tool.className : ""} onClick={() => setActiveProofTool(key)}>{tool.label}</button>)}</div><div className={`card ${activeTool.className}`}><h3>{activeTool.title}</h3><p>{activeTool.text}</p><p><b>Question à me poser :</b> {activeTool.question}</p></div><button className={activeTool.className} onClick={() => addProof(activeProofTool)}>Surligner avec cet outil</button>{currentProofs.length > 0 && <button onClick={clearQuestionProofs}>Effacer tous mes surlignages</button>}<div className="card"><h3>Mes surlignages</h3>{currentProofs.length === 0 ? <p>Aucun surlignage pour cette question.</p> : currentProofs.map((p, index) => <div className="card" key={p.id}><p><b>{index + 1}. {proofTools[p.kind]?.label || p.kind}</b></p><p className={proofTools[p.kind]?.className || "yellow"}>{p.text}</p><label>Changer le type : <select value={p.kind} onChange={(e) => changeProofKind(p.id, e.target.value)}>{Object.entries(proofTools).map(([key, tool]) => <option key={key} value={key}>{tool.label}</option>)}</select></label><div><button onClick={() => deleteProof(p.id)}>Supprimer</button><button className="green" onClick={() => useProofInAnswer(p.text)}>Utiliser dans ma réponse</button></div></div>)}</div></div>}{step === 5 && <div><h2>Étape 5 — J'écris et j'améliore ma réponse</h2><div className="card yellow"><b>Ce que la question demande :</b><p>Mot-question : {currentWord}. {wordHelp[currentWord]}</p><p>{responseTarget(question, currentWord)}</p></div><div className="card"><b>Ma recette de réponse complète</b><ol><li>Je réponds clairement à la question.</li><li>J'ajoute une preuve ou un indice du texte.</li><li>J'explique mon idée avec mes mots.</li></ol></div><div className="card"><b>Mes preuves de l'étape 4</b>{currentProofs.length === 0 ? <p>Aucune preuve choisie. Retourne à l'étape 4 si tu veux t'aider.</p> : currentProofs.map((p) => <p className={proofTools[p.kind]?.className || "yellow"} key={p.id}><b>{proofTools[p.kind]?.label || p.kind} :</b> {p.text}</p>)}</div><div className="card"><b>Avant d'écrire, je coche :</b>{["Je comprends ce que la question demande.","J'ai au moins une preuve ou un indice.","Je sais si je dois comprendre, inférer, réagir ou apprécier.","Je vais écrire une phrase complète."].map((c) => <label key={c} style={{display:"block", margin:"8px"}}><input type="checkbox" checked={!!checks[checkKey(c)]} onChange={(e) => setChecks({...checks, [checkKey(c)]: e.target.checked})} /> {c}</label>)}</div><button className="green" onClick={() => setAnswers({...answers, [question.id]: starter(question.type)})}>Insérer un début de phrase</button><textarea value={answers[question.id] || ""} onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})} placeholder="Écris ta réponse complète ici. Essaie : réponse + preuve + explication." /><div className="card green"><b>Je relis ma réponse :</b>{["J'ai repris des mots de la question.","Ma réponse répond vraiment à la question.","J'ai utilisé une preuve ou un indice du texte.","J'ai expliqué mon idée.","Je n'ai pas seulement écrit oui, non ou un seul mot."].map((c) => <label key={c} style={{display:"block", margin:"8px"}}><input type="checkbox" checked={!!checks[checkKey(c)]} onChange={(e) => setChecks({...checks, [checkKey(c)]: e.target.checked})} /> {c}</label>)}</div><details><summary>J'ai besoin d'un indice, sans avoir la réponse</summary><ol>{question.hints.map((h) => <li key={h}>{h}</li>)}</ol></details></div>}{step === 6 && <div><h2>Étape 6 — Je vérifie</h2><h3>Grille d'auto-correction</h3>{getAutoCorrectionGrid().map((c) => <div className="card" key={c}><p>{c}</p>{["Oui","Un peu","Non"].map((choice) => <label key={choice} style={{marginRight:12}}><input type="radio" name={checkKey(c)} checked={checks[checkKey(c)] === choice} onChange={() => setChecks({...checks, [checkKey(c)]: choice})} /> {choice}</label>)}</div>)}<p><b>Réponse actuelle :</b></p><p>{answers[question.id] || "Aucune réponse."}</p><details><summary>{correctionTitle(question.type)}</summary><p>{question.expectedAnswer}</p>{question.isPersonalAnswer && <p>Cette réponse est un exemple. Une autre réponse peut être correcte si elle est bien expliquée avec le texte.</p>}</details></div>}</div>}</section></div></main>;
}
