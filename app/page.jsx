"use client";

import { useEffect, useMemo, useState } from "react";
import baseExercises from "./data/exercises";
import moreExercises from "./data/moreExercises";
import genesisExercise from "./data/genesisExercise";

const exercises = [...baseExercises, ...moreExercises, genesisExercise];
const STORAGE_KEY = "lecture6e_student_work_v8";
const OLD_KEYS = ["lecture6e_student_work_v7", "lecture6e_student_work_v6", "lecture6e_student_work_v5", "lecture6e_student_work_v4", "lecture6e_student_work_v3"];

const wordHelp = {
  qui: "Je cherche une personne, un personnage ou un animal.", où: "Je cherche un lieu ou un endroit.", quand: "Je cherche un moment, une date, une saison ou une époque.", pourquoi: "Je cherche une raison ou une cause.", comment: "Je cherche une manière, une méthode ou une façon.", combien: "Je cherche un nombre, une quantité ou une durée.", quoi: "Je cherche une action, une idée ou un objet."
};

const proofTools = {
  explicite: { label: "Information explicite", className: "blue", text: "La réponse est écrite directement dans le texte." },
  inference: { label: "Indice pour inférence", className: "yellow", text: "Je prends des indices et je déduis." },
  reaction: { label: "Exemple pour réagir", className: "pink", text: "Je dis ce que je pense et j’appuie mon idée sur le texte." },
  important: { label: "Idée importante", className: "green", text: "Cette information aide à comprendre le message ou l’idée principale." }
};

function detectQuestionWord(prompt = "") {
  const lower = prompt.toLowerCase();
  for (const w of ["pourquoi", "comment", "combien", "quand", "où", "qui"]) if (lower.includes(w)) return w;
  return "quoi";
}
function starter(type) {
  if (type === "comprendre") return "Dans le texte, on apprend que...";
  if (type === "interpreter") return "Je pense que cela veut dire que... Dans le texte, un indice montre que...";
  if (type === "reagir") return "Je réagirais... parce que... Dans le texte...";
  if (type === "jugement") return "Selon moi... parce que... Un élément du texte montre que...";
  return "J’ai apprécié... parce que... Par exemple...";
}
function responseTarget(q, word) {
  const base = q?.points >= 2 ? "Réponse développée : idée + preuve + explication." : "Réponse courte, mais complète.";
  if (["reagir", "apprecier", "jugement"].includes(q?.type)) return base + " Tu dois donner ton idée avec une preuve du texte.";
  if (q?.type === "interpreter") return base + " Tu dois expliquer ce que tu comprends avec des indices.";
  if (word === "pourquoi") return base + " Tu dois donner une raison.";
  if (word === "comment") return base + " Tu dois expliquer une manière ou un changement.";
  return base + " Tu dois répondre exactement à ce qui est demandé.";
}
function splitIntoSentences(text) { return String(text || "").match(/[^.!?;:]+[.!?;:]?|.+/g)?.filter(Boolean) || [text]; }
function clean(text) { return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }
function trimText(text, max = 125) { const t = String(text || "").replace(/\s+/g, " ").trim().replace(/[.]+$/, ""); return t.length <= max ? t : t.slice(0, max - 3).trim() + "..."; }
function loadDraft() {
  if (typeof window === "undefined") return null;
  for (const key of [STORAGE_KEY, ...OLD_KEYS]) { try { const v = localStorage.getItem(key); if (v) return JSON.parse(v); } catch {} }
  return null;
}
function proofLabel(index) { return ["Première preuve du texte", "Deuxième preuve du texte", "Troisième preuve du texte", "Quatrième preuve du texte", "Cinquième preuve du texte"][index] || `${index + 1}e preuve du texte`; }
function mainIdea(ex) { return trimText(String(ex.mainIdea || ex.intention || ex.description || `Comprendre ${ex.title}`).replace(/^Lire pour comprendre\s*/i, "Comprendre "), 160); }
function validationChoices(ex) {
  const correctMainIdea = mainIdea(ex);
  const mainIdeaOptions = [correctMainIdea, ...exercises.filter((e) => e.id !== ex.id).map(mainIdea)].filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 4);
  const correctElements = (ex.questions || []).filter((q) => !q.isPersonalAnswer).map((q) => trimText(q.expectedAnswer)).filter(Boolean).slice(0, 4);
  const distractors = exercises.filter((e) => e.id !== ex.id).flatMap((e) => (e.questions || []).filter((q) => !q.isPersonalAnswer).map((q) => trimText(q.expectedAnswer))).filter(Boolean).slice(0, 4);
  const keyElementOptions = [...correctElements, ...distractors].filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 8);
  return { correctMainIdea, mainIdeaOptions, correctElements, keyElementOptions };
}
function autoHints(q, paragraphs, word) {
  if (Array.isArray(q?.hints) && q.hints.length >= 3) return q.hints.slice(0, 3).map((text, i) => ({ title: `Indice ${i + 1}`, text }));
  const words = clean(q?.prompt).split(" ").filter((w) => w.length >= 4).slice(0, 5);
  let best = 0, score = -1;
  paragraphs.forEach((p, i) => { const c = clean(p); const s = words.reduce((n, w) => n + (c.includes(w) ? 1 : 0), 0); if (s > score) { score = s; best = i; } });
  return [
    { title: "Indice 1 — Où chercher ?", text: `Commence par relire le paragraphe ${best + 1}.` },
    { title: "Indice 2 — Mots-clés", text: words.length ? `Cherche ces mots ou des mots proches : ${words.join(", ")}.` : "Cherche les mots importants de la question dans le texte." },
    { title: "Indice 3 — Formuler la réponse", text: wordHelp[word] || "Réponds avec une idée et une preuve du texte." }
  ];
}

