"use client";

import { useEffect, useMemo, useState } from "react";
import baseExercises from "../data/exercises";
import moreExercises from "../data/moreExercises";
import genesisExercise from "../data/genesisExercise";
import secondaryExercises from "../data/secondaryExercises";
import { readPublishedLocalExercises } from "../../lib/exerciseBankRegistration";
import {
  BUILT_IN_INTEGRATED_JOURNEYS,
  INTEGRATED_JOURNEY_STAGES,
  READING_WORK_STORAGE_KEY,
  WRITING_WORK_STORAGE_KEY,
  buildJourneyNoteSheet,
  buildReadingWorkForJourney,
  buildWritingWorkForJourney,
  clearActiveIntegratedJourney,
  completeIntegratedJourney,
  getIntegratedJourneyBank,
  inspectReadingWork,
  inspectWritingWork,
  readActiveIntegratedJourney,
  readJourneyNoteSheet,
  startIntegratedJourney,
  synchronizeIntegratedJourney,
  validateIntegratedJourney,
  writeJourneyNoteSheet
} from "../../lib/integratedJourney";

const staticExercises = [...baseExercises, ...moreExercises, genesisExercise, ...secondaryExercises];
const LEVEL_LABELS = { "6e": "6e année", sec1: "Secondaire 1", sec2: "Secondaire 2" };
const MODE_LABELS = { training: "Entraînement", simulation: "Simulation" };

function uniqueExercises(values) {
  const seen = new Set();
  return values.filter((exercise) => {
    if (!exercise?.id || seen.has(exercise.id)) return false;
    seen.add(exercise.id);
    return true;
  });
}

