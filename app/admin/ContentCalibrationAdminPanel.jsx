"use client";

import { useMemo, useState } from "react";
import baseExercises from "../data/exercises";
import moreExercises from "../data/moreExercises";
import genesisExercise from "../data/genesisExercise";
import {
  CONTENT_LEVEL_PROFILES,
  CONTENT_TEXT_TYPES,
  summarizeContentBank,
  validateContentBank
} from "../../lib/contentCalibration";
import { QUESTION_DIMENSIONS, normalizeExerciseQuestions } from "../../lib/questionClassification";

const exercises = [...baseExercises, ...moreExercises, genesisExercise].map(normalizeExerciseQuestions);

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function statusLabel(status) {
  if (status === "ready") return "Prêt";
  if (status === "review") return "À revoir";
  return "Bloqué";
}

export default function ContentCalibrationAdminPanel() {
  const [levelFilter, setLevelFilter] = useState("all");
  const [message, setMessage] = useState("");
  const summary = useMemo(() => summarizeContentBank(exercises), []);
  const rows = levelFilter === "all"
    ? summary.audits
    : summary.audits.filter((audit) => audit.levelId === levelFilter);

  function validate() {
    const result = validateContentBank(exercises);
    setMessage(result.valid ? `Validation réussie — ${result.message}` : `Validation à corriger — ${result.message}`);
  }

  return (
    <section className="card contentCalibrationAdmin" aria-label="Audit de la banque de contenus">
      <div className="contentCalibrationHeader">
        <div>
          <p className="eyebrow">Bloc 8</p>
          <h2>Banque de textes calibrée</h2>
          <p>Couverture par niveau, type de texte, longueur et dimensions de lecture.</p>
        </div>
        <span className={`badge ${summary.errors.length ? "errorBox" : "successBox"}`}>
          {summary.errors.length ? `${summary.errors.length} erreur(s)` : "Aucune erreur bloquante"}
        </span>
      </div>

      <div className="contentCalibrationStats">
        <div><b>{summary.totalTexts}</b><span>textes</span></div>
        <div><b>{summary.totalQuestions}</b><span>questions</span></div>
        <div><b>{summary.readyTexts}</b><span>prêts</span></div>
        <div><b>{summary.textsToReview}</b><span>à revoir</span></div>
        <div><b>{summary.blockedTexts}</b><span>bloqués</span></div>
      </div>

      <div className="contentCalibrationGrid">
        <div>
          <h3>Couverture par niveau</h3>
          {Object.entries(CONTENT_LEVEL_PROFILES).map(([levelId, profile]) => (
            <div className="calibrationLevelCard" key={levelId}>
              <p><b>{profile.label}</b> — {summary.byLevel[levelId]} texte(s)</p>
              <p className="smallText">Cible de longueur : {profile.wordRange[0]} à {profile.wordRange[1]} mots</p>
              <p className="smallText">{profile.expectedFeatures.join(" · ")}</p>
            </div>
          ))}
        </div>

        <div>
          <h3>Types de texte</h3>
          {Object.entries(CONTENT_TEXT_TYPES).map(([type, label]) => (
            <p key={type}><b>{label} :</b> {summary.byTextType[type]}</p>
          ))}
        </div>

        <div>
          <h3>Dimensions de questions</h3>
          {Object.entries(QUESTION_DIMENSIONS).map(([dimension, value]) => (
            <p key={dimension}><b>{value.label} :</b> {summary.dimensionTotals[dimension]}</p>
          ))}
        </div>
      </div>

      {summary.coverageGaps.length > 0 && (
        <div className="statusBox warningBox">
          <h3>Lacunes de couverture</h3>
          {summary.coverageGaps.map((gap) => <p key={gap}>• {gap}</p>)}
        </div>
      )}

      <div className="contentCalibrationActions">
        <label htmlFor="contentLevelFilter"><b>Afficher le niveau</b></label>
        <select id="contentLevelFilter" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
          <option value="all">Tous les niveaux</option>
          {Object.entries(CONTENT_LEVEL_PROFILES).map(([levelId, profile]) => <option key={levelId} value={levelId}>{profile.label}</option>)}
        </select>
        <button type="button" className="violet" onClick={validate}>Valider la banque</button>
        <button type="button" className="green" onClick={() => downloadJson("audit-banque-contenus.json", summary)}>Télécharger l’audit</button>
      </div>
      {message && <p className="statusBox" role="status">{message}</p>}

      <div className="contentCalibrationTableWrap">
        <table className="contentCalibrationTable">
          <thead>
            <tr>
              <th>Texte</th>
              <th>Niveau</th>
              <th>Type</th>
              <th>Mots</th>
              <th>Questions</th>
              <th>Comprendre</th>
              <th>Inférer + interpréter</th>
              <th>Réagir + apprécier</th>
              <th>État</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((audit) => (
              <tr key={audit.id}>
                <td><b>{audit.title}</b>{audit.warnings.length > 0 && <small>{audit.warnings[0]}</small>}</td>
                <td>{audit.levelLabel}</td>
                <td>{audit.textTypeLabel}</td>
                <td>{audit.wordCount}</td>
                <td>{audit.questionCount}</td>
                <td>{audit.ratios.comprehension} %</td>
                <td>{audit.ratios.inferenceInterpretation} %</td>
                <td>{audit.ratios.reactionAppreciation} %</td>
                <td><span className={`calibrationStatus calibrationStatus-${audit.status}`}>{statusLabel(audit.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="yellow"><b>Interprétation prudente :</b> les seuils servent à repérer les déséquilibres. Un avertissement ne remplace pas une révision pédagogique humaine du texte et des questions.</p>
    </section>
  );
}
