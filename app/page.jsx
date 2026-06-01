"use client";

import { useEffect, useMemo, useState } from "react";
import baseExercises, { getAutoCorrectionGrid } from "./data/exercises";
import moreExercises from "./data/moreExercises";
import genesisExercise from "./data/genesisExercise";

const exercises = [...baseExercises, ...moreExercises, genesisExercise];
const STORAGE_KEY = "lecture6e_student_work_v7";
const OLD_KEYS = ["lecture6e_student_work_v6", "lecture6e_student_work_v5", "lecture6e_student_work_v4", "lecture6e_student_work_v3"];

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
  explicite: { label: "Information explicite", className: "blue", title: "C'est écrit clairement dans le texte.", text: "La réponse est écrite directement dans le texte." },
  inference: { label: "Indice pour inférence", className: "yellow", title: "Je lis entre les lignes.", text: "Je prends des indices et je déduis." },
  reaction: { label: "Exemple pour réagir", className: "pink", title: "Je donne mon avis avec une preuve.", text: "Je dis ce que je pense et j’appuie mon idée sur le texte." },
  important: { label: "Idée importante", className: "green", title: "C'est essentiel.", text: "Cette information aide à comprendre le message ou l’idée principale." }
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

function splitIntoSentences(text) {
  return String(text || "").match(/[^.!?;:]+[.!?;:]?|.+/g)?.filter(Boolean) || [text];
}

