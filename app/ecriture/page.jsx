"use client";

import { useEffect, useMemo, useState } from "react";
import baseExercises from "../data/exercises";
import moreExercises from "../data/moreExercises";
import genesisExercise from "../data/genesisExercise";
import Step2Ideas from "./Step2Ideas";
import Step3Plan from "./Step3Plan";
import Step4Draft from "./Step4Draft";
import Step5Revision from "./Step5Revision";
import Step6Correction from "./Step6Correction";
import StepExamNotes, { createDefaultExamNotes } from "./StepExamNotes";
import WritingBrief from "./WritingBrief";
import {
  WRITING_TYPES,
  buildWritingBrief,
  personalizeWritingBrief,
  revisionCheckKey,
  successCheckKey
} from "../../lib/writingSynchronization";

const texts = [...baseExercises, ...moreExercises, genesisExercise];
const STORAGE_KEY = "lecture6e_writing_practice_v5";
const OLD_KEYS = ["lecture6e_writing_practice_v4", "lecture6e_writing_practice_v3", "lecture6e_writing_practice_v2", "lecture6e_writing_practice_v1"];
const emptyPlan = { intro: "", dev1: "", dev2: "", conclusion: "" };
const defaultIdeas = [
  { know: "", say: "", proof: "", role: "Opinion ou idée principale" },
  { know: "", say: "", proof: "", role: "Raison ou aspect 1" },
  { know: "", say: "", proof: "", role: "Raison ou aspect 2" }
];
const correctionRequiredKeys = ["correction-mots", "correction-noms", "correction-determinants", "correction-adjectifs", "correction-verbes-pronom", "correction-verbes-groupe", "correction-ponctuation"];
const initialBrief = buildWritingBrief(texts[0], "opinion");

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

