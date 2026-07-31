"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { auditExerciseContent } from "../../lib/contentCalibration";
import {
  MANUAL_PEDAGOGICAL_AUDIT_KEY,
  normalizeManualAuditStore
} from "../../lib/manualPedagogicalAudit";
import {
  QUESTION_DIMENSIONS,
  QUESTION_TYPES,
  normalizeExerciseQuestions,
  normalizeQuestionLevel
} from "../../lib/questionClassification";
import {
  PUBLICATION_REVIEW_CONFIRMATION,
  buildPublicationReadiness
} from "../../lib/publicationReadiness";
import {
  LOCAL_EXERCISE_STATUSES,
  buildLocalExerciseExport,
  createExerciseTemplate,
  createQuestionTemplate,
  duplicateLocalExercise,
  importExercisesIntoStore,
  parseExerciseImport,
  removeLocalExercise,
  sanitizeWorkshopExercise,
  upsertLocalExercise,
  validateWorkshopExercise
} from "../../lib/localExerciseWorkshop";
import { saveLocalExerciseStore, useExerciseBank } from "../useExerciseBank";

const MANUAL_AUDIT_CHANGE_EVENT = "lecture-manual-pedagogical-audit-changed";

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function levelLabel(levelId) {
  if (levelId === "sec2") return "Secondaire 2";
  if (levelId === "sec1") return "Secondaire 1";
  return "6e année";
}

function compactAudit(audit) {
  return {
    status: audit.status,
    wordCount: audit.wordCount,
    paragraphCount: audit.paragraphCount,
    questionCount: audit.questionCount,
    dimensions: audit.dimensions,
    errors: audit.errors,
    warnings: audit.warnings
  };
}

function loadManualAuditStore(exercise) {
  if (typeof window === "undefined") return normalizeManualAuditStore(null, [exercise]);
  try {
    const raw = JSON.parse(localStorage.getItem(MANUAL_PEDAGOGICAL_AUDIT_KEY) || "null");
    return normalizeManualAuditStore(raw, [exercise]);
  } catch {
    return normalizeManualAuditStore(null, [exercise]);
  }
}

function checklistSymbol(state) {
  if (state === "pass") return "✓";
  if (state === "warning") return "!";
  return "×";
}