export default function Home() {
  const [view, setView] = useState("home");
  const [exercise, setExercise] = useState(exercises[0]);
  const [adminJson, setAdminJson] = useState(JSON.stringify(exercises[0], null, 2));
  const [step, setStep] = useState(1);
  const [qIndex, setQIndex] = useState(0);
  const [notes, setNotes] = useState({});
  const [selected, setSelected] = useState("");
  const [proofs, setProofs] = useState([]);
  const [answers, setAnswers] = useState({});
  const [checks, setChecks] = useState({});
  const [readingHighlights, setReadingHighlights] = useState({});
  const [highlighterActive, setHighlighterActive] = useState(false);
  const [activeProofTool, setActiveProofTool] = useState("explicite");
  const [big, setBig] = useState(false);
  const [spaced, setSpaced] = useState(false);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Sauvegarde locale prête.");

  useEffect(() => { const saved = loadDraft(); if (saved) { const ex = exercises.find((e) => e.id === saved.exerciseId) || exercises[0]; setExercise(ex); setAdminJson(JSON.stringify(ex, null, 2)); setView(saved.view || "student"); setStep(saved.step || 1); setQIndex(Math.min(saved.qIndex || 0, (ex.questions?.length || 1) - 1)); setNotes(saved.notes || {}); setProofs(saved.proofs || []); setAnswers(saved.answers || {}); setChecks(saved.checks || {}); setReadingHighlights(saved.readingHighlights || {}); setBig(!!saved.big); setSpaced(!!saved.spaced); setSaveStatus("Travail repris automatiquement."); } setReady(true); }, []);
  useEffect(() => { if (!ready || typeof window === "undefined") return; localStorage.setItem(STORAGE_KEY, JSON.stringify({ exerciseId: exercise.id, view, step, qIndex, notes, proofs, answers, checks, readingHighlights, big, spaced, savedAt: new Date().toISOString() })); setSaveStatus("Sauvegardé automatiquement sur cet appareil."); }, [ready, exercise.id, view, step, qIndex, notes, proofs, answers, checks, readingHighlights, big, spaced]);

  const paragraphs = useMemo(() => exercise.text.split("\n").filter(Boolean), [exercise.text]);
  const question = exercise.questions[qIndex] || exercise.questions[0];
  const word = detectQuestionWord(question?.prompt || "");
  const currentProofs = proofs.filter((p) => p.questionId === question?.id);
  const validation = useMemo(() => validationChoices(exercise), [exercise.id]);
  const mainIdeaKey = `${exercise.id}-step6-main-idea`;
  const elementsKey = `${exercise.id}-step6-key-elements`;
  const selectedMainIdea = checks[mainIdeaKey] || "";
  const selectedElements = Array.isArray(checks[elementsKey]) ? checks[elementsKey] : [];
  const selectedCorrectElements = selectedElements.filter((e) => validation.correctElements.includes(e)).length;
  const selectedWrongElements = selectedElements.filter((e) => !validation.correctElements.includes(e)).length;

  function resetForExercise(ex) { setExercise(ex); setAdminJson(JSON.stringify(ex, null, 2)); setStep(1); setQIndex(0); setNotes({}); setSelected(""); setProofs([]); setAnswers({}); setChecks({}); setReadingHighlights({}); setHighlighterActive(false); setView("student"); }
  function changeStep(nextStep) { setStep(nextStep); setQIndex(0); }
  function importExercise() { try { resetForExercise(JSON.parse(adminJson)); } catch { alert("Le JSON contient une erreur."); } }
  function clearDraft() { if (window.confirm("Effacer les réponses sauvegardées sur cet appareil ?")) { [STORAGE_KEY, ...OLD_KEYS].forEach((k) => localStorage.removeItem(k)); setNotes({}); setProofs([]); setAnswers({}); setChecks({}); setReadingHighlights({}); setStep(1); setQIndex(0); } }
  function voiceHelp() { localStorage.setItem("lectureCurrentExerciseTitle", exercise.title); localStorage.setItem("lectureCurrentQuestionPrompt", question?.prompt || ""); window.location.href = "/aide-vocale"; }
  function addProof(kind) { const text = selected.trim(); if (!text) return; if (proofs.some((p) => p.questionId === question.id && clean(p.text) === clean(text))) { setSaveStatus("Ce même passage est déjà dans tes preuves."); setSelected(""); return; } setProofs([...proofs, { id: Date.now(), questionId: question.id, text, kind }]); setSelected(""); }
  function useProofInAnswer(text) { const old = answers[question.id] || ""; if (clean(old).includes(clean(text))) { setSaveStatus("Cette preuve est déjà recopiée dans ta réponse."); return; } const count = (old.match(/preuve du texte/gi) || []).length; setAnswers({ ...answers, [question.id]: `${old.trim() ? old.trim() + "\n" : ""}${proofLabel(count)} : « ${text} »` }); }
  function toggleReadHighlight(pi, si) { if (step < 2 || !highlighterActive) return; const key = `${exercise.id}-${pi}-${si}`; setReadingHighlights((h) => ({ ...h, [key]: !h[key] })); }
  function toggleElement(option) { const old = Array.isArray(checks[elementsKey]) ? checks[elementsKey] : []; setChecks({ ...checks, [elementsKey]: old.includes(option) ? old.filter((x) => x !== option) : [...old, option] }); }

  function renderParagraph(p, i) { const summary = String(notes[i] || "").trim(); return <div className="para" key={i}>{step > 2 && summary && <h3 className="paragraphSubtitle">{summary}</h3>}<p>{splitIntoSentences(p).map((s, si) => { const key = `${exercise.id}-${i}-${si}`; return <span key={key} onClick={() => toggleReadHighlight(i, si)} className={`sentenceMarker ${readingHighlights[key] ? "highlightedSentence" : ""} ${highlighterActive && step >= 2 ? "markerActive" : ""}`}>{s} </span>; })}</p>{step === 2 && <input value={notes[i] || ""} onChange={(e) => setNotes({ ...notes, [i]: e.target.value })} placeholder="J’écris un sous-titre/résumé pour ce paragraphe..." />}</div>; }
  const TopControls = () => <div className="card"><button onClick={() => setView("home")}>Accueil</button><button onClick={() => setView("choose")}>Changer de texte</button><button className="green" onClick={voiceHelp}>Aide vocale IA pour cette question</button><button onClick={() => setView("progress")}>Mes progrès</button><button onClick={clearDraft}>Effacer ma sauvegarde</button><p className="yellow"><b>{saveStatus}</b> Les réponses, résumés et surlignages restent sur cet appareil.</p></div>;

  if (view === "home") return <main className="page"><section className="card"><h1>Lecture 6e année Québec</h1><p>Application de pratique guidée : lire, comprendre la question, trouver une preuve, répondre et vérifier.</p><p><b>{exercises.length} textes disponibles.</b></p><div className="grid three"><button className="blue" onClick={() => setView("choose")}>Choisir une lecture</button><button className="green" onClick={() => setView("student")}>Reprendre mon travail</button><button className="violet" onClick={() => setView("teacher")}>Espace enseignant</button></div></section></main>;
  if (view === "choose") return <main className="page"><TopControls /><h1>Choisir une lecture</h1><div className="grid three">{exercises.map((ex) => <section className="card" key={ex.id}><h2>{ex.title}</h2><p><b>{ex.textType}</b> — {ex.category}</p>{ex.difficulty && <p><b>Difficulté :</b> {ex.difficulty}</p>}<p>{ex.description}</p><p>{ex.questions.length} questions</p><button className="blue" onClick={() => resetForExercise(ex)}>Commencer</button></section>)}</div></main>;
  if (view === "teacher") return <main className="page"><TopControls /><section className="card"><h1>Espace enseignant</h1><p>Choisir un exercice intégré ou coller un exercice en JSON.</p><select value={exercise.id} onChange={(e) => { const ex = exercises.find((item) => item.id === e.target.value); if (ex) setAdminJson(JSON.stringify(ex, null, 2)); }}><option value="">Choisir un texte</option>{exercises.map((ex) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}</select><textarea style={{ minHeight: 520 }} value={adminJson} onChange={(e) => setAdminJson(e.target.value)} /><button className="green" onClick={importExercise}>Importer / utiliser cet exercice</button></section></main>;
  if (view === "progress") return <main className="page"><TopControls /><section className="card"><h1>Mes progrès</h1><p>Texte actuel : <b>{exercise.title}</b></p>{exercise.questions.map((q, i) => <div className="card" key={q.id}><b>Question {i + 1}</b><p>Réponse enregistrée : {answers[q.id] ? "Oui" : "Non répondue"}</p><p>Preuves : {proofs.filter((p) => p.questionId === q.id).length}</p></div>)}</section></main>;

  return <main className="page"><TopControls /><div className="card">{[1, 2, 3, 4, 5, 6].map((n) => <button key={n} className={step === n ? "blue" : ""} onClick={() => changeStep(n)}>Étape {n}</button>)}</div><div className="grid cols"><section className="card"><h1>{exercise.title}</h1><p><b>{exercise.level}</b> — {exercise.textType} — {exercise.category}</p>{exercise.difficulty && <p><b>Difficulté :</b> {exercise.difficulty}</p>}<p className="yellow">Intention : {exercise.intention}</p>{Array.isArray(exercise.vocabulary) && exercise.vocabulary.length > 0 && <details className="card"><summary><b>Mots difficiles</b></summary>{exercise.vocabulary.map((item) => <p key={item.word}><b>{item.word}</b> : {item.definition}</p>)}</details>}<button onClick={() => setBig(!big)}>Gros texte</button><button onClick={() => setSpaced(!spaced)}>Espacement</button>{step >= 2 && <div className={`card ${highlighterActive ? "yellow" : ""}`}><b>Marqueur de lecture</b><p>Active le surligneur jaune, clique sur une phrase pour la surligner, puis reclique pour retirer le surlignage.</p><button className={highlighterActive ? "yellow highlighterButton activeHighlighter" : "highlighterButton"} onClick={() => setHighlighterActive(!highlighterActive)}>🖍️ Surligneur jaune {highlighterActive ? "activé" : "désactivé"}</button></div>}{step > 2 && Object.values(notes).some((v) => String(v).trim()) && <p className="green"><b>Sous-titres de l’élève :</b> les résumés de l’étape 2 apparaissent au-dessus des paragraphes.</p>}<div onMouseUp={() => setSelected(window.getSelection()?.toString() || "")} className={`reader ${big ? "big" : ""} ${spaced ? "spaced" : ""}`}>{paragraphs.map((p, i) => renderParagraph(p, i))}</div></section><section className="card">{step === 1 && <div><h2>Étape 1 — Avant de lire</h2><ul><li>Je lis le titre.</li><li>Je prédis le sujet.</li><li>J’active ce que je connais déjà.</li><li>Je lis l’intention de lecture.</li></ul></div>}{step === 2 && <div><h2>Étape 2 — Pendant la lecture</h2><p>Lis un paragraphe à la fois. Surligne les phrases importantes et écris un résumé court sous chaque paragraphe.</p></div>}{step >= 3 && <div>{step !== 6 && <div className="card"><b>Question {qIndex + 1} / {exercise.questions.length}</b><h2>{question.prompt}</h2><p>{question.type} — {question.points} point(s)</p></div>}{step !== 6 && <><button disabled={qIndex === 0} onClick={() => setQIndex(Math.max(0, qIndex - 1))}>Question précédente</button><button disabled={qIndex === exercise.questions.length - 1} onClick={() => setQIndex(Math.min(exercise.questions.length - 1, qIndex + 1))}>Question suivante</button></>}{step === 3 && <div><h2>Étape 3 — Je comprends la question</h2><p className="yellow">Mot-question : {word}. {wordHelp[word]}</p><p><b>Ma première réponse</b></p><textarea value={answers[question.id] || ""} onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })} placeholder="Écris ici ta première réponse." /></div>}{step === 4 && <div><h2>Étape 4 — Je trouve mes preuves</h2><p>Sélection actuelle : <b>{selected || "Aucun texte sélectionné"}</b></p>{Object.entries(proofTools).map(([key, tool]) => <button key={key} className={activeProofTool === key ? tool.className : ""} onClick={() => setActiveProofTool(key)}>{tool.label}</button>)}<div className={`card ${proofTools[activeProofTool].className}`}><p>{proofTools[activeProofTool].text}</p></div><button className={proofTools[activeProofTool].className} onClick={() => addProof(activeProofTool)}>Surligner avec cet outil</button><div className="card"><h3>Mes surlignages sauvegardés</h3>{currentProofs.length === 0 ? <p>Aucun surlignage pour cette question.</p> : currentProofs.map((p, index) => <div className="card" key={p.id}><p><b>{index + 1}. {proofTools[p.kind]?.label || p.kind}</b></p><p className={proofTools[p.kind]?.className || "yellow"}>{p.text}</p><select value={p.kind} onChange={(e) => setProofs(proofs.map((x) => x.id === p.id ? { ...x, kind: e.target.value } : x))}>{Object.entries(proofTools).map(([key, tool]) => <option key={key} value={key}>{tool.label}</option>)}</select><button onClick={() => setProofs(proofs.filter((x) => x.id !== p.id))}>Supprimer</button><button className="green" onClick={() => useProofInAnswer(p.text)}>Utiliser dans ma réponse</button></div>)}</div></div>}{step === 5 && <div><h2>Étape 5 — J’écris et j’améliore ma réponse</h2><div className="card yellow"><b>Ce que la question demande :</b><p>{responseTarget(question, word)}</p></div><div className="card"><b>Mes preuves de l’étape 4</b>{currentProofs.length === 0 ? <p>Aucune preuve choisie.</p> : currentProofs.map((p, index) => <p className={proofTools[p.kind]?.className || "yellow"} key={p.id}><b>{proofLabel(index)} :</b> {p.text}</p>)}</div><button className="green" onClick={() => setAnswers({ ...answers, [question.id]: starter(question.type) })}>Insérer un début de phrase</button><textarea value={answers[question.id] || ""} onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })} placeholder="Écris ta réponse complète ici." /><div className="card"><h3>Indices gradués</h3>{autoHints(question, paragraphs, word).map((hint) => <details key={hint.title}><summary>{hint.title}</summary><p>{hint.text}</p></details>)}</div></div>}{step === 6 && <div><h2>Étape 6 — Je vérifie ma compréhension</h2><p className="yellow"><b>Mode validation :</b> la question, ta réponse et le corrigé ne sont pas affichés. Tu dois choisir les éléments qui montrent que tu as compris le texte.</p><div className="card"><h3>1. J’ai bien saisi l’idée principale du texte.</h3><p>Choisis l’idée principale qui correspond le mieux au texte.</p>{validation.mainIdeaOptions.map((option) => <label key={option} style={{ display: "block", margin: "8px 0" }}><input type="radio" name={mainIdeaKey} checked={selectedMainIdea === option} onChange={() => setChecks({ ...checks, [mainIdeaKey]: option })} /> {option}</label>)}{selectedMainIdea && <p className={selectedMainIdea === validation.correctMainIdea ? "green" : "yellow"}><b>{selectedMainIdea === validation.correctMainIdea ? "Bien choisi." : "À revoir."}</b> {selectedMainIdea === validation.correctMainIdea ? "Cette idée représente bien l’ensemble du texte." : "Relis le titre, l’intention et tes résumés de paragraphes."}</p>}</div><div className="card"><h3>2. J’ai repéré les éléments clés du texte.</h3><p>Coche les éléments importants qui appartiennent vraiment à ce texte. Il peut y avoir plusieurs bonnes réponses.</p>{validation.keyElementOptions.map((option) => <label key={option} style={{ display: "block", margin: "8px 0" }}><input type="checkbox" checked={selectedElements.includes(option)} onChange={() => toggleElement(option)} /> {option}</label>)}{selectedElements.length > 0 && <p className={selectedWrongElements === 0 && selectedCorrectElements === validation.correctElements.length ? "green" : "yellow"}><b>{selectedWrongElements === 0 && selectedCorrectElements === validation.correctElements.length ? "Compréhension solide." : "Vérifie encore."}</b> Tu as sélectionné {selectedCorrectElements} élément(s) clé(s) attendu(s) et {selectedWrongElements} élément(s) qui ne correspondent pas vraiment au texte.</p>}</div><div className="card"><h3>3. Je vérifie ma stratégie.</h3>{[["title", "J’ai utilisé le titre, les sous-titres ou mes résumés de paragraphes."], ["proof", "J’ai appuyé mes réponses sur des preuves du texte."], ["reread", "J’ai relu les passages importants avant de répondre."]].map(([key, label]) => <label key={key} style={{ display: "block", margin: "8px 0" }}><input type="checkbox" checked={!!checks[`${exercise.id}-step6-strategy-${key}`]} onChange={() => setChecks({ ...checks, [`${exercise.id}-step6-strategy-${key}`]: !checks[`${exercise.id}-step6-strategy-${key}`] })} /> {label}</label>)}</div></div>}</div>}</section></div></main>;
}