function wordCount(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function isFilled(value) {
  return String(value || "").trim().length > 0;
}

function requiredToIdea(item, index, typeId) {
  const role = index === 0 ? "Opinion ou idée principale" : `Raison ou aspect ${index}`;
  const starter = typeId === "explicatif" ? "Je peux expliquer que..." : typeId === "reaction" ? "Je peux réagir en disant que..." : "Je peux défendre l’idée que...";
  return { role, know: item, say: starter, proof: "Je dois trouver une preuve, un fait ou un exemple précis dans la feuille de notes." };
}

function hasDownstreamWork({ ideas, plan, draft, finalText }) {
  return ideas.some((row) => isFilled(row.know) || isFilled(row.say) || isFilled(row.proof)) ||
    Object.values(plan).some(isFilled) || isFilled(draft) || isFilled(finalText);
}

export default function WritingPage() {
  const [step, setStep] = useState(1);
  const [textId, setTextId] = useState(texts[0]?.id || "");
  const [situationId, setSituationId] = useState("opinion");
  const [audience, setAudience] = useState(initialBrief.audience);
  const [purpose, setPurpose] = useState(initialBrief.purpose);
  const [ideas, setIdeas] = useState(defaultIdeas);
  const [plan, setPlan] = useState(emptyPlan);
  const [draft, setDraft] = useState("");
  const [finalText, setFinalText] = useState("");
  const [checks, setChecks] = useState({});
  const [examMode, setExamMode] = useState(false);
  const [examNotes, setExamNotes] = useState([]);
  const [requireCompletion, setRequireCompletion] = useState(false);
  const [alignmentWarning, setAlignmentWarning] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Sauvegarde locale prête.");
  const [ready, setReady] = useState(false);

  const selectedText = texts.find((text) => text.id === textId) || texts[0];
  const baseBrief = useMemo(() => buildWritingBrief(selectedText, situationId), [selectedText, situationId]);
  const writingBrief = useMemo(() => personalizeWritingBrief(baseBrief, audience, purpose), [baseBrief, audience, purpose]);
  const paragraphs = useMemo(() => String(selectedText?.text || "").split("\n").filter(Boolean), [selectedText]);
  const filledIdeas = ideas.filter((row) => row.know.trim() || row.say.trim() || row.proof.trim()).length;
  const ideasWithProof = ideas.filter((row) => row.proof.trim()).length;
  const readyForPlan = filledIdeas >= 2 && ideasWithProof >= 1;
  const revisionRequiredKeys = writingBrief.revisionCriteria.map((item) => revisionCheckKey(writingBrief.typeId, item.id));
  const successRequiredKeys = writingBrief.successCriteria.map((_, index) => successCheckKey(writingBrief.typeId, index));

  useEffect(() => {
    const saved = loadDraft();
    if (saved) {
      const savedText = texts.find((text) => text.id === saved.textId) || texts[0];
      const savedType = saved.situationId || "opinion";
      const savedBrief = buildWritingBrief(savedText, savedType);
      setStep(saved.step || 1);
      setTextId(savedText?.id || "");
      setSituationId(savedType);
      setAudience(saved.audience || savedBrief.audience);
      setPurpose(saved.purpose || savedBrief.purpose);
      setIdeas(saved.ideas || defaultIdeas);
      setPlan(saved.plan || emptyPlan);
      setDraft(saved.draft || "");
      setFinalText(saved.finalText || "");
      setChecks(saved.checks || {});
      setExamMode(Boolean(saved.examMode));
      setExamNotes(saved.examNotes || []);
      setRequireCompletion(Boolean(saved.requireCompletion));
      setAlignmentWarning(Boolean(saved.alignmentWarning));
      setSaveStatus("Travail d’écriture repris automatiquement.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      step, textId, situationId, audience, purpose, ideas, plan, draft, finalText, checks,
      examMode, examNotes, requireCompletion, alignmentWarning, savedAt: new Date().toISOString()
    }));
    setSaveStatus("Sauvegardé automatiquement sur cet appareil.");
  }, [ready, step, textId, situationId, audience, purpose, ideas, plan, draft, finalText, checks, examMode, examNotes, requireCompletion, alignmentWarning]);

  useEffect(() => {
    if (!examNotes.length) setExamNotes(createDefaultExamNotes(writingBrief));
  }, [writingBrief.id]);

  function updateIdea(index, field, value) {
    setIdeas((old) => old.map((row, currentIndex) => currentIndex === index ? { ...row, [field]: value } : row));
  }

  function insertInDraft(text) {
    setDraft((old) => old ? `${old}\n${text}` : text);
  }

  function changeWritingContext(nextTextId, nextTypeId) {
    const nextText = texts.find((text) => text.id === nextTextId) || selectedText;
    const nextBrief = buildWritingBrief(nextText, nextTypeId);
    const hasWork = hasDownstreamWork({ ideas, plan, draft, finalText });
    setTextId(nextText.id);
    setSituationId(nextTypeId);
    setAudience(nextBrief.audience);
    setPurpose(nextBrief.purpose);
    setAlignmentWarning(hasWork);
    if (!examNotes.length) setExamNotes(createDefaultExamNotes(nextBrief));
    setSaveStatus(hasWork
      ? "Contexte d’écriture synchronisé. Ton travail a été conservé; vérifie maintenant son alignement avec la nouvelle consigne."
      : "Type, consigne, destinataire, but, plan et critères synchronisés.");
  }

  function updateAudience(value) {
    setAudience(value);
    if (hasDownstreamWork({ ideas, plan, draft, finalText })) setAlignmentWarning(true);
  }

  function updatePurpose(value) {
    setPurpose(value);
    if (hasDownstreamWork({ ideas, plan, draft, finalText })) setAlignmentWarning(true);
  }

  function resetAudienceAndPurpose() {
    setAudience(baseBrief.audience);
    setPurpose(baseBrief.purpose);
    if (hasDownstreamWork({ ideas, plan, draft, finalText })) setAlignmentWarning(true);
    setSaveStatus("Destinataire et but rétablis selon le type de texte et le texte source.");
  }

  function prepareIdeasFromConsigne() {
    const next = writingBrief.required.slice(0, 3).map((item, index) => requiredToIdea(item, index, writingBrief.typeId));
    while (next.length < 3) next.push({ ...defaultIdeas[next.length] });
    setIdeas(next);
    setAlignmentWarning(false);
    setSaveStatus("Les idées sont préparées à partir du contrat d’écriture synchronisé.");
  }

  function stepRequirementMessage(number) {
    if (number === 1 && (!isFilled(audience) || !isFilled(purpose))) return "Complète le destinataire et le but d’écriture à l’étape 1.";
    if (number === 2 && !readyForPlan) return "Complète au moins 2 idées et au moins 1 preuve à l’étape 2.";
    if (number === 3 && Object.values(plan).some((part) => !isFilled(part))) return "Complète les 4 parties du plan à l’étape 3.";
    if (number === 4 && !isFilled(draft)) return "Écris au moins un début de brouillon à l’étape 4.";
    if (number === 5 && (!revisionRequiredKeys.every((key) => checks[key]) || !successRequiredKeys.every((key) => checks[key]))) return "Réponds à la grille de révision et confirme les critères de réussite de l’étape 5.";
    if (number === 6 && !correctionRequiredKeys.every((key) => checks[key])) return "Coche les balayages de correction de l’étape 6.";
    return "";
  }

  function canGoToStep(nextStep) {
    if (!requireCompletion || nextStep <= step) return true;
    for (let number = 1; number < nextStep; number += 1) {
      const message = stepRequirementMessage(number);
      if (message) {
        setSaveStatus(`Avancement bloqué : ${message}`);
        return false;
      }
    }
    return true;
  }

  function goToStep(nextStep) {
    if (canGoToStep(nextStep)) setStep(nextStep);
  }

  function clearWritingDraft() {
    if (!window.confirm("Effacer le travail d’écriture sauvegardé sur cet appareil ?")) return;
    [STORAGE_KEY, ...OLD_KEYS].forEach((key) => localStorage.removeItem(key));
    setStep(1);
    setTextId(texts[0]?.id || "");
    setSituationId("opinion");
    setAudience(initialBrief.audience);
    setPurpose(initialBrief.purpose);
    setIdeas(defaultIdeas);
    setPlan(emptyPlan);
    setDraft("");
    setFinalText("");
    setChecks({});
    setExamMode(false);
    setExamNotes(createDefaultExamNotes(initialBrief));
    setRequireCompletion(false);
    setAlignmentWarning(false);
    setSaveStatus("Travail d’écriture effacé.");
  }

  return (
    <main className="page">
      <section className="card">
        <h1>Préparation à l’écriture — 6e année</h1>
        <p>Le type de texte pilote maintenant automatiquement la consigne, le destinataire, le but, le plan, la grille de révision et les critères de réussite.</p>
        <p className="yellow"><b>{saveStatus}</b></p>
        <button onClick={clearWritingDraft}>Effacer ma sauvegarde d’écriture</button>
        <details className="card"><summary><b>Réglages administrateur</b></summary><label className="choiceLine"><input type="checkbox" checked={requireCompletion} onChange={() => setRequireCompletion(!requireCompletion)} /><span>Bloquer le passage à l’étape suivante tant que les champs obligatoires ne sont pas remplis.</span></label><p className={requireCompletion ? "yellow" : "green"}><b>{requireCompletion ? "Verrouillage activé." : "Verrouillage désactivé."}</b></p></details>
      </section>

      <WritingBrief writingBrief={writingBrief} alignmentWarning={alignmentWarning} onConfirmAlignment={() => { setAlignmentWarning(false); setSaveStatus("Alignement confirmé avec le contrat d’écriture actuel."); }} />

      <div className="card stepNavigation">{[1, 2, 3, 4, 5, 6, 7].map((number) => <button key={number} className={step === number ? "blue" : ""} onClick={() => goToStep(number)}>Étape {number}</button>)}</div>

      <div className="grid cols">
        <section className="card">
          <h2>Texte source et feuille de notes</h2>
          <label>Texte source</label>
          <select value={textId} onChange={(event) => changeWritingContext(event.target.value, situationId)}>{texts.map((text) => <option key={text.id} value={text.id}>{text.title}</option>)}</select>
          <p><b>Intention de lecture :</b> {selectedText?.intention}</p>
          <div className="card green"><b>Consigne synchronisée</b><p>{writingBrief.task}</p></div>
          <button className={examMode ? "yellow" : "green"} onClick={() => setExamMode(!examMode)}>{examMode ? "Mode simulation : feuille de notes seulement" : "Mode entraînement : texte visible"}</button>
          {!examMode && <details className="card" open={step <= 2}><summary><b>Voir le texte source</b></summary><div className="reader">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></details>}
          {examMode && <p className="yellow"><b>Mode épreuve :</b> le texte complet est caché. Utilise ta feuille de notes.</p>}
          <StepExamNotes notes={examNotes} setNotes={setExamNotes} preciseSituation={writingBrief} />
        </section>

        <section className="card">
          {step === 1 && (
            <div>
              <h2>Étape 1 — Je comprends la situation d’écriture</h2>
              <div className="card yellow"><b>Consigne précise :</b><p>{writingBrief.task}</p></div>
              <label>Type de texte à pratiquer</label>
              <select value={situationId} onChange={(event) => changeWritingContext(textId, event.target.value)}>{WRITING_TYPES.map((type) => <option key={type.id} value={type.id}>{type.title}</option>)}</select>
              <label>À qui j’écris ?</label>
              <input value={audience} onChange={(event) => updateAudience(event.target.value)} />
              <label>Pourquoi j’écris ?</label>
              <input value={purpose} onChange={(event) => updatePurpose(event.target.value)} />
              <button onClick={resetAudienceAndPurpose}>Rétablir le destinataire et le but suggérés</button>
              <div className="card"><b>Dans mon texte, je dois :</b><ul>{writingBrief.required.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div className="card green"><b>Critères de réussite annoncés dès le départ</b><ul>{writingBrief.successCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul></div>
            </div>
          )}
          {step === 2 && <Step2Ideas writingBrief={writingBrief} ideas={ideas} updateIdea={updateIdea} prepareIdeasFromConsigne={prepareIdeasFromConsigne} filledIdeas={filledIdeas} ideasWithProof={ideasWithProof} readyForPlan={readyForPlan} />}
          {step === 3 && <Step3Plan writingBrief={writingBrief} ideas={ideas} plan={plan} setPlan={setPlan} readyForPlan={readyForPlan} />}
          {step === 4 && <Step4Draft writingBrief={writingBrief} plan={plan} draft={draft} setDraft={setDraft} insertInDraft={insertInDraft} wordCount={wordCount} />}
          {step === 5 && <Step5Revision draft={draft} checks={checks} setChecks={setChecks} writingBrief={writingBrief} plan={plan} wordCount={wordCount} examMode={examMode} />}
          {step === 6 && <Step6Correction draft={draft} checks={checks} setChecks={setChecks} />}
          {step === 7 && <div><h2>Étape 7 — Je mets au propre</h2><p><b>Contrat final :</b> {writingBrief.type} pour {writingBrief.audience}, afin de {writingBrief.purpose}.</p><p><b>Compteur approximatif :</b> {wordCount(finalText)} mots</p><textarea style={{ minHeight: 480 }} value={finalText} onChange={(event) => setFinalText(event.target.value)} placeholder="Écris ta version finale ici." /><button className="green" onClick={() => navigator.clipboard?.writeText(finalText)}>Copier ma version finale</button></div>}
        </section>
      </div>
    </main>
  );
}
