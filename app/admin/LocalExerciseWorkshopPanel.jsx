"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { auditExerciseContent } from "../../lib/contentCalibration";
import {
  QUESTION_DIMENSIONS,
  QUESTION_TYPES,
  normalizeExerciseQuestions,
  normalizeQuestionLevel
} from "../../lib/questionClassification";
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

export default function LocalExerciseWorkshopPanel() {
  const { store, setStore } = useExerciseBank({ includeDrafts: true });
  const localEntries = store.entries || [];
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState(() => createExerciseTemplate("6e"));
  const [message, setMessage] = useState("Atelier local prêt.");
  const [previewMode, setPreviewMode] = useState("training");
  const [importText, setImportText] = useState("");
  const fileInputRef = useRef(null);

  const selectedEntry = localEntries.find((entry) => entry.exercise.id === selectedId) || null;
  const normalizedDraft = useMemo(() => sanitizeWorkshopExercise(draft), [draft]);
  const validation = useMemo(
    () => validateWorkshopExercise(normalizedDraft, localEntries.map((entry) => entry.exercise.id)),
    [normalizedDraft, localEntries]
  );
  const automaticAudit = validation.automaticAudit || auditExerciseContent(normalizedDraft);

  useEffect(() => {
    if (!selectedId && localEntries[0]) {
      setSelectedId(localEntries[0].exercise.id);
      setDraft(localEntries[0].exercise);
    }
  }, [localEntries.length]);

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
    if (status === "published" && !result.valid) {
      setMessage(`Publication bloquée — ${result.errors.join(" · ")}`);
      return;
    }
    let nextStore = store;
    if (selectedId && selectedId !== result.exercise.id) nextStore = removeLocalExercise(nextStore, selectedId);
    nextStore = upsertLocalExercise(nextStore, result.exercise, status);
    setSelectedId(result.exercise.id);
    setDraft(result.exercise);
    persist(nextStore, status === "published"
      ? "Exercice publié localement dans le parcours élève."
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
    const temporaryStore = upsertLocalExercise(store, draft, selectedEntry?.status || "draft");
    downloadJson(`${normalizedDraft.id}.json`, normalizedDraft);
    setMessage("Exercice courant exporté en JSON.");
    return temporaryStore;
  }

  function exportBank() {
    downloadJson(
      `banque-exercices-locale-${new Date().toISOString().slice(0, 10)}.json`,
      buildLocalExerciseExport(store)
    );
    setMessage("Banque locale complète exportée.");
  }

  function importJson(text) {
    const parsed = parseExerciseImport(text);
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
          <p className="eyebrow">Bloc 10</p>
          <h2>Création, importation et édition locale d’exercices</h2>
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
                    <select value={question.dimension || "comprendre"} onChange={(event) => updateQuestion(index, "dimension", event.target.value)}>
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
            <h3>Aperçu élève</h3>
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
                    <small>{QUESTION_DIMENSIONS[question.dimension]?.label || "Comprendre"} · {question.validationProfile?.shortInstruction || "Répondre avec un appui du texte."}</small>
                  ) : (
                    <small>Réponds de façon autonome. Aucune aide de contenu n’est affichée.</small>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h3>Audit pédagogique manuel</h3>
            <p>Après l’enregistrement, ce texte apparaît automatiquement dans la section <b>Audit pédagogique manuel</b> située plus bas dans `/admin`.</p>
            <p>La validation humaine reste distincte de l’audit automatique.</p>
          </section>

          <section className="card localPublicationBox">
            <h3>Enregistrement local</h3>
            <p><b>{validation.message}</b></p>
            <button type="button" className="blue" onClick={() => save("draft")}>Enregistrer comme brouillon</button>
            <button type="button" className="green" disabled={!validation.valid} onClick={() => save("published")}>Publier dans le parcours élève</button>
            {selectedEntry?.status === "published" && <button type="button" onClick={() => save("draft")}>Retirer du parcours élève</button>}
          </section>
        </aside>
      </div>

      <p className="statusBox" role="status"><b>{message}</b></p>
    </section>
  );
}