function cleanWord(word) {
  return String(word || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function extractKeywords(prompt = "") {
  const stop = new Set(["quel", "quelle", "quels", "quelles", "dans", "avec", "pour", "pourquoi", "comment", "combien", "donne", "cite", "nomme", "explique", "texte", "selon", "peux", "vous", "nous", "sont", "etre", "est", "une", "des", "les", "aux", "sur", "qui", "quoi", "leur", "leurs", "cette", "cela", "deux", "trois", "quatre"]);
  return String(prompt).split(/\s+/).map(cleanWord).filter((w) => w.length >= 4 && !stop.has(w)).slice(0, 6);
}

function findBestParagraph(paragraphs, keywords) {
  let bestIndex = 0;
  let bestScore = -1;
  paragraphs.forEach((p, index) => {
    const text = cleanWord(p);
    const score = keywords.reduce((sum, k) => sum + (text.includes(k) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function getGraduatedHints(question, paragraphs, wordHelpText) {
  if (Array.isArray(question?.hints) && question.hints.length >= 3) {
    return question.hints.slice(0, 3).map((text, index) => ({ title: `Indice ${index + 1}`, text }));
  }
  const keywords = extractKeywords(question?.prompt || "");
  const best = findBestParagraph(paragraphs, keywords);
  const where = paragraphs.length > 1
    ? `Commence par relire le paragraphe ${best + 1}. Si tu ne trouves pas, regarde aussi le paragraphe juste avant ou juste après.`
    : "Relis le paragraphe du texte. Cherche l’endroit où on parle de l’idée de la question.";
  const words = keywords.length
    ? `Mots-clés à chercher : ${keywords.join(", ")}. Tu peux aussi chercher des mots de la même famille.`
    : "Encercle les mots importants dans la question, puis cherche des mots semblables dans le texte.";
  const form = question?.type === "reagir" || question?.type === "apprecier" || question?.type === "jugement"
    ? "Formule ta réponse ainsi : Je pense que... parce que... Dans le texte..."
    : question?.type === "interpreter"
      ? "Prends un indice du texte, puis écris ce que tu comprends avec tes mots."
      : `Réponds directement à la question. ${wordHelpText}`;
  return [
    { title: "Indice 1 — Où chercher ?", text: where },
    { title: "Indice 2 — Mots-clés", text: words },
    { title: "Indice 3 — Formuler la réponse", text: form }
  ];
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

function proofLabel(index) {
  const labels = ["Première preuve du texte", "Deuxième preuve du texte", "Troisième preuve du texte", "Quatrième preuve du texte", "Cinquième preuve du texte"];
  return labels[index] || `${index + 1}e preuve du texte`;
}

function normalizeProof(text) {
  return String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
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
  const graduatedHints = getGraduatedHints(question, paragraphs, wordHelp[currentWord]);
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
    try { resetForExercise(JSON.parse(adminJson)); } catch { alert("Le JSON contient une erreur."); }
  }

  function clearDraft() {
    if (typeof window !== "undefined" && window.confirm("Effacer les réponses sauvegardées sur cet appareil ?")) {
      [STORAGE_KEY, ...OLD_KEYS].forEach((key) => localStorage.removeItem(key));
      setNotes({});
      setProofs([]);
      setAnswers({});
      setChecks({});
      setReadingHighlights({});
      setStep(1);
      setQIndex(0);
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
    const cleanSelected = selected.trim();
    if (!cleanSelected) return;
    const alreadyExists = proofs.some((p) => p.questionId === question.id && normalizeProof(p.text) === normalizeProof(cleanSelected));
    if (alreadyExists) {
      setSaveStatus("Ce même passage est déjà dans tes preuves.");
      setSelected("");
      return;
    }
    setProofs([...proofs, { id: Date.now(), questionId: question.id, text: cleanSelected, kind }]);
    setSelected("");
  }

  function deleteProof(id) { setProofs(proofs.filter((p) => p.id !== id)); }
  function changeProofKind(id, kind) { setProofs(proofs.map((p) => p.id === id ? { ...p, kind } : p)); }

  function useProofInAnswer(text) {
    const proofText = String(text || "").trim();
    if (!proofText) return;
    const previous = answers[question.id] || "";
    if (normalizeProof(previous).includes(normalizeProof(proofText))) {
      setSaveStatus("Cette preuve est déjà recopiée dans ta réponse.");
      return;
    }
    const count = (previous.match(/preuve du texte/gi) || []).length;
    const line = `${proofLabel(count)} : « ${proofText} »`;
    const nextAnswer = previous.trim() ? `${previous.trim()}\n${line}` : line;
    setAnswers({ ...answers, [question.id]: nextAnswer });
    setSaveStatus(`${proofLabel(count)} ajoutée à ta réponse.`);
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
    return (
      <div className="para" key={i}>
        {step > 2 && summary && <h3 className="paragraphSubtitle">{summary}</h3>}
        <p>{sentences.map((sentence, sIndex) => {
          const key = `${exercise.id}-${i}-${sIndex}`;
          const highlighted = !!readingHighlights[key];
          return <span key={key} onClick={() => toggleReadingHighlight(i, sIndex)} className={`sentenceMarker ${highlighted ? "highlightedSentence" : ""} ${highlighterActive && step >= 2 ? "markerActive" : ""}`} title={highlighterActive && step >= 2 ? "Clique pour surligner ou retirer le surlignage" : "Active d’abord le surligneur jaune"}>{sentence}{" "}</span>;
        })}</p>
        {step === 2 && <input value={notes[i] || ""} onChange={(e) => setNotes({...notes, [i]: e.target.value})} placeholder="J’écris un sous-titre/résumé pour ce paragraphe..." />}
      </div>
    );
  }

  const TopControls = () => (
    <div className="card">
      <button onClick={() => setView("home")}>Accueil</button>
      <button onClick={() => setView("choose")}>Changer de texte</button>
      <button className="green" onClick={saveContextForVoiceHelp}>Aide vocale IA pour cette question</button>
      <button onClick={() => setView("progress")}>Mes progrès</button>
      <button onClick={clearDraft}>Effacer ma sauvegarde</button>
      <p className="yellow"><b>{saveStatus}</b> Les réponses, résumés et surlignages restent sur cet appareil.</p>
    </div>
  );

  if (view === "home") return (
    <main className="page"><section className="card"><h1>Lecture 6e année Québec</h1><p>Application de pratique guidée : lire, comprendre la question, trouver une preuve, répondre et vérifier.</p><p><b>{exercises.length} textes disponibles.</b></p><p className="yellow"><b>{saveStatus}</b></p><div className="grid three"><button className="blue" onClick={() => setView("choose")}>Choisir une lecture</button><button className="green" onClick={() => setView("student")}>Reprendre mon travail</button><button className="violet" onClick={() => setView("teacher")}>Espace enseignant</button></div></section></main>
  );

  if (view === "choose") return (
    <main className="page"><TopControls /><h1>Choisir une lecture</h1><div className="grid three">{exercises.map((ex) => <section className="card" key={ex.id}><h2>{ex.title}</h2><p><b>{ex.textType}</b> — {ex.category}</p>{ex.difficulty && <p><b>Difficulté :</b> {ex.difficulty}</p>}<p>{ex.description}</p><p>{ex.questions.length} questions</p><button className="blue" onClick={() => resetForExercise(ex)}>Commencer</button></section>)}</div></main>
  );

  if (view === "teacher") return (
    <main className="page"><TopControls /><section className="card"><h1>Espace enseignant</h1><p>Choisir un exercice intégré ou coller un exercice en JSON.</p><select value={exercise.id} onChange={(e) => { const ex = exercises.find((item) => item.id === e.target.value); if (ex) setAdminJson(JSON.stringify(ex, null, 2)); }}><option value="">Choisir un texte</option>{exercises.map((ex) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}</select><textarea style={{minHeight:520}} value={adminJson} onChange={(e) => setAdminJson(e.target.value)} /><button className="green" onClick={importExercise}>Importer / utiliser cet exercice</button></section></main>
  );

  if (view === "progress") return (
    <main className="page"><TopControls /><section className="card"><h1>Mes progrès</h1><p>Texte actuel : <b>{exercise.title}</b></p>{exercise.questions.map((q, i) => <div className="card" key={q.id}><b>Question {i + 1}</b><p>Réponse enregistrée : {answers[q.id] ? "Oui" : "Non répondue"}</p><p>Preuves : {proofs.filter((p) => p.questionId === q.id).length}</p></div>)}</section></main>
  );

  return (
    <main className="page">
      <TopControls />
      <div className="card">{[1,2,3,4,5,6].map((n) => <button key={n} className={step === n ? "blue" : ""} onClick={() => setStep(n)}>Étape {n}</button>)}</div>
      <div className="grid cols">
        <section className="card">
          <h1>{exercise.title}</h1>
          <p><b>{exercise.level}</b> — {exercise.textType} — {exercise.category}</p>
          {exercise.difficulty && <p><b>Difficulté :</b> {exercise.difficulty}</p>}
          <p className="yellow">Intention : {exercise.intention}</p>
          {Array.isArray(exercise.vocabulary) && exercise.vocabulary.length > 0 && <details className="card"><summary><b>Mots difficiles</b></summary>{exercise.vocabulary.map((item) => <p key={item.word}><b>{item.word}</b> : {item.definition}</p>)}</details>}
          <button onClick={() => setBig(!big)}>Gros texte</button><button onClick={() => setSpaced(!spaced)}>Espacement</button>
          {step >= 2 && <div className={`card ${highlighterActive ? "yellow" : ""}`}><b>Marqueur de lecture</b><p>1. Clique sur l’icône du surligneur jaune. 2. Clique sur une phrase pour la surligner. 3. Reclique sur la phrase pour retirer le surlignage.</p><button className={highlighterActive ? "yellow highlighterButton activeHighlighter" : "highlighterButton"} onClick={() => setHighlighterActive(!highlighterActive)}>🖍️ Surligneur jaune {highlighterActive ? "activé" : "désactivé"}</button>{currentHighlightCount > 0 && <button onClick={clearReadingHighlights}>Effacer les surlignages jaunes</button>}</div>}
          {step > 2 && hasParagraphTitles && <p className="green"><b>Sous-titres de l’élève :</b> les résumés écrits à l’étape 2 apparaissent au-dessus des paragraphes.</p>}
          <div onMouseUp={getSelection} className={`reader ${big ? "big" : ""} ${spaced ? "spaced" : ""}`}>{paragraphs.map((p, i) => renderParagraph(p, i))}</div>
        </section>
        <section className="card">
          {step === 1 && <div><h2>Étape 1 — Avant de lire</h2><ul className="list"><li>Je lis le titre.</li><li>Je prédis le sujet.</li><li>J’active ce que je connais déjà.</li><li>Je lis l’intention de lecture.</li></ul></div>}
          {step === 2 && <div><h2>Étape 2 — Pendant la lecture</h2><p>Active le surligneur jaune, puis clique sur les phrases importantes. Ces surlignages resteront visibles aux autres étapes.</p><p>Écris aussi une idée courte : ces phrases deviendront les sous-titres des paragraphes aux étapes suivantes.</p></div>}
          {step >= 3 && <div>
            {step !== 6 && <div className="card"><b>Question {qIndex + 1} / {exercise.questions.length}</b><h2>{question.prompt}</h2><p>{question.type} — {question.points} point(s)</p></div>}
            {step !== 6 && <button disabled={qIndex === 0} onClick={() => setQIndex(Math.max(0, qIndex - 1))}>Question précédente</button>}
            {step !== 6 && <button disabled={qIndex === exercise.questions.length - 1} onClick={() => setQIndex(Math.min(exercise.questions.length - 1, qIndex + 1))}>Question suivante</button>}
            {step === 3 && <div><h2>Étape 3 — Je comprends la question</h2><p className="yellow">Mot-question : {currentWord}</p><p>{wordHelp[currentWord]}</p><p><b>Ma première réponse</b></p><textarea value={answers[question.id] || ""} onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})} placeholder="Écris ici ta première réponse. Elle est sauvegardée automatiquement." /><p className="yellow">Conseil : réponds avec les mots de la question, puis retourne au texte pour trouver une preuve.</p></div>}
            {step === 4 && <div><h2>Étape 4 — Je trouve mes preuves</h2><p>Sélectionne un bout du texte à gauche, choisis l’outil qui convient, puis appuie sur Surligner.</p><p>Sélection actuelle : <b>{selected || "Aucun texte sélectionné"}</b></p><div>{Object.entries(proofTools).map(([key, tool]) => <button key={key} className={activeProofTool === key ? tool.className : ""} onClick={() => setActiveProofTool(key)}>{tool.label}</button>)}</div><div className={`card ${activeTool.className}`}><h3>{activeTool.title}</h3><p>{activeTool.text}</p></div><button className={activeTool.className} onClick={() => addProof(activeProofTool)}>Surligner avec cet outil</button>{currentProofs.length > 0 && <button onClick={clearQuestionProofs}>Effacer tous mes surlignages</button>}<div className="card"><h3>Mes surlignages sauvegardés</h3>{currentProofs.length === 0 ? <p>Aucun surlignage pour cette question.</p> : currentProofs.map((p, index) => <div className="card" key={p.id}><p><b>{index + 1}. {proofTools[p.kind]?.label || p.kind}</b></p><p className={proofTools[p.kind]?.className || "yellow"}>{p.text}</p><label>Changer le type : <select value={p.kind} onChange={(e) => changeProofKind(p.id, e.target.value)}>{Object.entries(proofTools).map(([key, tool]) => <option key={key} value={key}>{tool.label}</option>)}</select></label><div><button onClick={() => deleteProof(p.id)}>Supprimer</button><button className="green" onClick={() => useProofInAnswer(p.text)}>Utiliser dans ma réponse</button></div></div>)}</div></div>}
            {step === 5 && <div><h2>Étape 5 — J’écris et j’améliore ma réponse</h2><div className="card yellow"><b>Ce que la question demande :</b><p>Mot-question : {currentWord}. {wordHelp[currentWord]}</p><p>{responseTarget(question, currentWord)}</p></div><div className="card"><b>Mes preuves de l’étape 4</b>{currentProofs.length === 0 ? <p>Aucune preuve choisie. Retourne à l’étape 4 si tu veux t’aider.</p> : currentProofs.map((p, index) => <p className={proofTools[p.kind]?.className || "yellow"} key={p.id}><b>{proofLabel(index)} :</b> {p.text}</p>)}</div><button className="green" onClick={() => setAnswers({...answers, [question.id]: starter(question.type)})}>Insérer un début de phrase</button><textarea value={answers[question.id] || ""} onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})} placeholder="Écris ta réponse complète ici. Elle est sauvegardée automatiquement." /><div className="card"><h3>Indices gradués</h3><p>Ouvre seulement l’indice dont tu as besoin. Les indices deviennent de plus en plus aidants.</p>{graduatedHints.map((hint) => <details key={hint.title}><summary>{hint.title}</summary><p>{hint.text}</p></details>)}</div></div>}
            {step === 6 && <div><h2>Étape 6 — Je vérifie</h2><p className="yellow"><b>Mode vérification :</b> la question, ta réponse et le corrigé ne sont pas affichés ici. Utilise seulement la grille pour vérifier ta démarche.</p><h3>Grille d’auto-correction</h3>{getAutoCorrectionGrid().map((c) => <div className="card" key={c}><p>{c}</p>{["Oui","Un peu","Non"].map((choice) => <label key={choice} style={{marginRight:12}}><input type="radio" name={checkKey(c)} checked={checks[checkKey(c)] === choice} onChange={() => setChecks({...checks, [checkKey(c)]: choice})} /> {choice}</label>)}</div>)}</div>}
          </div>}
        </section>
      </div>
    </main>
  );
}
