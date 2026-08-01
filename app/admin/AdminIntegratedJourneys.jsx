"use client";

import { useEffect, useMemo, useState } from "react";
import baseExercises from "../data/exercises";
import moreExercises from "../data/moreExercises";
import genesisExercise from "../data/genesisExercise";
import secondaryExercises from "../data/secondaryExercises";
import { readPublishedLocalExercises } from "../../lib/exerciseBankRegistration";
import {
  BUILT_IN_INTEGRATED_JOURNEYS,
  INTEGRATED_WRITING_TYPES,
  buildIntegratedJourneyHistoryExport,
  clearIntegratedJourneyHistory,
  deleteCustomIntegratedJourney,
  getIntegratedJourneyBank,
  readIntegratedJourneyHistory,
  summarizeIntegratedJourneyBank,
  summarizeIntegratedJourneyHistory,
  validateIntegratedJourney,
  validateIntegratedJourneyHistory,
  writeCustomIntegratedJourney
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

function levelId(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("sec") && normalized.includes("2")) return "sec2";
  if (normalized.includes("sec") && normalized.includes("1")) return "sec1";
  return "6e";
}

function safeFileName(value) {
  return String(value || "parcours").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminIntegratedJourneys() {
  const [exercises, setExercises] = useState(staticExercises);
  const [journeys, setJourneys] = useState(BUILT_IN_INTEGRATED_JOURNEYS);
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({
    id: "",
    title: "",
    exerciseId: staticExercises[0]?.id || "",
    levelId: "6e",
    readingTextType: staticExercises[0]?.textType || "",
    readingIntention: staticExercises[0]?.intention || "",
    writingTypeId: "explicatif",
    writingIntention: "",
    status: "draft",
    source: "local"
  });
  const [message, setMessage] = useState("");

  function reload() {
    const availableExercises = uniqueExercises([...staticExercises, ...readPublishedLocalExercises()]);
    setExercises(availableExercises);
    setJourneys(getIntegratedJourneyBank(window.localStorage));
    setHistory(readIntegratedJourneyHistory(window.localStorage));
  }

  useEffect(() => {
    reload();
  }, []);

  const summary = useMemo(() => summarizeIntegratedJourneyBank(journeys, exercises), [journeys, exercises]);
  const historySummary = useMemo(() => summarizeIntegratedJourneyHistory(history), [history]);
  const selectedExercise = exercises.find((exercise) => exercise.id === form.exerciseId);
  const currentAudit = validateIntegratedJourney(form, exercises);

  function chooseExercise(id) {
    const exercise = exercises.find((item) => item.id === id);
    setForm((old) => ({
      ...old,
      exerciseId: id,
      levelId: levelId(exercise?.level),
      readingTextType: exercise?.textType || "",
      readingIntention: exercise?.intention || old.readingIntention
    }));
  }

  function chooseJourney(id) {
    const journey = journeys.find((item) => item.id === id);
    setSelectedId(id);
    if (journey) setForm({ ...journey });
    setMessage("");
  }

  function newJourney() {
    const exercise = exercises[0];
    setSelectedId("");
    setForm({
      id: `parcours-local-${Date.now()}`,
      title: "",
      exerciseId: exercise?.id || "",
      levelId: levelId(exercise?.level),
      readingTextType: exercise?.textType || "",
      readingIntention: exercise?.intention || "",
      writingTypeId: "opinion",
      writingIntention: "",
      status: "draft",
      source: "local"
    });
    setMessage("Nouveau parcours local.");
  }

  function saveJourney() {
    const audit = validateIntegratedJourney(form, exercises);
    if (!audit.valid) {
      setMessage(`Parcours incomplet : ${audit.errors.join(" ")}`);
      return;
    }
    const status = audit.warnings.length ? "draft" : "ready";
    const next = writeCustomIntegratedJourney({ ...audit.journey, status, source: "local" }, window.localStorage);
    setJourneys([...BUILT_IN_INTEGRATED_JOURNEYS, ...next]);
    setSelectedId(audit.journey.id);
    setForm({ ...audit.journey, status, source: "local" });
    setMessage(audit.warnings.length
      ? `Parcours sauvegardé comme brouillon : ${audit.warnings.join(" ")}`
      : "Parcours local sauvegardé et prêt.");
  }

  function removeJourney() {
    if (!form.id || form.source === "integrated") {
      setMessage("Les parcours intégrés ne peuvent pas être supprimés depuis le navigateur.");
      return;
    }
    if (!window.confirm("Supprimer ce parcours local?")) return;
    const next = deleteCustomIntegratedJourney(form.id, window.localStorage);
    setJourneys([...BUILT_IN_INTEGRATED_JOURNEYS, ...next]);
    newJourney();
    setMessage("Parcours local supprimé.");
  }

  function downloadJson(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportJourney() {
    const audit = validateIntegratedJourney(form, exercises);
    const journey = audit.journey;
    downloadJson({
      exportType: "parcours-lecture-ecriture",
      schemaVersion: journey.version,
      exportedAt: new Date().toISOString(),
      validation: { status: audit.status, errors: audit.errors, warnings: audit.warnings },
      journey
    }, `${safeFileName(journey.title || journey.id)}.json`);
    setMessage("Parcours exporté sans texte d’élève ni contenu de travail.");
  }

  function exportHistory() {
    downloadJson(
      buildIntegratedJourneyHistoryExport(history, journeys),
      "historique-parcours-lecture-ecriture.json"
    );
    setMessage("Historique minimal exporté.");
  }

  function validateHistory() {
    const result = validateIntegratedJourneyHistory(history);
    setMessage(result.valid ? `Historique conforme — ${result.message}` : `Historique à corriger — ${result.forbiddenFound.join(", ")}`);
  }

  function eraseHistory() {
    if (!window.confirm("Effacer l’historique local des parcours lecture-écriture?")) return;
    clearIntegratedJourneyHistory(window.localStorage);
    setHistory([]);
    setMessage("Historique des parcours effacé sur cet appareil.");
  }

  return (
    <section className="card adminIntegratedJourneys">
      <p className="eyebrow">Bloc 15</p>
      <h2>Parcours lecture-écriture</h2>
      <p>Associe un texte de lecture à une tâche d’écriture et vérifie le niveau, les intentions et la cohérence du parcours. Aucun texte produit par l’élève n’est affiché ici.</p>

      <div className="journeyAdminMetrics">
        <div><span>Parcours</span><b>{summary.total}</b></div>
        <div><span>Prêts</span><b>{summary.ready}</b></div>
        <div><span>À vérifier</span><b>{summary.review}</b></div>
        <div><span>Bloqués</span><b>{summary.blocked}</b></div>
        <div><span>Événements minimaux</span><b>{historySummary.total}</b></div>
        <div><span>Parcours terminés</span><b>{historySummary.completed}</b></div>
      </div>

      <div className="journeyAdminColumns">
        <div>
          <h3>Parcours disponibles</h3>
          <button onClick={newJourney}>Créer un parcours local</button>
          <select value={selectedId} onChange={(event) => chooseJourney(event.target.value)}>
            <option value="">Choisir un parcours</option>
            {journeys.map((journey) => {
              const audit = validateIntegratedJourney(journey, exercises);
              return <option key={journey.id} value={journey.id}>{audit.status === "blocked" ? "×" : audit.status === "review" ? "!" : "✓"} {journey.title}</option>;
            })}
          </select>

          <label>Identifiant</label>
          <input value={form.id} disabled={form.source === "integrated"} onChange={(event) => setForm({ ...form, id: event.target.value })} />
          <label>Titre du parcours</label>
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <label>Texte de lecture</label>
          <select value={form.exerciseId} onChange={(event) => chooseExercise(event.target.value)}>
            {Object.entries(LEVEL_LABELS).map(([id, label]) => (
              <optgroup label={label} key={id}>
                {exercises.filter((exercise) => levelId(exercise.level) === id).map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.title}</option>)}
              </optgroup>
            ))}
          </select>
          <p><b>Niveau détecté :</b> {LEVEL_LABELS[form.levelId]}</p>
          <p><b>Type lu :</b> {selectedExercise?.textType || form.readingTextType || "À préciser"}</p>
          <label>Intention de lecture</label>
          <textarea value={form.readingIntention} onChange={(event) => setForm({ ...form, readingIntention: event.target.value })} />
          <label>Type d’écriture</label>
          <select value={form.writingTypeId} onChange={(event) => setForm({ ...form, writingTypeId: event.target.value })}>
            {Object.entries(INTEGRATED_WRITING_TYPES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <label>Intention d’écriture</label>
          <textarea value={form.writingIntention} onChange={(event) => setForm({ ...form, writingIntention: event.target.value })} />

          <div className={`card ${currentAudit.status === "ready" ? "green" : currentAudit.status === "review" ? "yellow" : "pink"}`}>
            <b>{currentAudit.status === "ready" ? "Parcours cohérent" : currentAudit.status === "review" ? "Révision recommandée" : "Parcours incomplet"}</b>
            {currentAudit.errors.map((error) => <p key={error}>× {error}</p>)}
            {currentAudit.warnings.map((warning) => <p key={warning}>! {warning}</p>)}
          </div>

          <button className="green" disabled={form.source === "integrated"} onClick={saveJourney}>Enregistrer le parcours local</button>
          <button className="violet" onClick={exportJourney}>Exporter le JSON du parcours</button>
          {form.source !== "integrated" && <button onClick={removeJourney}>Supprimer le parcours local</button>}
        </div>

        <div>
          <h3>Couverture et historique minimal</h3>
          {Object.entries(summary.byLevel).map(([id, count]) => <p key={id}><b>{LEVEL_LABELS[id]} :</b> {count} parcours</p>)}
          <h4>Entraînement et simulation</h4>
          {Object.entries(historySummary.byMode).map(([id, count]) => <p key={id}><b>{MODE_LABELS[id]} :</b> {count} événement(s)</p>)}
          <h4>États récents</h4>
          {historySummary.recent.length ? historySummary.recent.map((event) => (
            <p key={event.id}><b>{event.eventType}</b> — {LEVEL_LABELS[event.levelId]} — {MODE_LABELS[event.modeId]}</p>
          )) : <p>Aucun parcours n’a encore été commencé sur cet appareil.</p>}
          <button className="blue" onClick={reload}>Actualiser</button>
          <button className="violet" onClick={validateHistory}>Valider l’intégrité</button>
          <button className="green" onClick={exportHistory}>Exporter le JSON minimal</button>
          <button onClick={eraseHistory}>Effacer l’historique</button>
          <p className="yellow">L’historique contient des identifiants, dates, niveaux, modes et compteurs. Il exclut les réponses, preuves, notes actives, brouillons, versions finales et rétroactions personnalisées.</p>
        </div>
      </div>

      {message && <p className="statusBox" role="status">{message}</p>}
    </section>
  );
}