export default function LocalExerciseWorkshopPanel() {
  const { store, setStore } = useExerciseBank({ includeDrafts: true });
  const localEntries = store.entries || [];
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState(() => createExerciseTemplate("6e"));
  const [message, setMessage] = useState("Atelier local prêt.");
  const [previewMode, setPreviewMode] = useState("training");
  const [importText, setImportText] = useState("");
  const [manualAuditStore, setManualAuditStore] = useState(() => normalizeManualAuditStore(null, []));
  const [finalPreviewOpen, setFinalPreviewOpen] = useState(false);
  const [finalPreviewReviewed, setFinalPreviewReviewed] = useState(false);
  const [reviewerConfirmed, setReviewerConfirmed] = useState(false);
  const fileInputRef = useRef(null);

  const selectedEntry = localEntries.find((entry) => entry.exercise.id === selectedId) || null;
  const normalizedDraft = useMemo(() => sanitizeWorkshopExercise(draft), [draft]);
  const validation = useMemo(
    () => validateWorkshopExercise(draft, localEntries.map((entry) => entry.exercise.id)),
    [draft, localEntries]
  );
  const automaticAudit = validation.automaticAudit || auditExerciseContent(normalizedDraft);
  const manualAuditEntry = manualAuditStore.audits?.[normalizedDraft.id] || null;
  const readiness = useMemo(
    () => buildPublicationReadiness(draft, manualAuditEntry, { finalPreviewReviewed, reviewerConfirmed }),
    [draft, manualAuditEntry, finalPreviewReviewed, reviewerConfirmed]
  );

  const readinessFingerprint = useMemo(() => JSON.stringify({
    exercise: draft,
    manualAudit: manualAuditEntry
  }), [draft, manualAuditEntry]);

  useEffect(() => {
    if (!selectedId && localEntries[0]) {
      setSelectedId(localEntries[0].exercise.id);
      setDraft(localEntries[0].exercise);
    }
  }, [localEntries.length]);

  useEffect(() => {
    setManualAuditStore(loadManualAuditStore(normalizedDraft));

    function reloadManualAudit(event) {
      if (event?.detail?.store) {
        setManualAuditStore(normalizeManualAuditStore(event.detail.store, [normalizedDraft]));
      } else {
        setManualAuditStore(loadManualAuditStore(normalizedDraft));
      }
    }

    function handleStorage(event) {
      if (!event || event.key === MANUAL_PEDAGOGICAL_AUDIT_KEY) reloadManualAudit();
    }

    window.addEventListener(MANUAL_AUDIT_CHANGE_EVENT, reloadManualAudit);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(MANUAL_AUDIT_CHANGE_EVENT, reloadManualAudit);
      window.removeEventListener("storage", handleStorage);
    };
  }, [normalizedDraft.id]);

  useEffect(() => {
    setFinalPreviewOpen(false);
    setFinalPreviewReviewed(false);
    setReviewerConfirmed(false);
  }, [readinessFingerprint]);

  function persist(nextStore, confirmation) {
    saveLocalExerciseStore(nextStore);
    setStore(nextStore);
    setMessage(confirmation);
  }

  function selectEntry(id) {
    const entry = localEntries.find((item) => item.exercise.id === id);
    setSelectedId(id);
    if (entry) setDraft(entry.exercise);
    setMessage(entry ? `${LOCAL_EXERCISE_STATUSES[entry.status]} chargé.` : "Exercice chargé.");
  }

  function newExercise() {
    const exercise = createExerciseTemplate("6e");
    setSelectedId("");
    setDraft(exercise);
    setMessage("Nouveau brouillon non enregistré.");
  }

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function changeLevel(levelId) {
    const label = levelLabel(levelId);
    setDraft((current) => normalizeExerciseQuestions({
      ...current,
      level: label,
      calibration: { ...current.calibration, targetLevel: levelId },
      questions: current.questions.map((question) => ({ ...question, targetLevel: levelId }))
    }));
  }

  function updateCalibration(field, value) {
    setDraft((current) => ({
      ...current,
      calibration: { ...current.calibration, [field]: value }
    }));
  }

  function updateQuestion(index, field, value) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) => questionIndex === index
        ? { ...question, [field]: value }
        : question)
    }));
  }

  function classifyQuestionAt(index) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) => questionIndex === index
        ? normalizeExerciseQuestions({ ...current, questions: [question] }).questions[0]
        : question)
    }));
    setMessage(`Question ${index + 1} classifiée automatiquement. Les champs restent modifiables.`);
  }

  function classifyAll() {
    setDraft((current) => normalizeExerciseQuestions(current));
    setMessage("Toutes les questions ont été classifiées automatiquement.");
  }

  function addQuestion() {
    const levelId = normalizeQuestionLevel(draft.level);
    setDraft((current) => ({
      ...current,
      questions: [...current.questions, createQuestionTemplate(current.questions.length, levelId)]
    }));
  }

  function duplicateQuestion(index) {
    setDraft((current) => {
      const source = current.questions[index];
      const copy = {
        ...source,
        id: `${source.id || `question-${index + 1}`}-copie-${Date.now().toString(36)}`,
        prompt: `${source.prompt || "Question"} — copie`
      };
      const questions = [...current.questions];
      questions.splice(index + 1, 0, copy);
      return { ...current, questions };
    });
  }

  function removeQuestion(index) {
    if (draft.questions.length === 1) {
      setMessage("Un exercice doit conserver au moins une question.");
      return;
    }
    setDraft((current) => ({
      ...current,
      questions: current.questions.filter((_, questionIndex) => questionIndex !== index)
    }));
  }

  function save(status = selectedEntry?.status || "draft") {
    const result = validateWorkshopExercise(draft, localEntries.map((entry) => entry.exercise.id));
    if (status === "published") {
      if (!readiness.canPublish) {
        setMessage(`Publication bloquée — ${readiness.blockers.join(" · ")}`);
        return;
      }
      if (!result.valid) {
        setMessage(`Publication bloquée — ${result.errors.join(" · ")}`);
        return;
      }
      if (readiness.warnings.length > 0 && !window.confirm(`Publier malgré ${readiness.warnings.length} avertissement(s) pédagogique(s)?`)) {
        setMessage("Publication annulée pour permettre une nouvelle révision.");
        return;
      }
    }

    let nextStore = store;
    if (selectedId && selectedId !== result.exercise.id) nextStore = removeLocalExercise(nextStore, selectedId);
    nextStore = upsertLocalExercise(nextStore, result.exercise, status);
    setSelectedId(result.exercise.id);
    setDraft(result.exercise);
    persist(nextStore, status === "published"
      ? `Exercice publié localement. ${PUBLICATION_REVIEW_CONFIRMATION}`
      : "Brouillon enregistré localement.");
  }

  function duplicateCurrent() {
    if (!selectedId) {
      setMessage("Enregistre d’abord le brouillon avant de le dupliquer.");
      return;
    }
    const next = duplicateLocalExercise(store, selectedId);
    const id = next.selectedId;
    persist(next, "Copie créée comme brouillon.");
    setSelectedId(id);
    setDraft(next.entries.find((entry) => entry.exercise.id === id)?.exercise || draft);
  }

  function deleteCurrent() {
    if (!selectedId || !window.confirm(`Supprimer le brouillon local « ${draft.title} »?`)) return;
    const next = removeLocalExercise(store, selectedId);
    persist(next, "Exercice local supprimé.");
    const nextEntry = next.entries[0];
    setSelectedId(nextEntry?.exercise.id || "");
    setDraft(nextEntry?.exercise || createExerciseTemplate("6e"));
  }

  function exportCurrent() {
    downloadJson(`${normalizedDraft.id}.json`, normalizedDraft);
    setMessage("Exercice courant exporté en JSON.");
  }

  function exportBank() {
    downloadJson(
      `banque-exercices-locale-${new Date().toISOString().slice(0, 10)}.json`,
      buildLocalExerciseExport(store)
    );
    setMessage("Banque locale complète exportée.");
  }

  function importJson(value) {
    const parsed = parseExerciseImport(value);
    if (!parsed.valid) {
      setMessage(parsed.errors.join(" · "));
      return;
    }
    const result = importExercisesIntoStore(store, parsed.exercises);
    persist(result.store, result.messages.join(" "));
    const id = result.store.selectedId;
    setSelectedId(id);
    setDraft(result.store.entries.find((entry) => entry.exercise.id === id)?.exercise || draft);
    setImportText("");
  }

  async function importFile(file) {
    if (!file) return;
    try {
      importJson(await file.text());
    } catch (error) {
      setMessage(`Import impossible : ${error.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <section className="card localExerciseWorkshop" aria-label="Création et édition locale d’exercices">
      <div className="localWorkshopHeader">
        <div>
          <p className="eyebrow">Blocs 10 et 11</p>
          <h2>Création, importation, édition et publication locale d’exercices</h2>
          <p>Les brouillons et publications restent dans ce navigateur. Aucun serveur ni base de données n’est utilisé.</p>
        </div>
        <span className="badge">{localEntries.length} exercice(s) local(aux)</span>
      </div>

      <div className="localWorkshopToolbar">
        <label>
          Exercice local
          <select value={selectedId} onChange={(event) => selectEntry(event.target.value)}>
            <option value="">Nouveau brouillon non enregistré</option>
            {localEntries.map((entry) => (
              <option value={entry.exercise.id} key={entry.exercise.id}>
                {LOCAL_EXERCISE_STATUSES[entry.status]} — {entry.exercise.level} — {entry.exercise.title}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={newExercise}>Nouvel exercice</button>
        <button type="button" onClick={duplicateCurrent}>Dupliquer</button>
        <button type="button" onClick={deleteCurrent}>Supprimer</button>
        <button type="button" onClick={exportBank}>Exporter la banque locale</button>
      </div>

      <div className="localWorkshopGrid">
        <div className="localWorkshopEditor">
          <fieldset className="localWorkshopGroup">
            <legend>1. Texte et métadonnées</legend>
            <div className="localWorkshopFields twoColumns">
              <label>Titre<input value={draft.title || ""} onChange={(event) => updateField("title", event.target.value)} /></label>
              <label>Identifiant<input value={draft.id || ""} onChange={(event) => updateField("id", event.target.value)} /></label>
              <label>Niveau
                <select value={normalizeQuestionLevel(draft.level)} onChange={(event) => changeLevel(event.target.value)}>
                  <option value="6e">6e année</option>
                  <option value="sec1">Secondaire 1</option>
                  <option value="sec2">Secondaire 2</option>
                </select>
              </label>
              <label>Type de texte<input value={draft.textType || ""} onChange={(event) => updateField("textType", event.target.value)} /></label>
              <label>Catégorie<input value={draft.category || ""} onChange={(event) => updateField("category", event.target.value)} /></label>
              <label>Temps de lecture estimé
                <input type="number" min="1" max="60" value={draft.calibration?.intendedReadingMinutes || 5} onChange={(event) => updateCalibration("intendedReadingMinutes", Number(event.target.value))} />
              </label>
            </div>
            <label>Intention de lecture<textarea value={draft.intention || ""} onChange={(event) => updateField("intention", event.target.value)} /></label>
            <label>Description<textarea value={draft.description || ""} onChange={(event) => updateField("description", event.target.value)} /></label>
            <label>Texte complet<textarea className="localWorkshopText" value={draft.text || ""} onChange={(event) => updateField("text", event.target.value)} /></label>
          </fieldset>

          <fieldset className="localWorkshopGroup">
            <legend>2. Questions et classification</legend>
            <div className="localWorkshopActions">
              <button type="button" onClick={classifyAll}>Classifier toutes les questions</button>
              <button type="button" onClick={addQuestion}>Ajouter une question</button>
            </div>
            {draft.questions.map((question, index) => (
              <article className="card localQuestionEditor" key={`${question.id}-${index}`}>
                <div className="localQuestionHeader">
                  <h3>Question {index + 1}</h3>
                  <div>
                    <button type="button" onClick={() => classifyQuestionAt(index)}>Classifier</button>
                    <button type="button" onClick={() => duplicateQuestion(index)}>Dupliquer</button>
                    <button type="button" onClick={() => removeQuestion(index)}>Retirer</button>
                  </div>
                </div>
                <div className="localWorkshopFields twoColumns">
                  <label>Identifiant<input value={question.id || ""} onChange={(event) => updateQuestion(index, "id", event.target.value)} /></label>
                  <label>Points<input type="number" min="1" max="10" value={question.points || 1} onChange={(event) => updateQuestion(index, "points", Number(event.target.value))} /></label>
                </div>
                <label>Formulation<textarea value={question.prompt || ""} onChange={(event) => updateQuestion(index, "prompt", event.target.value)} /></label>
                <div className="localWorkshopFields threeColumns">
                  <label>Dimension
                    <select value={question.dimension || ""} onChange={(event) => updateQuestion(index, "dimension", event.target.value)}>
                      <option value="">Choisir une dimension</option>
                      {Object.entries(QUESTION_DIMENSIONS).map(([id, definition]) => <option value={id} key={id}>{definition.label}</option>)}
                    </select>
                  </label>
                  <label>Type de réponse
                    <select value={question.questionType || "explicite"} onChange={(event) => updateQuestion(index, "questionType", event.target.value)}>
                      {Object.entries(QUESTION_TYPES).map(([id, label]) => <option value={id} key={id}>{label}</option>)}
                    </select>
                  </label>
                  <label>Nombre minimal d’éléments
                    <input type="number" min="1" max="8" value={question.minimumExpectedElements || 1} onChange={(event) => updateQuestion(index, "minimumExpectedElements", Number(event.target.value))} />
                  </label>
                </div>
                <div className="localWorkshopChecks">
                  <label><input type="checkbox" checked={Boolean(question.proofRequired)} onChange={(event) => updateQuestion(index, "proofRequired", event.target.checked)} /> Preuve obligatoire</label>
                  <label><input type="checkbox" checked={Boolean(question.justificationRequired)} onChange={(event) => updateQuestion(index, "justificationRequired", event.target.checked)} /> Justification obligatoire</label>
                  <label><input type="checkbox" checked={Boolean(question.isPersonalAnswer)} onChange={(event) => updateQuestion(index, "isPersonalAnswer", event.target.checked)} /> Réponse personnelle</label>
                </div>
                <label>Réponse attendue — réservée à l’administrateur<textarea value={question.expectedAnswer || ""} onChange={(event) => updateQuestion(index, "expectedAnswer", event.target.value)} /></label>
                <p className="smallText"><b>Mot-question :</b> {question.questionWord || "quoi"} · <b>Outil :</b> {question.recommendedProofTool || "explicite"}</p>
              </article>
            ))}
          </fieldset>

          <fieldset className="localWorkshopGroup">
            <legend>3. Import et export JSON</legend>
            <textarea className="adminJson" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Colle ici un exercice JSON, une liste d’exercices ou un export de banque locale." />
            <div className="localWorkshopActions">
              <button type="button" onClick={() => importJson(importText)}>Importer le JSON collé</button>
              <button type="button" onClick={() => fileInputRef.current?.click()}>Choisir un fichier JSON</button>
              <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={(event) => importFile(event.target.files?.[0])} />
              <button type="button" onClick={exportCurrent}>Exporter cet exercice</button>
            </div>
          </fieldset>
        </div>

        <aside className="localWorkshopReview">
          <section className="card">
            <h3>Audit automatique</h3>
            <p><b>Statut :</b> {automaticAudit.status}</p>
            <p>{automaticAudit.wordCount} mots · {automaticAudit.paragraphCount} paragraphes · {automaticAudit.questionCount} questions</p>
            <p><b>Erreurs :</b> {validation.errors.length} · <b>Avertissements :</b> {validation.warnings.length}</p>
            {validation.errors.map((item) => <p className="errorBox" key={item}>{item}</p>)}
            {validation.warnings.map((item) => <p className="yellow" key={item}>{item}</p>)}
            <details>
              <summary>Voir le résumé JSON de l’audit</summary>
              <pre>{JSON.stringify(compactAudit(automaticAudit), null, 2)}</pre>
            </details>
          </section>

          <section className="card">
            <h3>Aperçu élève rapide</h3>
            <div className="localPreviewTabs">
              <button type="button" className={previewMode === "training" ? "blue" : ""} onClick={() => setPreviewMode("training")}>Entraînement</button>
              <button type="button" className={previewMode === "simulation" ? "violet" : ""} onClick={() => setPreviewMode("simulation")}>Simulation</button>
            </div>
            <div className={`localStudentPreview ${previewMode}`}>
              <p className="eyebrow">{levelLabel(normalizeQuestionLevel(draft.level))} — {previewMode === "training" ? "Entraînement" : "Simulation"}</p>
              <h3>{draft.title || "Sans titre"}</h3>
              <p><b>Intention :</b> {draft.intention}</p>
              <div className="localPreviewText">{String(draft.text || "Aucun texte saisi.").split("\n").filter(Boolean).slice(0, 4).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
              {(draft.questions || []).slice(0, 3).map((question, index) => (
                <div className="localPreviewQuestion" key={question.id || index}>
                  <b>Question {index + 1}</b>
                  <p>{question.prompt || "Question à rédiger"}</p>
                  {previewMode === "training" ? (
                    <small>{QUESTION_DIMENSIONS[question.dimension]?.label || "Dimension manquante"} · {question.validationProfile?.shortInstruction || "Répondre avec un appui du texte."}</small>
                  ) : (
                    <small>Réponds de façon autonome. Aucune aide de contenu n’est affichée.</small>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h3>Audit pédagogique manuel</h3>
            <p><b>Statut :</b> {readiness.manualAudit.status}</p>
            <p>{readiness.manualCounts.pass} conformes · {readiness.manualCounts.review} à revoir · {readiness.manualCounts.pending} non évalués</p>
            <p>La preuve disponible dans le texte est actuellement : <b>{readiness.manualAudit.criteria?.questions?.proofAvailable || "pending"}</b>.</p>
          </section>

          <section className="card publicationReadinessBox">
            <h3>Checklist de publication</h3>
            <p><b>{readiness.canPublish ? "Prêt à publier" : `${readiness.blockers.length} blocage(s)`}</b> · {readiness.warnings.length} avertissement(s)</p>
            <div className="publicationChecklist">
              {readiness.checklist.map((item) => (
                <div className={`publicationChecklistItem ${item.state}`} key={item.id}>
                  <span aria-hidden="true">{checklistSymbol(item.state)}</span>
                  <p>{item.label}</p>
                </div>
              ))}
            </div>
            {readiness.blockers.map((item) => <p className="errorBox" key={item}>{item}</p>)}
            {readiness.warnings.map((item) => <p className="yellow" key={item}>{item}</p>)}
          </section>

          <section className="card finalPublicationPreview">
            <h3>Aperçu final obligatoire</h3>
            <button type="button" className="violet" onClick={() => setFinalPreviewOpen((current) => !current)}>
              {finalPreviewOpen ? "Fermer l’aperçu final" : "Ouvrir l’aperçu final complet"}
            </button>
            {finalPreviewOpen && (
              <div className="finalPreviewContent">
                <p className="eyebrow">{levelLabel(normalizeQuestionLevel(draft.level))} — {draft.textType || "type manquant"}</p>
                <h3>{draft.title || "Sans titre"}</h3>
                <p><b>Intention :</b> {draft.intention || "Intention manquante"}</p>
                <div className="finalPreviewFullText">
                  {String(draft.text || "Aucun texte saisi.").split("\n").filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                </div>
                <h4>Questions — entraînement</h4>
                {(draft.questions || []).map((question, index) => (
                  <div className="localPreviewQuestion" key={`training-${question.id || index}`}>
                    <b>Question {index + 1} — {QUESTION_DIMENSIONS[question.dimension]?.label || "Dimension manquante"}</b>
                    <p>{question.prompt || "Question à rédiger"}</p>
                    <small>{question.validationProfile?.shortInstruction || "Appui du texte requis selon la classification."}</small>
                  </div>
                ))}
                <h4>Questions — simulation</h4>
                {(draft.questions || []).map((question, index) => (
                  <div className="localPreviewQuestion" key={`simulation-${question.id || index}`}>
                    <b>Question {index + 1}</b>
                    <p>{question.prompt || "Question à rédiger"}</p>
                    <small>Répondre de façon autonome; aucune aide de contenu.</small>
                  </div>
                ))}
              </div>
            )}
            <label className="publicationConfirmation">
              <input type="checkbox" checked={finalPreviewReviewed} disabled={!finalPreviewOpen} onChange={(event) => setFinalPreviewReviewed(event.target.checked)} />
              J’ai vérifié l’aperçu final complet.
            </label>
            <label className="publicationConfirmation explicitConfirmation">
              <input type="checkbox" checked={reviewerConfirmed} onChange={(event) => setReviewerConfirmed(event.target.checked)} />
              {PUBLICATION_REVIEW_CONFIRMATION}
            </label>
            <p className="smallText">Toute modification du texte, des questions ou de l’audit manuel annule ces confirmations.</p>
          </section>

          <section className="card localPublicationBox">
            <h3>Enregistrement local</h3>
            <p><b>{validation.message}</b></p>
            <button type="button" className="blue" onClick={() => save("draft")}>Enregistrer comme brouillon</button>
            <button type="button" className="green" disabled={!readiness.canPublish || !validation.valid} onClick={() => save("published")}>Publier dans le parcours élève</button>
            {selectedEntry?.status === "published" && <button type="button" onClick={() => save("draft")}>Retirer du parcours élève</button>}
          </section>
        </aside>
      </div>

      <p className="statusBox" role="status"><b>{message}</b></p>
    </section>
  );
}
