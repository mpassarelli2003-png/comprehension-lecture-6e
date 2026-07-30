"use client";

import { useEffect, useMemo, useState } from "react";
import baseExercises from "./data/exercises";
import moreExercises from "./data/moreExercises";
import genesisExercise from "./data/genesisExercise";
import {
  ADMIN_SETTINGS_KEY,
  DEFAULT_ADMIN_SETTINGS,
  LEARNING_MODES,
  LEVELS,
  normalizeExerciseLevel,
  sanitizeAdminSettings
} from "../lib/learningConfig";

const exercises = [...baseExercises, ...moreExercises, genesisExercise];
const STORAGE_KEY = "lecture_student_work_v9";
const OLD_KEYS = [
  "lecture6e_student_work_v8",
  "lecture6e_student_work_v7",
  "lecture6e_student_work_v6",
  "lecture6e_student_work_v5",
  "lecture6e_student_work_v4",
  "lecture6e_student_work_v3"
];

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
  explicite: { label: "Information explicite", className: "blue", text: "La réponse est écrite directement dans le texte." },
  inference: { label: "Indice pour inférence", className: "yellow", text: "Je prends des indices et je déduis." },
  reaction: { label: "Exemple pour réagir", className: "pink", text: "Je dis ce que je pense et j’appuie mon idée sur le texte." },
  important: { label: "Idée importante", className: "green", text: "Cette information aide à comprendre le message ou l’idée principale." }
};

const trainingStepLabels = ["Avant de lire", "Lire et annoter", "Comprendre la question", "Trouver les preuves", "Rédiger", "Vérifier"];
const simulationStepLabels = ["Prendre connaissance", "Lire et annoter", "Répondre", "Notes utiles", "Réviser", "Remettre"];

function detectQuestionWord(prompt = "") {
  const lower = prompt.toLowerCase();
  for (const word of ["pourquoi", "comment", "combien", "quand", "où", "qui"]) {
    if (lower.includes(word)) return word;
  }
  return "quoi";
}

function starter(type) {
  if (type === "comprendre") return "Dans le texte, on apprend que...";
  if (type === "interpreter") return "Je pense que cela veut dire que... Dans le texte, un indice montre que...";
  if (type === "reagir") return "Je réagirais... parce que... Dans le texte...";
  if (type === "jugement") return "Selon moi... parce que... Un élément du texte montre que...";
  return "J’ai apprécié... parce que... Par exemple...";
}

function responseTarget(question, word) {
  const base = question?.points >= 2 ? "Réponse développée : idée + preuve + explication." : "Réponse courte, mais complète.";
  if (["reagir", "apprecier", "jugement"].includes(question?.type)) return `${base} Tu dois donner ton idée avec une preuve du texte.`;
  if (question?.type === "interpreter") return `${base} Tu dois expliquer ce que tu comprends avec des indices.`;
  if (word === "pourquoi") return `${base} Tu dois donner une raison.`;
  if (word === "comment") return `${base} Tu dois expliquer une manière ou un changement.`;
  return `${base} Tu dois répondre exactement à ce qui est demandé.`;
}

function splitIntoSentences(text) {
  return String(text || "").match(/[^.!?;:]+[.!?;:]?|.+/g)?.filter(Boolean) || [text];
}

