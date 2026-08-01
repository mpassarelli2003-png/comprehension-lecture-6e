"use client";

import { useEffect, useMemo, useState } from "react";
import {
  WRITING_REVISION_HISTORY_EVENT,
  WRITING_REVISION_STATES,
  WRITING_TEXT_TYPES,
  clearWritingRevisionHistory,
  readWritingRevisionHistory,
  summarizeWritingRevisionHistory
} from "../../lib/writingRevisionHistory";

function formatDate(value) {
  if (!value) return "Aucune activité";
  try {
    return new Intl.DateTimeFormat("fr-CA", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return "Date non disponible";
  }
}

export default function WritingRevisionHistorySummary() {
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

  function refresh() {
    setRecords(readWritingRevisionHistory());
    setMessage("Historique d’écriture actualisé.");
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

  function erase() {
    if (!window.confirm("Effacer uniquement l’historique local de révision d’écriture?")) return;
    clearWritingRevisionHistory();
    setRecords([]);
    setMessage("L’historique local de révision d’écriture a été effacé.");
  }

  return (
    <section className="card writingHistoryStudent" aria-labelledby="writing-history-title">
      <p className="eyebrow">Bloc 14 — Données locales minimales</p>
      <h2 id="writing-history-title">Historique de révision d’écriture</h2>
      <p>Cette section conserve seulement les critères travaillés et les étapes franchies. Aucun brouillon, aucune phrase et aucune rétroaction personnalisée n’y sont enregistrés.</p>

      <div className="writingHistoryMetrics">
        <article><span>Analyses lancées</span><b>{summary.analysesLaunched}</b></article>
        <article><span>Révisions relancées</span><b>{summary.revisionRelaunches}</b></article>
        <article><span>Simulations vérifiées</span><b>{summary.simulationsVerified}</b></article>
        <article><span>Événements locaux</span><b>{summary.total}</b></article>
      </div>

      <div className="writingHistorySummaryGrid">
        <div>
          <h3>Dernière activité</h3>
          {summary.lastActivity ? (
            <p>
              <b>{WRITING_REVISION_STATES[summary.lastActivity.state]}</b><br />
              {WRITING_TEXT_TYPES[summary.lastActivity.textTypeId]} — {formatDate(summary.lastActivity.occurredAt)}
            </p>
          ) : <p>Aucune activité d’écriture n’est encore enregistrée.</p>}
        </div>
        <div>
          <h3>Critère le plus travaillé</h3>
          <p>{summary.mostWorkedCriterionLabel}</p>
        </div>
        <div>
          <h3>Prochaine priorité générale</h3>
          <p>{summary.nextPriorityLabel}</p>
        </div>
      </div>

      {summary.recent.length > 0 && (
        <details className="writingHistoryRecent">
          <summary><b>Voir les activités récentes</b></summary>
          {summary.recent.slice(0, 6).map((record) => (
            <p key={record.id}>
              <b>{WRITING_REVISION_STATES[record.state]}</b> — {WRITING_TEXT_TYPES[record.textTypeId]} — {formatDate(record.occurredAt)}
            </p>
          ))}
        </details>
      )}

      <div className="writingHistoryActions">
        <button type="button" onClick={refresh}>Actualiser</button>
        <button type="button" onClick={erase}>Effacer l’historique d’écriture</button>
      </div>
      {message && <p className="statusBox" role="status">{message}</p>}
    </section>
  );
}
