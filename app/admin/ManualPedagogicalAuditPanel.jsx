"use client";

import { useEffect, useMemo, useState } from "react";
import { auditExerciseContent } from "../../lib/contentCalibration";
import { normalizeQuestionLevel } from "../../lib/questionClassification";
import {
  MANUAL_AUDIT_CRITERIA,
  MANUAL_AUDIT_STATUSES,
  MANUAL_CRITERION_VALUES,
  MANUAL_PEDAGOGICAL_AUDIT_KEY,
  buildManualAuditExport,
  criterionCounts,
  manualAuditWarnings,
  normalizeManualAuditStore,
  summarizeManualAudits
} from "../../lib/manualPedagogicalAudit";
import { useExerciseBank } from "../useExerciseBank";

function loadStore(exercises) {
  if (typeof window === "undefined") return normalizeManualAuditStore(null, exercises);
  try {
    return normalizeManualAuditStore(JSON.parse(localStorage.getItem(MANUAL_PEDAGOGICAL_AUDIT_KEY) || "null"), exercises);
  } catch {
    return normalizeManualAuditStore(null, exercises);
  }
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function automaticSnapshot(audit) {
  return {
    status: audit.status,
    levelId: audit.levelId,
    wordCount: audit.wordCount,
    paragraphCount: audit.paragraphCount,
    questionCount: audit.questionCount,
    dimensions: audit.dimensions,
    ratios: audit.ratios,
    errors: audit.errors,
    warnings: audit.warnings
  };
}

export default function ManualPedagogicalAuditPanel() {
  const { exercises } = useExerciseBank({ includeDrafts: true });
  const [store, setStore] = useState(() => normalizeManualAuditStore(null, []));
  const [selectedId, setSelectedId] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("Chargement du suivi local...");
  const [hydrated, setHydrated] = useState(false);

  const automaticAudits = useMemo(
    () => Object.fromEntries(exercises.map((exercise) => [exercise.id, automaticSnapshot(auditExerciseContent(exercise))])),
    [exercises]
  );

  useEffect(() => {
    const loaded = loadStore(exercises);
    setStore(loaded);
    setSelectedId((current) => loaded.audits[current] ? current : exercises[0]?.id || "");
    setHydrated(true);
    setMessage("Audit manuel chargé depuis ce navigateur.");
  }, [exercises]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    localStorage.setItem(MANUAL_PEDAGOGICAL_AUDIT_KEY, JSON.stringify(store));
  }, [hydrated, store]);

  const summary = useMemo(() => summarizeManualAudits(store, exercises), [store, exercises]);
  const filteredExercises = exercises.filter((exercise) => {
    const levelMatches = levelFilter === "all" || normalizeQuestionLevel(exercise.level) === levelFilter;
    const statusMatches = statusFilter === "all" || store.audits[exercise.id]?.status === statusFilter;
    return levelMatches && statusMatches;
  });
  const selectedExercise = exercises.find((exercise) => exercise.id === selectedId) || filteredExercises[0] || exercises[0];
  const selectedEntry = selectedExercise ? store.audits[selectedExercise.id] : null;
  const selectedAutomatic = selectedExercise ? automaticAudits[selectedExercise.id] : null;
  const counts = selectedEntry ? criterionCounts(selectedEntry) : { total: 0, pending: 0, pass: 0, review: 0 };
  const warnings = selectedEntry ? manualAuditWarnings(selectedEntry) : [];

  useEffect(() => {
    if (!filteredExercises.some((exercise) => exercise.id === selectedId) && filteredExercises[0]) {
      setSelectedId(filteredExercises[0].id);
    }
  }, [levelFilter, statusFilter, exercises, store]);

  function updateEntry(updater, confirmation = "Modification enregistrée localement.") {
    if (!selectedExercise) return;
    setStore((current) => {
      const oldEntry = current.audits[selectedExercise.id];
      const nextEntry = updater(oldEntry);
      return {
        ...current,
        audits: {
          ...current.audits,
          [selectedExercise.id]: {
            ...nextEntry,
            updatedAt: new Date().toISOString()
          }
        }
      };
    });
    setMessage(confirmation);
  }

  function updateCriterion(groupId, criterionId, value) {
    updateEntry((entry) => ({
      ...entry,
      criteria: {
        ...entry.criteria,
        [groupId]: {
          ...entry.criteria[groupId],
          [criterionId]: value
        }
      }
    }));
  }

  function resetCurrent() {
    if (!selectedExercise || !window.confirm(`Réinitialiser l’audit manuel de « ${selectedExercise.title} »?`)) return;
    const empty = normalizeManualAuditStore(null, [selectedExercise]).audits[selectedExercise.id];
    updateEntry(() => empty, "Audit manuel du texte réinitialisé.");
  }

  function exportAll() {
    downloadJson(
      `audit-pedagogique-manuel-${new Date().toISOString().slice(0, 10)}.json`,
      buildManualAuditExport(store, exercises, automaticAudits)
    );
    setMessage("Export JSON complet créé.");
  }

  function exportCurrent() {
    if (!selectedExercise) return;
    downloadJson(
      `audit-manuel-${selectedExercise.id}.json`,
      buildManualAuditExport(store, [selectedExercise], automaticAudits)
    );
    setMessage(`Export JSON créé pour « ${selectedExercise.title} ».`);
  }

  return (
    <section className="card manualPedagogicalAudit" aria-label="Audit pédagogique manuel">
      <div className="manualAuditHeader">
        <div>
          <p className="eyebrow">Validation humaine</p>
          <h2>Audit pédagogique manuel</h2>
          <p>Cette grille complète l’audit automatique. Les exercices locaux enregistrés dans le bloc 10 sont ajoutés automatiquement.</p>
        </div>
        <span className="badge">{summary.completionRate}% évalué</span>
      </div>

      <div className="manualAuditStats">
        <div><b>{summary.totalExercises}</b><span>textes</span></div>
        <div><b>{summary.statuses.pending}</b><span>à valider</span></div>
        <div><b>{summary.statuses.ready}</b><span>prêts</span></div>
        <div><b>{summary.statuses.review}</b><span>à revoir</span></div>
        <div><b>{summary.statuses.blocked}</b><span>bloqués</span></div>
      </div>

      <div className="manualAuditToolbar">
        <label>Niveau
          <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
            <option value="all">Tous les niveaux</option>
            <option value="6e">6e année</option>
            <option value="sec1">Secondaire 1</option>
            <option value="sec2">Secondaire 2</option>
          </select>
        </label>
        <label>Statut manuel
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Tous les statuts</option>
            {Object.entries(MANUAL_AUDIT_STATUSES).map(([id, label]) => <option value={id} key={id}>{label}</option>)}
          </select>
        </label>
        <label className="manualAuditExerciseSelect">Texte
          <select value={selectedExercise?.id || ""} onChange={(event) => setSelectedId(event.target.value)}>
            {filteredExercises.map((exercise) => (
              <option value={exercise.id} key={exercise.id}>{exercise.level} — {exercise.title}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={exportAll}>Exporter tous les audits JSON</button>
      </div>

      {!selectedExercise || !selectedEntry || !selectedAutomatic ? (
        <p className="yellow">Aucun texte ne correspond aux filtres choisis.</p>
      ) : (
        <>
          <div className="manualAuditContextGrid">
            <div className="card">
              <h3>{selectedExercise.title}</h3>
              <p><b>{selectedExercise.level}</b> — {selectedExercise.textType} — {selectedExercise.category}</p>
              <p><b>Intention :</b> {selectedExercise.intention}</p>
              <p><b>Questions :</b> {selectedExercise.questions.length}</p>
            </div>
            <div className="card automaticAuditSnapshot">
              <h3>Audit automatique — lecture seule</h3>
              <p><b>Statut :</b> {selectedAutomatic.status}</p>
              <p>{selectedAutomatic.wordCount} mots · {selectedAutomatic.paragraphCount} paragraphes · {selectedAutomatic.questionCount} questions</p>
              <p><b>Erreurs :</b> {selectedAutomatic.errors.length} · <b>Avertissements :</b> {selectedAutomatic.warnings.length}</p>
              <small>Les choix manuels ci-dessous n’altèrent jamais ce résultat automatique.</small>
            </div>
          </div>

          <div className="manualAuditProgress" aria-label="Avancement de l’audit sélectionné">
            <span>{counts.pass} conformes</span><span>{counts.review} à revoir</span><span>{counts.pending} non évalués</span>
          </div>

          {Object.entries(MANUAL_AUDIT_CRITERIA).map(([groupId, group]) => (
            <fieldset className="manualAuditGroup" key={groupId}>
              <legend>{group.label}</legend>
              {Object.entries(group.items).map(([criterionId, label]) => (
                <div className="manualAuditRow" key={criterionId}>
                  <label htmlFor={`${selectedExercise.id}-${groupId}-${criterionId}`}>{label}</label>
                  <select id={`${selectedExercise.id}-${groupId}-${criterionId}`} value={selectedEntry.criteria[groupId][criterionId]} onChange={(event) => updateCriterion(groupId, criterionId, event.target.value)}>
                    {Object.entries(MANUAL_CRITERION_VALUES).map(([id, valueLabel]) => <option value={id} key={id}>{valueLabel}</option>)}
                  </select>
                </div>
              ))}
            </fieldset>
          ))}

          <div className="manualAuditDecision card">
            <label>Statut manuel du texte
              <select value={selectedEntry.status} onChange={(event) => updateEntry((entry) => ({ ...entry, status: event.target.value }))}>
                {Object.entries(MANUAL_AUDIT_STATUSES).map(([id, label]) => <option value={id} key={id}>{label}</option>)}
              </select>
            </label>
            <label>Validateur ou initiales — facultatif
              <input value={selectedEntry.reviewer} maxLength={120} onChange={(event) => updateEntry((entry) => ({ ...entry, reviewer: event.target.value }))} placeholder="Ex. MP" />
            </label>
            <label className="manualAuditNotes">Notes de validation
              <textarea value={selectedEntry.notes} maxLength={4000} onChange={(event) => updateEntry((entry) => ({ ...entry, notes: event.target.value }))} placeholder="Forces, éléments à corriger, vérifications factuelles à compléter..." />
            </label>
            {selectedEntry.updatedAt && <p className="smallText">Dernière modification : {new Date(selectedEntry.updatedAt).toLocaleString("fr-CA")}</p>}
            {warnings.map((warning) => <p className="yellow" key={warning}><b>Attention :</b> {warning}</p>)}
            <div className="manualAuditActions">
              <button type="button" onClick={exportCurrent}>Exporter ce texte</button>
              <button type="button" onClick={resetCurrent}>Réinitialiser ce texte</button>
            </div>
          </div>
        </>
      )}

      <p className="green"><b>{message}</b> Aucun compte, serveur ou base de données n’est utilisé.</p>
    </section>
  );
}