function clean(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trimText(text, max = 125) {
  const value = String(text || "").replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
  return value.length <= max ? value : `${value.slice(0, max - 3).trim()}...`;
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

function loadAdminSettings() {
  if (typeof window === "undefined") return DEFAULT_ADMIN_SETTINGS;
  try {
    return sanitizeAdminSettings(JSON.parse(localStorage.getItem(ADMIN_SETTINGS_KEY) || "null"));
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

function proofLabel(index) {
  return ["Première preuve du texte", "Deuxième preuve du texte", "Troisième preuve du texte", "Quatrième preuve du texte", "Cinquième preuve du texte"][index] || `${index + 1}e preuve du texte`;
}

function mainIdea(exercise) {
  return trimText(String(exercise.mainIdea || exercise.intention || exercise.description || `Comprendre ${exercise.title}`).replace(/^Lire pour comprendre\s*/i, "Comprendre "), 160);
}

function validationChoices(exercise) {
  const correctMainIdea = mainIdea(exercise);
  const mainIdeaOptions = [correctMainIdea, ...exercises.filter((item) => item.id !== exercise.id).map(mainIdea)]
    .filter((value, index, array) => value && array.indexOf(value) === index)
    .slice(0, 4);
  const correctElements = (exercise.questions || [])
    .filter((question) => !question.isPersonalAnswer)
    .map((question) => trimText(question.expectedAnswer))
    .filter(Boolean)
    .slice(0, 4);
  const distractors = exercises
    .filter((item) => item.id !== exercise.id)
    .flatMap((item) => (item.questions || []).filter((question) => !question.isPersonalAnswer).map((question) => trimText(question.expectedAnswer)))
    .filter(Boolean)
    .slice(0, 4);
  const keyElementOptions = [...correctElements, ...distractors]
    .filter((value, index, array) => value && array.indexOf(value) === index)
    .slice(0, 8);
  return { correctMainIdea, mainIdeaOptions, correctElements, keyElementOptions };
}

function autoHints(question, paragraphs, word) {
  if (Array.isArray(question?.hints) && question.hints.length >= 3) {
    return question.hints.slice(0, 3).map((text, index) => ({ title: `Indice ${index + 1}`, text }));
  }
  const words = clean(question?.prompt).split(" ").filter((value) => value.length >= 4).slice(0, 5);
  let best = 0;
  let score = -1;
  paragraphs.forEach((paragraph, index) => {
    const normalized = clean(paragraph);
    const current = words.reduce((total, value) => total + (normalized.includes(value) ? 1 : 0), 0);
    if (current > score) {
      score = current;
      best = index;
    }
  });
  return [
    { title: "Indice 1 — Où chercher ?", text: `Commence par relire le paragraphe ${best + 1}.` },
    { title: "Indice 2 — Mots-clés", text: words.length ? `Cherche ces mots ou des mots proches : ${words.join(", ")}.` : "Cherche les mots importants de la question dans le texte." },
    { title: "Indice 3 — Formuler la réponse", text: wordHelp[word] || "Réponds avec une idée et une preuve du texte." }
  ];
}

export default function Home() {
  const [view, setView] = useState("home");
  const [exercise, setExercise] = useState(exercises[0]);
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
  const [adminSettings, setAdminSettings] = useState(DEFAULT_ADMIN_SETTINGS);
  const [selectedLevel, setSelectedLevel] = useState(DEFAULT_ADMIN_SETTINGS.defaultLevel);
  const [learningMode, setLearningMode] = useState(DEFAULT_ADMIN_SETTINGS.defaultMode);
  const [simulationSubmitted, setSimulationSubmitted] = useState(false);

  useEffect(() => {
    const settings = loadAdminSettings();
    const saved = loadDraft();
    const level = settings.enabledLevels.includes(saved?.selectedLevel) ? saved.selectedLevel : settings.defaultLevel;
    const mode = settings.enabledModes.includes(saved?.learningMode) ? saved.learningMode : settings.defaultMode;
    const levelExercises = exercises.filter((item) => normalizeExerciseLevel(item.level) === level);
    const savedExercise = exercises.find((item) => item.id === saved?.exerciseId && normalizeExerciseLevel(item.level) === level);
    const initialExercise = savedExercise || levelExercises[0] || exercises[0];

    setAdminSettings(settings);
    setSelectedLevel(level);
    setLearningMode(mode);
    setExercise(initialExercise);

    if (saved) {
      setView(saved.view === "teacher" ? "home" : saved.view || "student");
      setStep(saved.step || 1);
      setQIndex(Math.min(saved.qIndex || 0, (initialExercise.questions?.length || 1) - 1));
      setNotes(saved.notes || {});
      setProofs(saved.proofs || []);
      setAnswers(saved.answers || {});
      setChecks(saved.checks || {});
      setReadingHighlights(saved.readingHighlights || {});
      setBig(Boolean(saved.big));
      setSpaced(Boolean(saved.spaced));
      setSimulationSubmitted(Boolean(saved.simulationSubmitted));
      setSaveStatus("Travail repris automatiquement.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      exerciseId: exercise.id,
      view,
      step,
      qIndex,
      notes,
      proofs,
      answers,
      checks,
      readingHighlights,
      big,
      spaced,
      selectedLevel,
      learningMode,
      simulationSubmitted,
      savedAt: new Date().toISOString()
    }));
    setSaveStatus("Sauvegardé automatiquement sur cet appareil.");
  }, [ready, exercise.id, view, step, qIndex, notes, proofs, answers, checks, readingHighlights, big, spaced, selectedLevel, learningMode, simulationSubmitted]);

  const availableLevels = LEVELS.filter((level) => adminSettings.enabledLevels.includes(level.id));
  const availableModes = LEARNING_MODES.filter((mode) => adminSettings.enabledModes.includes(mode.id));
  const availableExercises = useMemo(
    () => exercises.filter((item) => normalizeExerciseLevel(item.level) === selectedLevel),
    [selectedLevel]
  );
  const paragraphs = useMemo(() => exercise.text.split("\n").filter(Boolean), [exercise.text]);
  const question = exercise.questions[qIndex] || exercise.questions[0];
  const word = detectQuestionWord(question?.prompt || "");
  const currentProofs = proofs.filter((proof) => proof.questionId === question?.id);
  const validation = useMemo(() => validationChoices(exercise), [exercise.id]);
  const mainIdeaKey = `${exercise.id}-step6-main-idea`;
  const elementsKey = `${exercise.id}-step6-key-elements`;
  const selectedMainIdea = checks[mainIdeaKey] || "";
  const selectedElements = Array.isArray(checks[elementsKey]) ? checks[elementsKey] : [];
  const selectedCorrectElements = selectedElements.filter((element) => validation.correctElements.includes(element)).length;
  const selectedWrongElements = selectedElements.filter((element) => !validation.correctElements.includes(element)).length;
  const answeredCount = exercise.questions.filter((item) => String(answers[item.id] || "").trim()).length;
  const stepLabels = learningMode === "simulation" ? simulationStepLabels : trainingStepLabels;
  const selectedLevelInfo = LEVELS.find((level) => level.id === selectedLevel) || LEVELS[0];
  const selectedModeInfo = LEARNING_MODES.find((mode) => mode.id === learningMode) || LEARNING_MODES[0];
  const isTraining = learningMode === "training";

  function resetForExercise(nextExercise) {
    setExercise(nextExercise);
    setSelectedLevel(normalizeExerciseLevel(nextExercise.level));
    setStep(1);
    setQIndex(0);
    setNotes({});
    setSelected("");
    setProofs([]);
    setAnswers({});
    setChecks({});
    setReadingHighlights({});
    setHighlighterActive(false);
    setSimulationSubmitted(false);
    setView("student");
  }

  function changeStep(nextStep) {
    setStep(nextStep);
    setQIndex(0);
  }

  function clearDraft() {
    if (!window.confirm("Effacer les réponses sauvegardées sur cet appareil ?")) return;
    [STORAGE_KEY, ...OLD_KEYS].forEach((key) => localStorage.removeItem(key));
    setNotes({});
    setProofs([]);
    setAnswers({});
    setChecks({});
    setReadingHighlights({});
    setSimulationSubmitted(false);
    setStep(1);
    setQIndex(0);
  }

  function voiceHelp() {
    localStorage.setItem("lectureCurrentExerciseTitle", exercise.title);
    localStorage.setItem("lectureCurrentQuestionPrompt", question?.prompt || "");
    window.location.href = "/aide-vocale";
  }

  function addProof(kind) {
    const text = selected.trim();
    if (!text) {
      setSaveStatus("Sélectionne d’abord un passage dans le texte.");
      return;
    }
    if (proofs.some((proof) => proof.questionId === question.id && clean(proof.text) === clean(text))) {
      setSaveStatus("Ce même passage est déjà dans tes preuves.");
      setSelected("");
      return;
    }
    setProofs([...proofs, { id: Date.now(), questionId: question.id, text, kind }]);
    setSelected("");
  }

  function useProofInAnswer(text) {
    const old = answers[question.id] || "";
    if (clean(old).includes(clean(text))) {
      setSaveStatus("Cette preuve est déjà recopiée dans ta réponse.");
      return;
    }
    const count = (old.match(/preuve du texte/gi) || []).length;
    setAnswers({ ...answers, [question.id]: `${old.trim() ? `${old.trim()}\n` : ""}${proofLabel(count)} : « ${text} »` });
    setSimulationSubmitted(false);
  }

  function updateAnswer(value) {
    setAnswers({ ...answers, [question.id]: value });
    setSimulationSubmitted(false);
  }

  function toggleReadHighlight(paragraphIndex, sentenceIndex) {
    if (step < 2 || !highlighterActive) return;
    const key = `${exercise.id}-${paragraphIndex}-${sentenceIndex}`;
    setReadingHighlights((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleElement(option) {
    const old = Array.isArray(checks[elementsKey]) ? checks[elementsKey] : [];
    setChecks({ ...checks, [elementsKey]: old.includes(option) ? old.filter((item) => item !== option) : [...old, option] });
  }

  function submitSimulation() {
    const missing = exercise.questions.length - answeredCount;
    if (missing > 0 && !window.confirm(`Il reste ${missing} question(s) sans réponse. Remettre quand même la simulation ?`)) return;
    setSimulationSubmitted(true);
  }

  function renderParagraph(paragraph, paragraphIndex) {
    const summary = String(notes[paragraphIndex] || "").trim();
    return (
      <div className="para" key={paragraphIndex}>
        {step > 2 && summary && <h3 className="paragraphSubtitle">{summary}</h3>}
        <p>
          {splitIntoSentences(paragraph).map((sentence, sentenceIndex) => {
            const key = `${exercise.id}-${paragraphIndex}-${sentenceIndex}`;
            return (
              <span
                key={key}
                onClick={() => toggleReadHighlight(paragraphIndex, sentenceIndex)}
                className={`sentenceMarker ${readingHighlights[key] ? "highlightedSentence" : ""} ${highlighterActive && step >= 2 ? "markerActive" : ""}`}
              >
                {sentence}{" "}
              </span>
            );
          })}
        </p>
        {step === 2 && (
          <input
            value={notes[paragraphIndex] || ""}
            onChange={(event) => setNotes({ ...notes, [paragraphIndex]: event.target.value })}
            placeholder={isTraining ? "J’écris un sous-titre ou un résumé pour ce paragraphe..." : "Note courte facultative..."}
          />
        )}
      </div>
    );
  }

  const TopControls = () => (
    <div className="card topControls">
      <div className="controlButtons">
        <button onClick={() => setView("home")}>Accueil</button>
        <button onClick={() => setView("choose")}>Changer de texte</button>
        {isTraining && <button className="green" onClick={voiceHelp}>Aide vocale IA</button>}
        <button onClick={() => setView("progress")}>Mes progrès</button>
        <button onClick={clearDraft}>Effacer ma sauvegarde</button>
      </div>
      <div className="statusBadges" aria-label="Choix actuels">
        <span className="badge">{selectedLevelInfo.label}</span>
        <span className={`badge ${isTraining ? "green" : "violet"}`}>{selectedModeInfo.label}</span>
      </div>
      <p className="yellow"><b>{saveStatus}</b> Les réponses, résumés et surlignages restent sur cet appareil.</p>
    </div>
  );

  if (view === "home") {
    return (
      <main className="page homePage">
        <section className="hero card">
          <p className="eyebrow">Compréhension de lecture — Québec</p>
          <h1>Choisis ton niveau et ta façon de pratiquer</h1>
          <p>L’application distingue maintenant la 6e année, le secondaire 1 et le secondaire 2, avec un mode guidé et un mode de simulation.</p>
        </section>

        <section className="card">
          <h2>1. Mon niveau</h2>
          <div className="selectionGrid three">
            {availableLevels.map((level) => {
              const count = exercises.filter((item) => normalizeExerciseLevel(item.level) === level.id).length;
              return (
                <button
                  className={`selectionCard ${selectedLevel === level.id ? "selectedCard" : ""}`}
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  aria-pressed={selectedLevel === level.id}
                >
                  <b>{level.label}</b>
                  <span>{level.description}</span>
                  <small>{count} texte(s) disponible(s)</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card">
          <h2>2. Mon mode</h2>
          <div className="selectionGrid two">
            {availableModes.map((mode) => (
              <button
                className={`selectionCard ${learningMode === mode.id ? "selectedCard" : ""}`}
                key={mode.id}
                onClick={() => {
                  setLearningMode(mode.id);
                  setSimulationSubmitted(false);
                }}
                aria-pressed={learningMode === mode.id}
              >
                <b>{mode.label}</b>
                <span>{mode.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card actionPanel">
          <div>
            <h2>{selectedLevelInfo.label} — {selectedModeInfo.label}</h2>
            <p>{availableExercises.length > 0 ? `${availableExercises.length} texte(s) prêt(s) pour ce niveau.` : "Le niveau est créé, mais aucun texte n’y est encore publié."}</p>
          </div>
          <div>
            <button className="blue primaryButton" onClick={() => setView("choose")}>Choisir une lecture</button>
            {normalizeExerciseLevel(exercise.level) === selectedLevel && (
              <button className="green primaryButton" onClick={() => setView("student")}>Reprendre mon travail</button>
            )}
            <a className="buttonLink violet" href="/admin/login">Espace admin</a>
          </div>
        </section>
      </main>
    );
  }

  if (view === "choose") {
    return (
      <main className="page">
        <TopControls />
        <h1>Choisir une lecture — {selectedLevelInfo.label}</h1>
        {availableExercises.length === 0 ? (
          <section className="card emptyState">
            <h2>Aucun texte publié pour ce niveau</h2>
            <p>La structure du niveau est prête. Un administrateur peut maintenant préparer et ajouter les contenus de secondaire 1 ou de secondaire 2.</p>
            <a className="buttonLink violet" href="/admin/login">Ouvrir l’espace admin</a>
          </section>
        ) : (
          <div className="grid three">
            {availableExercises.map((item) => (
              <section className="card" key={item.id}>
                <h2>{item.title}</h2>
                <p><b>{item.textType}</b> — {item.category}</p>
                {item.difficulty && <p><b>Difficulté :</b> {item.difficulty}</p>}
                <p>{item.description}</p>
                <p>{item.questions.length} questions</p>
                <button className="blue" onClick={() => resetForExercise(item)}>Commencer en mode {selectedModeInfo.label.toLowerCase()}</button>
              </section>
            ))}
          </div>
        )}
      </main>
    );
  }

  if (view === "progress") {
    return (
      <main className="page">
        <TopControls />
        <section className="card">
          <h1>Mes progrès</h1>
          <p>Texte actuel : <b>{exercise.title}</b></p>
          <p>Niveau : <b>{selectedLevelInfo.label}</b> — Mode : <b>{selectedModeInfo.label}</b></p>
          {exercise.questions.map((item, index) => (
            <div className="card" key={item.id}>
              <b>Question {index + 1}</b>
              <p>Réponse enregistrée : {answers[item.id] ? "Oui" : "Non répondue"}</p>
              <p>Preuves ou notes : {proofs.filter((proof) => proof.questionId === item.id).length}</p>
            </div>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <TopControls />
      <div className={`modeBanner ${isTraining ? "trainingBanner" : "simulationBanner"}`}>
        <b>{selectedModeInfo.label}</b>
        <span>{selectedModeInfo.description}</span>
      </div>
      <div className="card stepNavigation" aria-label="Étapes de travail">
        {stepLabels.map((label, index) => (
          <button key={label} className={step === index + 1 ? "blue" : ""} onClick={() => changeStep(index + 1)}>
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <div className="grid cols">
        <section className="card">
          <h1>{exercise.title}</h1>
          <p><b>{exercise.level}</b> — {exercise.textType} — {exercise.category}</p>
          {exercise.difficulty && <p><b>Difficulté :</b> {exercise.difficulty}</p>}
          <p className="yellow">Intention : {exercise.intention}</p>

          {Array.isArray(exercise.vocabulary) && exercise.vocabulary.length > 0 && (
            <details className="card">
              <summary><b>Mots difficiles</b></summary>
              {exercise.vocabulary.map((item) => <p key={item.word}><b>{item.word}</b> : {item.definition}</p>)}
            </details>
          )}

          <button onClick={() => setBig(!big)}>Gros texte</button>
          <button onClick={() => setSpaced(!spaced)}>Espacement</button>

          {step >= 2 && (
            <div className={`card ${highlighterActive ? "yellow" : ""}`}>
              <b>Marqueur de lecture</b>
              <p>Active le surligneur, clique sur une phrase pour la marquer, puis reclique pour retirer le surlignage.</p>
              <button
                className={highlighterActive ? "yellow highlighterButton activeHighlighter" : "highlighterButton"}
                onClick={() => setHighlighterActive(!highlighterActive)}
              >
                Surligneur {highlighterActive ? "activé" : "désactivé"}
              </button>
            </div>
          )}

          {step > 2 && Object.values(notes).some((value) => String(value).trim()) && (
            <p className="green"><b>Notes de lecture :</b> elles apparaissent au-dessus des paragraphes.</p>
          )}

          <div
            onMouseUp={() => setSelected(window.getSelection()?.toString() || "")}
            className={`reader ${big ? "big" : ""} ${spaced ? "spaced" : ""}`}
          >
            {paragraphs.map((paragraph, index) => renderParagraph(paragraph, index))}
          </div>
        </section>

        <section className="card">
          {step === 1 && (
            <div>
              <h2>Étape 1 — {stepLabels[0]}</h2>
              {isTraining ? (
                <ul>
                  <li>Je lis le titre.</li>
                  <li>Je prédis le sujet.</li>
                  <li>J’active ce que je connais déjà.</li>
                  <li>Je lis l’intention de lecture.</li>
                </ul>
              ) : (
                <div className="statusBox simulationBox">
                  <b>Conditions de simulation</b>
                  <p>Lis les consignes et le texte de façon autonome. L’aide vocale, les débuts de phrase et les indices gradués sont désactivés.</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2>Étape 2 — {stepLabels[1]}</h2>
              <p>{isTraining ? "Lis un paragraphe à la fois. Surligne les phrases importantes et écris un résumé court sous chaque paragraphe." : "Lis le texte, surligne au besoin et prends seulement les notes que tu juges utiles."}</p>
            </div>
          )}

          {step >= 3 && step <= 5 && (
            <div>
              <div className="card">
                <b>Question {qIndex + 1} / {exercise.questions.length}</b>
                <h2>{question.prompt}</h2>
                <p>{question.type} — {question.points} point(s)</p>
              </div>
              <button disabled={qIndex === 0} onClick={() => setQIndex(Math.max(0, qIndex - 1))}>Question précédente</button>
              <button disabled={qIndex === exercise.questions.length - 1} onClick={() => setQIndex(Math.min(exercise.questions.length - 1, qIndex + 1))}>Question suivante</button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2>Étape 3 — {stepLabels[2]}</h2>
              {isTraining ? (
                <p className="yellow">Mot-question : {word}. {wordHelp[word]}</p>
              ) : (
                <p className="violet">Aucun indice n’est affiché en mode simulation.</p>
              )}
              <p><b>Ma réponse</b></p>
              <textarea value={answers[question.id] || ""} onChange={(event) => updateAnswer(event.target.value)} placeholder="Écris ta réponse ici." />
            </div>
          )}

          {step === 4 && (
            <div>
              <h2>Étape 4 — {stepLabels[3]}</h2>
              <p>Sélection actuelle : <b>{selected || "Aucun passage sélectionné"}</b></p>

              {isTraining ? (
                <>
                  {Object.entries(proofTools).map(([key, tool]) => (
                    <button key={key} className={activeProofTool === key ? tool.className : ""} onClick={() => setActiveProofTool(key)}>{tool.label}</button>
                  ))}
                  <div className={`card ${proofTools[activeProofTool].className}`}><p>{proofTools[activeProofTool].text}</p></div>
                  <button className={proofTools[activeProofTool].className} onClick={() => addProof(activeProofTool)}>Surligner avec cet outil</button>
                </>
              ) : (
                <button className="blue" onClick={() => addProof("important")}>Ajouter ce passage à mes notes</button>
              )}

              <div className="card">
                <h3>Mes passages sauvegardés</h3>
                {currentProofs.length === 0 ? (
                  <p>Aucun passage pour cette question.</p>
                ) : currentProofs.map((proof, index) => (
                  <div className="card" key={proof.id}>
                    <p><b>{index + 1}. {isTraining ? proofTools[proof.kind]?.label || proof.kind : "Passage noté"}</b></p>
                    <p className={isTraining ? proofTools[proof.kind]?.className || "yellow" : "blue"}>{proof.text}</p>
                    {isTraining && (
                      <select value={proof.kind} onChange={(event) => setProofs(proofs.map((item) => item.id === proof.id ? { ...item, kind: event.target.value } : item))}>
                        {Object.entries(proofTools).map(([key, tool]) => <option key={key} value={key}>{tool.label}</option>)}
                      </select>
                    )}
                    <button onClick={() => setProofs(proofs.filter((item) => item.id !== proof.id))}>Supprimer</button>
                    <button className="green" onClick={() => useProofInAnswer(proof.text)}>Utiliser dans ma réponse</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2>Étape 5 — {stepLabels[4]}</h2>
              {isTraining ? (
                <>
                  <div className="card yellow"><b>Ce que la question demande :</b><p>{responseTarget(question, word)}</p></div>
                  <div className="card">
                    <b>Mes preuves de l’étape 4</b>
                    {currentProofs.length === 0 ? <p>Aucune preuve choisie.</p> : currentProofs.map((proof, index) => (
                      <p className={proofTools[proof.kind]?.className || "yellow"} key={proof.id}><b>{proofLabel(index)} :</b> {proof.text}</p>
                    ))}
                  </div>
                  <button className="green" onClick={() => updateAnswer(starter(question.type))}>Insérer un début de phrase</button>
                </>
              ) : (
                <div className="card simulationBox"><b>Révision autonome</b><p>Vérifie que tu as répondu à toute la question et que ta réponse s’appuie sur le texte.</p></div>
              )}

              <textarea value={answers[question.id] || ""} onChange={(event) => updateAnswer(event.target.value)} placeholder="Écris ta réponse complète ici." />

              {isTraining && (
                <div className="card">
                  <h3>Indices gradués</h3>
                  {autoHints(question, paragraphs, word).map((hint) => (
                    <details key={hint.title}><summary>{hint.title}</summary><p>{hint.text}</p></details>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 6 && isTraining && (
            <div>
              <h2>Étape 6 — Je vérifie ma compréhension</h2>
              <p className="yellow"><b>Mode validation :</b> choisis les éléments qui montrent que tu as compris le texte.</p>

              <div className="card">
                <h3>1. J’ai bien saisi l’idée principale du texte.</h3>
                {validation.mainIdeaOptions.map((option) => (
                  <label className="choiceLine" key={option}>
                    <input type="radio" name={mainIdeaKey} checked={selectedMainIdea === option} onChange={() => setChecks({ ...checks, [mainIdeaKey]: option })} />
                    <span>{option}</span>
                  </label>
                ))}
                {selectedMainIdea && (
                  <p className={selectedMainIdea === validation.correctMainIdea ? "green" : "yellow"}>
                    <b>{selectedMainIdea === validation.correctMainIdea ? "Bien choisi." : "À revoir."}</b>{" "}
                    {selectedMainIdea === validation.correctMainIdea ? "Cette idée représente bien l’ensemble du texte." : "Relis le titre, l’intention et tes résumés de paragraphes."}
                  </p>
                )}
              </div>

              <div className="card">
                <h3>2. J’ai repéré les éléments clés du texte.</h3>
                {validation.keyElementOptions.map((option) => (
                  <label className="choiceLine" key={option}>
                    <input type="checkbox" checked={selectedElements.includes(option)} onChange={() => toggleElement(option)} />
                    <span>{option}</span>
                  </label>
                ))}
                {selectedElements.length > 0 && (
                  <p className={selectedWrongElements === 0 && selectedCorrectElements === validation.correctElements.length ? "green" : "yellow"}>
                    <b>{selectedWrongElements === 0 && selectedCorrectElements === validation.correctElements.length ? "Compréhension solide." : "Vérifie encore."}</b>{" "}
                    Tu as sélectionné {selectedCorrectElements} élément(s) attendu(s) et {selectedWrongElements} élément(s) qui ne correspondent pas au texte.
                  </p>
                )}
              </div>

              <div className="card">
                <h3>3. Je vérifie ma stratégie.</h3>
                {[
                  ["title", "J’ai utilisé le titre, les sous-titres ou mes résumés de paragraphes."],
                  ["proof", "J’ai appuyé mes réponses sur des preuves du texte."],
                  ["reread", "J’ai relu les passages importants avant de répondre."]
                ].map(([key, label]) => (
                  <label className="choiceLine" key={key}>
                    <input
                      type="checkbox"
                      checked={Boolean(checks[`${exercise.id}-step6-strategy-${key}`])}
                      onChange={() => setChecks({ ...checks, [`${exercise.id}-step6-strategy-${key}`]: !checks[`${exercise.id}-step6-strategy-${key}`] })}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 6 && !isTraining && (
            <div>
              <h2>Étape 6 — Remettre la simulation</h2>
              <div className="card simulationBox">
                <p><b>Questions répondues :</b> {answeredCount} / {exercise.questions.length}</p>
                <p><b>Passages notés :</b> {proofs.length}</p>
                <p>La remise verrouille seulement le bilan. Tes réponses demeurent sauvegardées sur cet appareil.</p>
              </div>

              {!simulationSubmitted ? (
                <button className="violet primaryButton" onClick={submitSimulation}>Remettre la simulation</button>
              ) : (
                <div className="statusBox successBox" role="status">
                  <h3>Simulation remise</h3>
                  <p>Tu as répondu à {answeredCount} question(s) sur {exercise.questions.length}. Un enseignant ou un parent peut maintenant relire les réponses dans « Mes progrès ».</p>
                  <button onClick={() => setSimulationSubmitted(false)}>Rouvrir pour corriger</button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
