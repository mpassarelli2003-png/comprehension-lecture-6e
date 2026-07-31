"use client";

import { useEffect, useMemo, useState } from "react";
import { QUESTION_DIMENSIONS } from "../../lib/questionClassification";
import {
  PROGRESS_STORAGE_KEY,
  readProgressRecords,
  summarizeProgress,
  validateProgressData
} from "../../lib/progressTracking";

export default function AdminProgressSummary() {
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

  function refresh() {
    setRecords(readProgressRecords(window.localStorage));
    setMessage("Données de progression actualisées.");
  }

  useEffect(() => {
    setRecords(readProgressRecords(window.localStorage));
  }, []);

  const summary = useMemo(() => summarizeProgress(records), [records]);

  function validate() {
    const result = validateProgressData(records);
    setMessage(result.valid ? `Validation réussie — ${result.message}` : `Validation à corriger — ${result.message}`);
  }

  function download() {
    const payload = {
      exportedAt: new Date().toISOString(),
      storageKey: PROGRESS_STORAGE_KEY,
      summary,
      records
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "suivi-progression-lecture.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Copie du suivi téléchargée.");
  }

  return (
    <div className="card adminProgressSummary">
      <h2>Suivi de progression</h2>
      <p>Vue détaillée des résultats structurels enregistrés sur cet appareil. Aucun texte de réponse ni passage n’est conservé ici.</p>

      <div className="adminProgressGrid">
        <div><p>Réponses suivies</p><b>{summary.totals.total}</b></div>
        <div><p>Complètes</p><b>{summary.totals.complete}</b></div>
        <div><p>Partielles</p><b>{summary.totals.partial}</b></div>
        <div><p>Manquantes</p><b>{summary.totals.missing}</b></div>
        <div><p>Événements conservés</p><b>{summary.historyCount}</b></div>
        <div><p>Taux de complétion</p><b>{summary.totals.completionRate}%</b></div>
      </div>

      <h3>Progression par dimension</h3>
      <div className="adminProgressTable">
        <div className="adminProgressHeader"><span>Dimension</span><span>Total</span><span>Complètes</span><span>Partielles</span><span>Taux</span></div>
        {Object.entries(QUESTION_DIMENSIONS).map(([dimension, meta]) => {
          const value = summary.byDimension[dimension];
          return (
            <div key={dimension}>
              <b>{meta.label}</b>
              <span>{value.total}</span>
              <span>{value.complete}</span>
              <span>{value.partial}</span>
              <span>{value.completionRate}%</span>
            </div>
          );
        })}
      </div>

      <h3>Entraînement et simulation</h3>
      <p><b>Entraînement :</b> {summary.byMode.training.complete} complète(s) sur {summary.byMode.training.total} — {summary.byMode.training.completionRate}%.</p>
      <p><b>Simulation :</b> {summary.byMode.simulation.complete} complète(s) sur {summary.byMode.simulation.total} — {summary.byMode.simulation.completionRate}%.</p>

      <h3>Types de difficultés fréquentes</h3>
      {summary.frequentNeeds.length ? summary.frequentNeeds.slice(0, 8).map((need) => (
        <p key={need.code}><b>{need.count}</b> — {need.label}</p>
      )) : <p>Aucune difficulté fréquente n’est encore repérée.</p>}

      <button className="blue" onClick={refresh}>Actualiser</button>
      <button className="violet" onClick={validate}>Valider les données</button>
      <button className="green" onClick={download}>Télécharger le suivi</button>
      {message && <p className="statusBox" role="status">{message}</p>}
      <p className="yellow">Limite actuelle : les données sont locales à ce navigateur. Une base de données et un identifiant élève seront nécessaires pour un suivi multiappareil ou par groupe.</p>
    </div>
  );
}
