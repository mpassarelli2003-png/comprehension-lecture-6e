"use client";

import { useEffect, useMemo, useState } from "react";
import baseExercises, { getAutoCorrectionGrid } from "./data/exercises";
import moreExercises from "./data/moreExercises";

const exercises = [...baseExercises, ...moreExercises];
const STORAGE_KEY = "lecture6e_student_work_v5";
const OLD_KEYS = ["lecture6e_student_work_v4", "lecture6e_student_work_v3"];

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
  explicite: { label: "Information explicite", className: "blue", title: "C'est écrit clairement dans le texte.", text: "La réponse est écrite directement. Tu peux presque pointer la phrase avec ton doigt." },
  inference: { label: "Indice pour inférence", className: "yellow", title: "Je lis entre les lignes.", text: "La réponse n'est pas écrite mot pour mot. Je prends des indices et je déduis." },
  reaction: { label: "Exemple pour réagir", className: "pink", title: "Je donne mon avis avec une preuve.", text: "J'utilise cet outil quand je dois dire ce que je pense, ressens ou ferais." },
  important: { label: "Idée importante", className: "green", title: "C'est essentiel.", text: "Cette information aide à comprendre l'idée principale, le problème ou le message." }
};

function detectQuestionWord(prompt = "") {
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
  const base = q?.points >= 2 ? "Réponse développée : idée + preuve + explication." : "Réponse courte, mais complète.";
  if (q?.type === "reagir") return base + " Tu dois parler de toi ET du texte.";
  if (q?.type === "apprecier") return base + " Tu dois donner ton appréciation avec un exemple.";
  if (q?.type === "jugement") return base + " Tu dois donner ton opinion critique avec une preuve.";
  if (q?.type === "interpreter") return base + " Tu dois expliquer ce que tu comprends avec des indices.";
  if (word === "pourquoi") return base + " Tu dois donner une raison.";
  if (word === "comment") return base + " Tu dois expliquer une manière ou un changement.";
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

function splitIntoSentences(text) {
  const parts = String(text || "").match(/[^.!?;:]+[.!?;:]?|.+/g);
  return parts?.filter(Boolean) || [text];
}

function loadDraft() {
  if (typeof window === "undefined") return null;
  for (const key of [STORAGE_KEY, ...OLD_KEYS]) {
    try {
      const value = localStorage.getItem(key);
      if (value) return JSON.parse(value);
    } catch {}
  }
  return null;
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
  const [readingHighlights, setReadingHighlights] = useState({});
  const [highlighterActive, setHighlighterActive] = useState(false);
  const [activeProofTool, setActiveProofTool] = useState("explicite");
  const [readyToSave, setReadyToSave] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Sauvegarde locale prête.");

  useEffect(() => {
    const saved = loadDraft();
    if (saved) {
      const savedExercise = exercises.find((ex) => ex.id === saved.exerciseId) || exercises[0];
      setExercise(savedExercise);
      setAdminJson(JSON.stringify(savedExercise, null, 2));
      setView(saved.view || "student");
      setStep(saved.step || 1);
      setQIndex(Math.min(saved.qIndex || 0, (savedExercise.questions?.length || 1) - 1));
      setNotes(saved.notes || {});
      setProofs(saved.proofs || []);
      setAnswers(saved.answers || {});
      setChecks(saved.checks || {});
      setReadingHighlights(saved.readingHighlights || {});
      setBig(!!saved.big);
      setSpaced(!!saved.spaced);
      setSaveStatus("Travail repris automatiquement.");
    }
    setReadyToSave(true);
  }, []);

  useEffect(() => {
    if (!readyToSave || typeof window === "undefined") return;
    const draft = { exerciseId: exercise.id, view, step, qIndex, notes, proofs, answers, checks, readingHighlights, big, spaced, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setSaveStatus("Sauvegardé automatiquement sur cet appareil.");
  }, [readyToSave, exercise.id, view, step, qIndex, notes, proofs, answers, checks, readingHighlights, big, spaced]);

  const paragraphs = useMemo(() => exercise.text.split("\n").filter(Boolean), [exercise.text]);
  const question = exercise.questions[qIndex] || exercise.questions[0];
  const currentWord = detectQuestionWord(question?.prompt || "");
  const currentProofs = proofs.filter((p) => p.questionId === question?.id);
  const activeTool = proofTools[activeProofTool];
  const checkKey = (label) => `${exercise.id}-${question?.id}-${label}`;
  const hasParagraphTitles = Object.values(notes).some((value) => String(value || "").trim());
  const currentHighlightCount = Object.keys(readingHighlights).filter((key) => key.startsWith(`${exercise.id}-`) && readingHighlights[key]).length;

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
    setReadingHighlights({});
    setHighlighterActive(false);
    setView("student");
    setSaveStatus("Nouveau texte commencé et sauvegardé.");
  }

  function importExercise() {
    try {
      resetForExercise(JSON.parse(adminJson));
    } catch {
      alert("Le JSON contient une erreur.");
    }
  }

  function clearDraft() {
    if (typeof window !== "undefined" && window.confirm("Effacer les réponses sauvegardées sur cet appareil ?")) {
      [STORAGE_KEY, ...OLD_KEYS].forEach((key) => localStorage.removeItem(key));
      setNotes({}); setProofs([]); setAnswers({}); setChecks({}); setReadingHighlights({}); setStep(1); setQIndex(0);
      setSaveStatus("Sauvegarde effacée.");
    }
  }

  function saveContextForVoiceHelp() {
    if (typeof window === "undefined") return;
    localStorage.setItem("lectureCurrentExerciseTitle", exercise.title);
    localStorage.setItem("lectureCurrentQuestionPrompt", question?.prompt || "");
    window.location.href = "/aide-vocale";
  }

  function getSelection() { setSelected(window.getSelection()?.toString() || ""); }
  function addProof(kind) {
    if (!selected.trim()) return;
    setProofs([...proofs, { id: Date.now(), questionId: question.id, text: selected.trim(), kind }]);
    setSelected("");
  }
  function deleteProof(id) { setProofs(proofs.filter((p) => p.id !== id)); }
  function changeProofKind(id, kind) { setProofs(proofs.map((p) => p.id === id ? { ...p, kind } : p)); }
  function useProofInAnswer(text) {
    const previous = answers[question.id] || "";
    const prefix = previous.trim() ? "\nPreuve du texte : " : "Preuve du texte : ";
    setAnswers({ ...answers, [question.id]: previous + prefix + text });
  }
  function clearQuestionProofs() {
    if (window.confirm("Veux-tu effacer tous les surlignages de cette question ?")) setProofs(proofs.filter((p) => p.questionId !== question.id));
  }
  function toggleReadingHighlight(paragraphIndex, sentenceIndex) {
    if (step < 2 || !highlighterActive) return;
    const key = `${exercise.id}-${paragraphIndex}-${sentenceIndex}`;
    setReadingHighlights((old) => ({ ...old, [key]: !old[key] }));
  }
  function clearReadingHighlights() {
    if (window.confirm("Effacer tous les surlignages jaunes de lecture pour ce texte ?")) {
      const next = { ...readingHighlights };
      Object.keys(next).forEach((key) => { if (key.startsWith(`${exercise.id}-`)) delete next[key]; });
      setReadingHighlights(next);
    }
  }

  function renderParagraph(p, i) {
    const summary = String(notes[i] || "").trim();
    const sentences = splitIntoSentences(p);
    return <div className="para" key={i}>{step > 2 && summary && <h3 className="paragraphSubtitle">{summary}</h3>}<p>{sentences.map((sentence, sIndex) => { const key = `${exercise.id}-${i}-${sIndex}`; const highlighted = !!readingHighlights[key]; return <span key={key} onClick={() => toggleReadingHighlight(i, sIndex)} className={`sentenceMarker ${highlighted ? "highlightedSentence" : ""} ${highlighterActive && step >= 2 ? "markerActive" : ""}`} title={highlighterActive && step >= 2 ? "Clique pour surligner ou retirer le surlignage" : "Active d’abord le surligneur jaune"}>{sentence}{" "}</span>; })}</p>{step === 2 && <input value={notes[i] || ""} onChange={(e) => setNotes({...notes, [i]: e.target.value})} placeholder="J’écris un sous-titre/résumé pour ce paragraphe..." />}</div>;
  }

  const TopControls = () => <div className="card"><button onClick={() => setView("home")}>Accueil</button><button onClick={() => setView("choose")}>Changer de texte</button><button className="green" onClick={saveContextForVoiceHelp}>Aide vocale IA pour cette question</button><button onClick={() => setView("progress")}>Mes progrès</button><button onClick={clearDraft}>Effacer ma sauvegarde</button><p className="yellow"><b>{saveStatus}</b> Les réponses, résumés et surlignages restent sur cet appareil.</p></div>;

  if (view === "home") return <main className="page"><section className="card"><h1>Lecture 6e année Québec</h1><p>Application de pratique guidée : lire, comprendre la question, trouver une preuve, répondre et vérifier.</p><p><b>{exercises.length} textes disponibles.</b></p><p className="yellow"><b>{saveStatus}</b></p><div className="grid three"><button className="blue" onClick={() => setView("choose")}>Choisir une lecture</button><button className="green" onClick={() => setView("student")}>Reprendre mon travail</button><button className="violet" onClick={() => setView("teacher")}>Espace enseignant</button></div></section></main>;

  if (view === "choose") return <main className="page"><TopControls /><h1>Choisir une lecture</h1><div className="grid three">{exercises.map((ex) => <section className="card" key={ex.id}><h2>{ex.title}</h2><p><b>{ex.textType}</b> — {ex.category}</p><p>{ex.description}</p><p>{ex.questions.length} questions</p><button className="blue" onClick={() => resetForExercise(ex)}>Commencer</button></section>)}</div></main>;

  if (view === "teacher") return <main className="page"><TopControls /><section className="card"><h1>Espace enseignant</h1><p>Choisir un exercice intégré ou coller un exercice en JSON.</p><select value={exercise.id} onChange={(e) => { const ex = exercises.find((item) => item.id === e.target.value); if (ex) setAdminJson(JSON.stringify(ex, null, 2)); }}><option value="">Choisir un texte</option>{exercises.map((ex) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}</select><textarea style={{minHeight:520}} value={adminJson} onChange={(e) => setAdminJson(e.target.value)} /><button className="green" onClick={importExercise}>Importer / utiliser cet exercice</button></section></main>;

  if (view === "progress") return <main className="page"><TopControls /><section className="card"><h1>Mes progrès</h1><p>Texte actuel : <b>{exercise.title}</b></p>{exercise.questions.map((q, i) => <div className="card" key={q.id}><b>Question {i + 1} : {q.prompt}</b><p>Réponse : {answers[q.id] || "Non répondue"}</p><p>Preuves : {proofs.filter((p) => p.questionId === q.id).length}</p></div>)}</section></main>;

  return <main className="page"><TopControls /><div className="card">{[1,2,3,4,5,6].map((n) => <button key={n} className={step === n ? "blue" : ""} onClick={() => setStep(n)}>Étape {n}</button>)}</div><div className="grid cols"><section className="card"><h1>{exercise.title}</h1><p><b>{exercise.level}</b> — {exercise.textType} — {exercise.category}</p><p className="yellow">Intention : {exercise.intention}</p><button onClick={() => setBig(!big)}>Gros texte</button><button onClick={() => setSpaced(!spaced)}>Espacement</button>{step >= 2 && <div className={`card ${highlighterActive ? "yellow" : ""}`}><b>Marqueur de lecture</b><p>1. Clique sur l’icône du surligneur jaune pour l’activer. 2. Clique sur une phrase pour la surligner. 3. Reclique sur la phrase pour retirer le surlignage.</p><button className={highlighterActive ? "yellow highlighterButton activeHighlighter" : "highlighterButton"} onClick={() => setHighlighterActive(!highlighterActive)} title="Activer ou désactiver le surligneur jaune">🖍️ Surligneur jaune {highlighterActive ? "activé" : "désactivé"}</button>{currentHighlightCount > 0 && <button onClick={clearReadingHighlights}>Effacer les surlignages jaunes</button>}</div>}{step > 2 && hasParagraphTitles && <p className="green"><b>Sous-titres de l’élève :</b> les résumés écrits à l’étape 2 apparaissent au-dessus des paragraphes.</p>}<div onMouseUp={getSelection} className={`reader ${big ? "big" : ""} ${spaced ? "spaced" : ""}`}>{paragraphs.map((p, i) => renderParagraph(p, i))}</div></section><section className="card">{step === 1 && <div><h2>Étape 1 — Avant de lire</h2><ul className="list"><li>Je lis le titre.</li><li>Je prédis le sujet.</li><li>J’active ce que je connais déjà.</li><li>Je lis l’intention de lecture.</li></ul></div>}{step === 2 && <div><h2>Étape 2 — Pendant la lecture</h2><p>Active le surligneur jaune, puis clique sur les phrases importantes. Ces surlignages resteront visibles aux autres étapes.</p><p>Écris aussi une idée courte : ces phrases deviendront les sous-titres des paragraphes aux étapes suivantes.</p></div>}{step >= 3 && <div><div className="card"><b>Question {qIndex + 1} / {exercise.questions.length}</b><h2>{question.prompt}</h2><p>{question.type} — {question.points} point(s)</p></div><button disabled={qIndex === 0} onClick={() => setQIndex(Math.max(0, qIndex - 1))}>Question précédente</button><button disabled={qIndex === exercise.questions.length - 1} onClick={() => setQIndex(Math.min(exercise.questions.length - 1, qIndex + 1))}>Question suivante</button>{step === 3 && <div><h2>Étape 3 — Je comprends la question</h2><p className="yellow">Mot-question : {currentWord}</p><p>{wordHelp[currentWord]}</p><p><b>Ma première réponse</b></p><textarea value={answers[question.id] || ""} onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})} placeholder="Écris ici ta première réponse. Elle est sauvegardée automatiquement." /><p className="yellow">Conseil : réponds avec les mots de la question, puis retourne au texte pour trouver une preuve.</p></div>}{step === 4 && <div><h2>Étape 4 — Je trouve mes preuves</h2><p>Sélectionne un bout du texte à gauche, choisis l’outil qui convient, puis appuie sur Surligner.</p><p>Sélection actuelle : <b>{selected || "Aucun texte sélectionné"}</b></p><div>{Object.entries(proofTools).map(([key, tool]) => <button key={key} className={activeProofTool === key ? tool.className : ""} onClick={() => setActiveProofTool(key)}>{tool.label}</button>)}</div><div className={`card ${activeTool.className}`}><h3>{activeTool.title}</h3><p>{activeTool.text}</p></div><button className={activeTool.className} onClick={() => addProof(activeProofTool)}>Surligner avec cet outil</button>{currentProofs.length > 0 && <button onClick={clearQuestionProofs}>Effacer tous mes surlignages</button>}<div className="card"><h3>Mes surlignages sauvegardés</h3>{currentProofs.length === 0 ? <p>Aucun surlignage pour cette question.</p> : currentProofs.map((p, index) => <div className="card" key={p.id}><p><b>{index + 1}. {proofTools[p.kind]?.label || p.kind}</b></p><p className={proofTools[p.kind]?.className || "yellow"}>{p.text}</p><label>Changer le type : <select value={p.kind} onChange={(e) => changeProofKind(p.id, e.target.value)}>{Object.entries(proofTools).map(([key, tool]) => <option key={key} value={key}>{tool.label}</option>)}</select></label><div><button onClick={() => deleteProof(p.id)}>Supprimer</button><button className="green" onClick={() => useProofInAnswer(p.text)}>Utiliser dans ma réponse</button></div></div>)}</div></div>}{step === 5 && <div><h2>Étape 5 — J’écris et j’améliore ma réponse</h2><div className="card yellow"><b>Ce que la question demande :</b><p>Mot-question : {currentWord}. {wordHelp[currentWord]}</p><p>{responseTarget(question, currentWord)}</p></div><div className="card"><b>Mes preuves de l’étape 4</b>{currentProofs.length === 0 ? <p>Aucune preuve choisie. Retourne à l’étape 4 si tu veux t’aider.</p> : currentProofs.map((p) => <p className={proofTools[p.kind]?.className || "yellow"} key={p.id}><b>{proofTools[p.kind]?.label || p.kind} :</b> {p.text}</p>)}</div><button className="green" onClick={() => setAnswers({...answers, [question.id]: starter(question.type)})}>Insérer un début de phrase</button><textarea value={answers[question.id] || ""} onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})} placeholder="Écris ta réponse complète ici. Elle est sauvegardée automatiquement." /><details><summary>J’ai besoin d’un indice, sans avoir la réponse</summary><ol>{question.hints.map((h) => <li key={h}>{h}</li>)}</ol></details></div>}{step === 6 && <div><h2>Étape 6 — Je vérifie</h2><h3>Grille d’auto-correction</h3>{getAutoCorrectionGrid().map((c) => <div className="card" key={c}><p>{c}</p>{["Oui","Un peu","Non"].map((choice) => <label key={choice} style={{marginRight:12}}><input type="radio" name={checkKey(c)} checked={checks[checkKey(c)] === choice} onChange={() => setChecks({...checks, [checkKey(c)]: choice})} /> {choice}</label>)}</div>)}<p><b>Réponse actuelle :</b></p><p>{answers[question.id] || "Aucune réponse."}</p><details><summary>{correctionTitle(question.type)}</summary><p>{question.expectedAnswer}</p>{question.isPersonalAnswer && <p>Cette réponse est un exemple. Une autre réponse peut être correcte si elle est bien expliquée avec le texte.</p>}</details></div>}</div>}</section></div></main>;
}
