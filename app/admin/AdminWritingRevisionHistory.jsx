"use client";

import { useEffect, useMemo, useState } from "react";
import {
  WRITING_CRITERION_LABELS,
  WRITING_REVISION_HISTORY_EVENT,
  WRITING_REVISION_STATES,
  WRITING_TEXT_TYPES,
  buildWritingRevisionHistoryExport,
  clearWritingRevisionHistory,
  readWritingRevisionHistory,
  summarizeWritingRevisionHistory,
  validateWritingRevisionHistory
} from "../../lib/writingRevisionHistory";

function downloadPayload(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `historique-revision-ecriture-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminWritingRevisionHistory() {
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

  function refresh() {
    setRecords(readWritingRevisionHistory());
    setMessage("Historique local d’écriture actualisé.");
  }

  useEffect(() => {
    refresh();
    const update = () => setRecords(readWritingRevisionHistory());
    window.addEventListener(WRITING_REVISION_HISTORY_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(WRITING_REVISION_HISTORY_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const summary = useMemo(() => summarizeWritingRevisionHistory(records), [records]);

  function validate() {
    const result = validateWritingRevisionHistory(records);
    setMessage(result.valid
      ? `Validation réussie — ${result.message}`
      : `Validation à corriger — champs interdits : ${result.forbiddenFound.join(", ") || "inconnus"}.`);
  }

  function download() {
    downloadPayload(buildWritingRevisionHistoryExport(records));
    setMessage("Export JSON minimal téléchargé.");
  }

  function erase() {
    if (!window.confirm("Effacer l’historique local de révision d’écriture sur cet appareil?")) return;
    clearWritingRevisionHistory();
    setRecords([]);
    setMessage("Historique local d’écriture effacé.");
  }

  return (
    <section className="card adminWritingHistory" aria-labelledby="admin-writing-history-title">
      <p className="eyebrow">Bloc 14 — Administration locale</p>
      <h2 id="admin-writing-history-title">Historique local d’écriture</h2>
      <p>Cette vue résume uniquement des événements pédagogiques minimaux. Elle ne contient ni brouillon, ni version finale, ni phrase d’élève, ni rétroaction personnalisée complète.</p>

      <div className="writingHistoryMetrics">
        <article><span>Événements</span><b>{summary.total}</b></article>
        <article><span>Analyses</span><b>{summary.analysesLaunched}</b></article>
        <article><span>Entraînement</span><b>{summary.byMode.training}</b></article>
        <article><span>Simulation</span><b>{summary.byMode.simulation}</b></article>
        <article><span>Simulations complétées</span><b>{summary.simulationsVerified}</b></article>
      </div>

      <div className="writingHistoryAdminGrid">
        <div>
          <h3>Répartition par critère</h3>
          {Object.entries(WRITING_CRITERION_LABELS).map(([criterion, label]) => (
            <p key={criterion}><b>{label} :</b> {summary.byCriterion[criterion]}</p>
          ))}
        </div>
        <div>
          <h3>Entraînement et simulation</h3>
          <p><b>Entraînement :</b> {summary.byMode.training}</p>
          <p><b>Simulation :</b> {summary.byMode.simulation}</p>
          <h3>États enregistrés</h3>
          {Object.entries(WRITING_REVISION_STATES).map(([state, label]) => (
            <p key={state}><b>{label} :</b> {summary.byState[state]}</p>
          ))}
        </div>
        <div>
          <h3>Types de textes travaillés</h3>
          {Object.entries(WRITING_TEXT_TYPES).map(([type, label]) => (
            <p key={type}><b>{label} :</b> {summary.byTextType[type]}</p>
          ))}
        </div>
      </div>

      <div className="writingHistoryActions">
        <button type="button" className="blue" onClick={refresh}>Actualiser</button>
        <button type="button" className="violet" onClick={validate}>Valider l’intégrité</button>
        <button type="button" className="green" onClick={download}>Exporter le JSON</button>
        <button type="button" onClick={erase}>Effacer l’historique</button>
      </div>
      {message && <p className="statusBox" role="status">{message}</p>}
      <p className="yellow">Limite : cet historique est propre à ce navigateur et peut être effacé avec les données locales. Il ne suit pas un élève entre plusieurs appareils.</p>
    </section>
  );
}
