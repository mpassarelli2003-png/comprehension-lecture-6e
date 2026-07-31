"use client";

import { useEffect, useMemo, useState } from "react";
import { QUESTION_DIMENSIONS } from "../../lib/questionClassification";
import {
  buildStudentProgressSummary,
  clearProgressRecords,
  readProgressRecords,
  summarizeProgress
} from "../../lib/progressTracking";

const MODE_LABELS = { training: "Entraînement", simulation: "Simulation" };
const STATUS_LABELS = { complete: "complètes", partial: "partielles", missing: "manquantes" };

function ProgressBar({ value = 0 }) {
  return (
    <div className="progressBar" aria-label={`${value}% de réponses complètes`}>
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function StatusCounts({ value }) {
  return (
    <p className="progressCounts">
      {Object.entries(STATUS_LABELS).map(([key, label]) => (
        <span key={key}><b>{value?.[key] || 0}</b> {label}</span>
      ))}
    </p>
  );
}

export default function ProgressionPage() {
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

  function reload() {
    setRecords(readProgressRecords(window.localStorage));
    setMessage("Suivi actualisé.");
  }

  useEffect(() => {
    setRecords(readProgressRecords(window.localStorage));
  }, []);

  const summary = useMemo(() => summarizeProgress(records), [records]);
  const student = useMemo(() => buildStudentProgressSummary(summary), [summary]);

  function eraseProgress() {
    const confirmed = window.confirm("Effacer le suivi de progression enregistré sur cet appareil?");
    if (!confirmed) return;
    clearProgressRecords(window.localStorage);
    setRecords([]);
    setMessage("Le suivi de progression a été effacé sur cet appareil.");
  }

  return (
    <main className="page progressPage">
      <section className="card hero progressHero">
        <p className="eyebrow">Tableau de bord élève</p>
        <h1>Ma progression en lecture</h1>
        <p>Ce tableau présente la structure de tes réponses. Il ne juge pas si ton idée est vraie ou fausse.</p>
        <div className="progressActions">
          <a className="buttonLink blue" href="/">Retourner aux exercices</a>
          <button type="button" onClick={reload}>Actualiser</button>
          <button type="button" onClick={eraseProgress}>Effacer mon suivi</button>
        </div>
        {message && <p className="statusBox" role="status">{message}</p>}
      </section>

      <section className="progressOverview">
        <article className="card progressMetric">
          <span>Réponses suivies</span>
          <b>{summary.totals.total}</b>
        </article>
        <article className="card progressMetric">
          <span>Réponses complètes</span>
          <b>{summary.totals.complete}</b>
        </article>
        <article className="card progressMetric">
          <span>Réponses partielles</span>
          <b>{summary.totals.partial}</b>
        </article>
        <article className="card progressMetric">
          <span>À commencer</span>
          <b>{summary.totals.missing}</b>
        </article>
      </section>

      <section className="card progressStudentSummary">
        <h2>Mon résumé</h2>
        <p><b>{student.title}</b></p>
        <p>{student.strength}</p>
        <p>{student.priority}</p>
        <p>{student.modeComparison}</p>
      </section>

      <section className="card">
        <h2>Progression par dimension</h2>
        <div className="progressDimensionGrid">
          {Object.entries(QUESTION_DIMENSIONS).map(([dimension, meta]) => {
            const value = summary.byDimension[dimension];
            return (
              <article className="progressDimension" key={dimension}>
                <div className="progressDimensionHeader">
                  <h3>{meta.label}</h3>
                  <b>{value.completionRate}%</b>
                </div>
                <ProgressBar value={value.completionRate} />
                <StatusCounts value={value} />
              </article>
            );
          })}
        </div>
      </section>

      <section className="progressTwoColumns">
        <article className="card">
          <h2>Entraînement et simulation</h2>
          {Object.entries(MODE_LABELS).map(([mode, label]) => {
            const value = summary.byMode[mode];
            return (
              <div className="progressMode" key={mode}>
                <div className="progressDimensionHeader"><h3>{label}</h3><b>{value.completionRate}%</b></div>
                <ProgressBar value={value.completionRate} />
                <StatusCounts value={value} />
              </div>
            );
          })}
        </article>

        <article className="card">
          <h2>Ce qui revient souvent</h2>
          {summary.frequentNeeds.length ? summary.frequentNeeds.slice(0, 5).map((need) => (
            <p className="progressNeed" key={need.code}><b>{need.count}</b> — {need.label}</p>
          )) : <p>Aucun besoin fréquent n’est encore repéré.</p>}
          <p className="yellow">Ces données indiquent les exigences manquantes. Elles ne révèlent aucune réponse attendue.</p>
        </article>
      </section>

      <section className="card">
        <h2>Activité récente</h2>
        {summary.recent.length ? (
          <div className="progressRecentList">
            {summary.recent.map((record) => (
              <article key={record.id}>
                <div>
                  <b>{record.exerciseTitle || record.exerciseId}</b>
                  <span>Question {record.questionOrder} — {QUESTION_DIMENSIONS[record.dimension]?.label}</span>
                </div>
                <span className={`badge progressBadge-${record.statusBucket}`}>{record.statusBucket === "complete" ? "Complète" : record.statusBucket === "partial" ? "Partielle" : "À commencer"}</span>
              </article>
            ))}
          </div>
        ) : <p>Les vérifications de réponse apparaîtront ici.</p>}
      </section>
    </main>
  );
}