function readJson(key) {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function noteHasContent(row) {
  return [row?.info, row?.fact, row?.keyword, row?.opinionLink].some((value) => String(value || "").trim());
}

export default function IntegratedJourneyPage() {
  const [exercises, setExercises] = useState(staticExercises);
  const [journeys, setJourneys] = useState(BUILT_IN_INTEGRATED_JOURNEYS);
  const [active, setActive] = useState(null);
  const [modeChoice, setModeChoice] = useState("training");
  const [readingWork, setReadingWork] = useState(null);
  const [writingWork, setWritingWork] = useState(null);
  const [noteSheet, setNoteSheet] = useState(null);
  const [message, setMessage] = useState("");

  function reload() {
    const availableExercises = uniqueExercises([...staticExercises, ...readPublishedLocalExercises()]);
    const availableJourneys = getIntegratedJourneyBank(window.localStorage);
    const currentActive = readActiveIntegratedJourney(window.localStorage);
    const currentReading = readJson(READING_WORK_STORAGE_KEY);
    const currentWriting = readJson(WRITING_WORK_STORAGE_KEY);
    const currentNotes = readJourneyNoteSheet(window.localStorage);
    setExercises(availableExercises);
    setJourneys(availableJourneys);
    setReadingWork(currentReading);
    setWritingWork(currentWriting);
    setNoteSheet(currentNotes);

    if (currentActive) {
      const journey = availableJourneys.find((item) => item.id === currentActive.journeyId);
      const exercise = availableExercises.find((item) => item.id === journey?.exerciseId);
      const synchronized = synchronizeIntegratedJourney(
        currentActive,
        currentReading,
        currentWriting,
        exercise,
        currentNotes,
        window.localStorage
      );
      setActive(synchronized?.active || currentActive);
      setModeChoice(currentActive.modeId);
    } else {
      setActive(null);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const activeJourney = useMemo(
    () => journeys.find((journey) => journey.id === active?.journeyId) || null,
    [journeys, active?.journeyId]
  );
  const activeExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === activeJourney?.exerciseId) || null,
    [exercises, activeJourney?.exerciseId]
  );
  const reading = useMemo(() => inspectReadingWork(readingWork, activeExercise), [readingWork, activeExercise]);
  const writing = useMemo(() => inspectWritingWork(writingWork || {}), [writingWork]);

  function beginJourney(journey) {
    const audit = validateIntegratedJourney(journey, exercises);
    if (!audit.valid) {
      setMessage(`Parcours bloqué : ${audit.errors.join(" ")}`);
      return;
    }
    const current = readJson(READING_WORK_STORAGE_KEY);
    if (current && (Object.keys(current.answers || {}).length || Object.keys(current.notes || {}).length)) {
      const confirmed = window.confirm("Commencer ce parcours remplacera le travail de lecture actuellement ouvert sur cet appareil. Continuer?");
      if (!confirmed) return;
    }
    const nextActive = startIntegratedJourney(journey, modeChoice, window.localStorage);
    const nextReading = buildReadingWorkForJourney(journey, audit.exercise, modeChoice);
    localStorage.setItem(READING_WORK_STORAGE_KEY, JSON.stringify(nextReading));
    localStorage.removeItem(WRITING_WORK_STORAGE_KEY);
    setActive(nextActive);
    setReadingWork(nextReading);
    setWritingWork(null);
    setNoteSheet(null);
    window.location.href = "/";
  }

  function prepareNotes() {
    if (!activeJourney || !activeExercise) return;
    const sheet = buildJourneyNoteSheet(readingWork || {}, activeExercise, active.modeId);
    const saved = writeJourneyNoteSheet({ ...sheet, journeyId: activeJourney.id }, window.localStorage);
    setNoteSheet(saved);
    const synchronized = synchronizeIntegratedJourney(active, readingWork, writingWork, activeExercise, saved, window.localStorage);
    setActive(synchronized.active);
    setMessage(active.modeId === "simulation"
      ? "Feuille limitée préparée à partir de tes propres notes et passages. Aucune aide de contenu n’a été ajoutée."
      : "Feuille de notes préparée. Tu peux sélectionner et organiser ce que tu gardes pour écrire.");
  }

  function updateNote(index, field, value) {
    if (!noteSheet) return;
    const rows = noteSheet.rows.map((row, currentIndex) => currentIndex === index ? { ...row, [field]: value } : row);
    const saved = writeJourneyNoteSheet({ ...noteSheet, rows }, window.localStorage);
    setNoteSheet(saved);
    const synchronized = synchronizeIntegratedJourney(active, readingWork, writingWork, activeExercise, saved, window.localStorage);
    setActive(synchronized.active);
  }

  function openWriting() {
    if (!activeJourney) return;
    const audit = validateIntegratedJourney(activeJourney, exercises);
    if (!audit.valid) {
      setMessage(`Écriture bloquée : ${audit.errors.join(" ")}`);
      return;
    }
    if (!reading.readyForWriting) {
      const confirmed = window.confirm("Aucune réponse ou note de lecture n’est encore repérée. Ouvrir tout de même l’écriture?");
      if (!confirmed) return;
    }
    const sheet = noteSheet || writeJourneyNoteSheet({
      ...buildJourneyNoteSheet(readingWork || {}, activeExercise, active.modeId),
      journeyId: activeJourney.id
    }, window.localStorage);
    const nextWriting = buildWritingWorkForJourney(activeJourney, sheet, active.modeId);
    localStorage.setItem(WRITING_WORK_STORAGE_KEY, JSON.stringify(nextWriting));
    setWritingWork(nextWriting);
    synchronizeIntegratedJourney(active, readingWork, nextWriting, activeExercise, sheet, window.localStorage);
    window.location.href = "/ecriture";
  }

  function finishJourney() {
    if (!active) return;
    const next = completeIntegratedJourney(active, window.localStorage);
    setActive(next);
    setMessage("Parcours terminé. Le bilan conserve seulement des métadonnées de progression.");
  }

  function abandonJourney() {
    if (!window.confirm("Fermer le parcours actif? Les modules de lecture et d’écriture conservent leurs sauvegardes séparées.")) return;
    clearActiveIntegratedJourney(window.localStorage);
    setActive(null);
    setNoteSheet(null);
    setMessage("Parcours actif fermé.");
  }

  if (!active || !activeJourney) {
    return (
      <main className="page integratedJourneyPage">
        <section className="card hero">
          <p className="eyebrow">Bloc 15</p>
          <h1>Parcours complet lecture → écriture</h1>
          <p>Choisis un texte, lis-le, réponds aux questions, prépare une feuille de notes, puis rédige un texte directement lié à cette lecture.</p>
          <div className="journeyModeChoice">
            {Object.entries(MODE_LABELS).map(([id, label]) => (
              <button key={id} className={modeChoice === id ? "blue" : ""} onClick={() => setModeChoice(id)}>{label}</button>
            ))}
          </div>
          {message && <p className="statusBox" role="status">{message}</p>}
        </section>

        <section className="journeyCardGrid">
          {journeys.map((journey) => {
            const audit = validateIntegratedJourney(journey, exercises);
            const exercise = audit.exercise;
            return (
              <article className="card journeyChoiceCard" key={journey.id}>
                <div className="journeyCardHeader">
                  <span className={`badge ${audit.status === "ready" ? "green" : audit.status === "review" ? "yellow" : "pink"}`}>{audit.status === "ready" ? "Prêt" : audit.status === "review" ? "À vérifier" : "Bloqué"}</span>
                  <span>{LEVEL_LABELS[journey.levelId]}</span>
                </div>
                <h2>{journey.title}</h2>
                <p><b>Lecture :</b> {exercise?.title || journey.exerciseId}</p>
                <p><b>Intention de lecture :</b> {journey.readingIntention}</p>
                <p><b>Écriture :</b> {journey.writingIntention}</p>
                {audit.errors.map((error) => <p className="pink" key={error}>{error}</p>)}
                {audit.warnings.map((warning) => <p className="yellow" key={warning}>{warning}</p>)}
                <button className="blue" disabled={!audit.valid} onClick={() => beginJourney(journey)}>Commencer en mode {MODE_LABELS[modeChoice].toLowerCase()}</button>
              </article>
            );
          })}
        </section>
      </main>
    );
  }

  return (
    <main className="page integratedJourneyPage">
      <section className="card hero">
        <p className="eyebrow">Parcours actif — {LEVEL_LABELS[active.levelId]}</p>
        <h1>{activeJourney.title}</h1>
        <p><b>Mode :</b> {MODE_LABELS[active.modeId]} — <b>Étape :</b> {INTEGRATED_JOURNEY_STAGES[active.stage]}</p>
        <div className="journeyStageTrack">
          {Object.entries(INTEGRATED_JOURNEY_STAGES).map(([id, label]) => <span key={id} className={active.stage === id ? "active" : ""}>{label}</span>)}
        </div>
        <button onClick={reload}>Actualiser le bilan</button>
        <button onClick={abandonJourney}>Fermer ce parcours</button>
        {message && <p className="statusBox" role="status">{message}</p>}
      </section>

      <section className="journeyTwoColumns">
        <article className="card">
          <p className="eyebrow">1 — Lecture</p>
          <h2>{activeExercise?.title || activeJourney.exerciseId}</h2>
          <p>{activeJourney.readingIntention}</p>
          <div className="journeyMetrics">
            <div><b>{reading.questionsCompleted}</b><span>questions complétées</span></div>
            <div><b>{reading.questionCount}</b><span>questions disponibles</span></div>
            <div><b>{reading.noteCount}</b><span>notes ou passages</span></div>
          </div>
          {reading.warning && <p className="yellow"><b>À signaler :</b> {reading.warning}</p>}
          <a className="buttonLink blue" href="/">Ouvrir ou reprendre la lecture</a>
        </article>

        <article className="card">
          <p className="eyebrow">2 — Transition</p>
          <h2>Ce que je garde pour écrire</h2>
          <p>{active.modeId === "simulation"
            ? "La feuille est limitée à tes propres notes. Aucun indice, exemple ou contenu nouveau n’est généré."
            : "Transforme tes notes et les passages retenus en informations utiles pour ta tâche d’écriture."}</p>
          <button className="green" onClick={prepareNotes}>{noteSheet ? "Reconstruire la feuille depuis la lecture" : "Préparer ma feuille de notes"}</button>
          {noteSheet?.rows?.map((row, index) => (
            <div className="card journeyNoteRow" key={row.id}>
              <h3>{active.modeId === "simulation" ? `Note ${index + 1}` : row.sourceLabel || `Note ${index + 1}`}</h3>
              <label>Information importante</label>
              <textarea value={row.info || ""} onChange={(event) => updateNote(index, "info", event.target.value)} />
              <label>Fait ou exemple utile</label>
              <input value={row.fact || ""} onChange={(event) => updateNote(index, "fact", event.target.value)} />
              <label>Mot-clé</label>
              <input value={row.keyword || ""} onChange={(event) => updateNote(index, "keyword", event.target.value)} />
              {active.modeId === "training" && (
                <>
                  <label>Lien possible avec mon texte</label>
                  <input value={row.opinionLink || ""} onChange={(event) => updateNote(index, "opinionLink", event.target.value)} />
                </>
              )}
            </div>
          ))}
          {noteSheet && <p><b>Notes remplies :</b> {noteSheet.rows.filter(noteHasContent).length} / {noteSheet.rows.length}</p>}
        </article>
      </section>

      <section className="journeyTwoColumns">
        <article className="card">
          <p className="eyebrow">3 — Écriture</p>
          <h2>{activeJourney.writingIntention}</h2>
          <p><b>Type :</b> {activeJourney.writingTypeId}</p>
          <p><b>Mode :</b> {active.modeId === "simulation" ? "liste de vérification seulement" : "rappels et rétroaction formative disponibles"}</p>
          {!reading.readyForWriting && <p className="yellow">L’écriture sans lecture préparatoire demeure possible, mais elle est clairement signalée.</p>}
          <button className="violet" onClick={openWriting}>Passer à la planification et à l’écriture</button>
        </article>

        <article className="card">
          <p className="eyebrow">4 — Bilan</p>
          <h2>Progression lecture + écriture</h2>
          <div className="journeyMetrics">
            <div><b>{reading.questionsCompleted}</b><span>questions complétées</span></div>
            <div><b>{active.noteCount}</b><span>notes retenues</span></div>
            <div><b>{writing.writingStep}</b><span>étape d’écriture</span></div>
            <div><b>{writing.criteriaWorkedCount}</b><span>critères vérifiés</span></div>
          </div>
          <p className="yellow">Ce bilan ne conserve ni réponses de lecture, ni passages sélectionnés, ni brouillon, ni version finale.</p>
          <button className="green" disabled={!writing.reviewReached} onClick={finishJourney}>Terminer et enregistrer le bilan minimal</button>
          {!writing.reviewReached && <p>Le parcours pourra être terminé lorsque l’étape de révision d’écriture aura été atteinte.</p>}
        </article>
      </section>
    </main>
  );
}
