"use client";

import { useEffect, useMemo, useState } from "react";
import baseExercises from "../data/exercises";
import moreExercises from "../data/moreExercises";
import genesisExercise from "../data/genesisExercise";
import {
  ADMIN_SETTINGS_KEY,
  DEFAULT_ADMIN_SETTINGS,
  LEARNING_MODES,
  LEVELS,
  normalizeExerciseLevel,
  sanitizeAdminSettings
} from "../../lib/learningConfig";
import {
  QUESTION_DIMENSIONS,
  QUESTION_TYPES,
  normalizeExerciseQuestions,
  summarizeQuestionBank,
  validateQuestionSchema
} from "../../lib/questionClassification";

const rawExercises = [...baseExercises, ...moreExercises, genesisExercise];
const exercises = rawExercises.map(normalizeExerciseQuestions);

function validateExercise(value) {
  const required = ["id", "title", "level", "textType", "category", "intention", "text"];
  const missing = required.filter((key) => !String(value?.[key] || "").trim());
  if (missing.length) return { valid: false, message: `Champs manquants : ${missing.join(", ")}.`, exercise: value };
  if (!Array.isArray(value.questions) || value.questions.length === 0) return { valid: false, message: "Ajoute au moins une question.", exercise: value };

  const normalized = normalizeExerciseQuestions(value);
  const invalid = normalized.questions
    .map((question, index) => ({ index, result: validateQuestionSchema(question) }))
    .filter(({ result }) => !result.valid);

  if (invalid.length) {
    const details = invalid.map(({ index, result }) => `Q${index + 1} : ${result.errors.join(", ")}`).join("; ");
    return { valid: false, message: `Questions invalides — ${details}.`, exercise: normalized };
  }

  const dimensions = new Set(normalized.questions.map((question) => question.dimension)).size;
  return {
    valid: true,
    message: `Exercice valide : ${normalized.questions.length} question(s), ${dimensions} dimension(s), classification structurée appliquée.`,
    exercise: normalized
  };
}

function countLabel(count) {
  return `${count} question${count > 1 ? "s" : ""}`;
}

export default function AdminWorkspace() {
  const [settings, setSettings] = useState(DEFAULT_ADMIN_SETTINGS);
  const [selectedExerciseId, setSelectedExerciseId] = useState(exercises[0]?.id || "");
  const [json, setJson] = useState(JSON.stringify(exercises[0] || {}, null, 2));
  const [settingsMessage, setSettingsMessage] = useState("");
  const [jsonMessage, setJsonMessage] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ADMIN_SETTINGS_KEY) || "null");
      if (saved) setSettings(sanitizeAdminSettings(saved));
    } catch {}
  }, []);

  const counts = useMemo(() => Object.fromEntries(
    LEVELS.map((level) => [level.id, exercises.filter((exercise) => normalizeExerciseLevel(exercise.level) === level.id).length])
  ), []);
  const bankSummary = useMemo(() => summarizeQuestionBank(exercises), []);

  function toggleSetting(kind, id) {
    const key = kind === "level" ? "enabledLevels" : "enabledModes";
    const current = settings[key];
    if (current.includes(id) && current.length === 1) {
      setSettingsMessage("Au moins un niveau et un mode doivent rester actifs.");
      return;
    }
    const nextValues = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
    const next = sanitizeAdminSettings({ ...settings, [key]: nextValues });
    setSettings(next);
    setSettingsMessage("");
  }

  function saveSettings() {
    const safe = sanitizeAdminSettings(settings);
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(safe));
    setSettings(safe);
    setSettingsMessage("Réglages enregistrés sur cet appareil.");
  }

  function chooseExercise(id) {
    const exercise = exercises.find((item) => item.id === id);
    setSelectedExerciseId(id);
    if (exercise) setJson(JSON.stringify(exercise, null, 2));
    setJsonMessage("");
  }

  function classifyJson() {
    try {
      const normalized = normalizeExerciseQuestions(JSON.parse(json));
      setJson(JSON.stringify(normalized, null, 2));
      const result = validateExercise(normalized);
      setJsonMessage(result.message);
    } catch (error) {
      setJsonMessage(`JSON invalide : ${error.message}`);
    }
  }

  function validateJson() {
    try {
      setJsonMessage(validateExercise(JSON.parse(json)).message);
    } catch (error) {
      setJsonMessage(`JSON invalide : ${error.message}`);
    }
  }

  function downloadJson() {
    try {
      const result = validateExercise(JSON.parse(json));
      setJsonMessage(result.message);
      if (!result.valid) return;
      setJson(JSON.stringify(result.exercise, null, 2));
      const blob = new Blob([JSON.stringify(result.exercise, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${result.exercise.id || "exercice"}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setJsonMessage(`JSON invalide : ${error.message}`);
    }
  }

  return (
    <div className="adminGrid">
      <section className="card">
        <h2>Niveaux et modes disponibles</h2>
        <p>Ces réglages contrôlent ce qui est visible dans ce navigateur. Une base de données sera nécessaire pour les appliquer à tous les appareils.</p>

        <h3>Niveaux</h3>
        {LEVELS.map((level) => (
          <label className="adminToggle" key={level.id}>
            <input
              type="checkbox"
              checked={settings.enabledLevels.includes(level.id)}
              onChange={() => toggleSetting("level", level.id)}
            />
            <span><b>{level.label}</b> — {counts[level.id]} texte(s) intégré(s)</span>
          </label>
        ))}

        <label htmlFor="defaultLevel"><b>Niveau proposé au démarrage</b></label>
        <select id="defaultLevel" value={settings.defaultLevel} onChange={(event) => setSettings(sanitizeAdminSettings({ ...settings, defaultLevel: event.target.value }))}>
          {LEVELS.filter((level) => settings.enabledLevels.includes(level.id)).map((level) => <option key={level.id} value={level.id}>{level.label}</option>)}
        </select>

        <h3>Modes</h3>
        {LEARNING_MODES.map((mode) => (
          <label className="adminToggle" key={mode.id}>
            <input
              type="checkbox"
              checked={settings.enabledModes.includes(mode.id)}
              onChange={() => toggleSetting("mode", mode.id)}
            />
            <span><b>{mode.label}</b> — {mode.description}</span>
          </label>
        ))}

        <label htmlFor="defaultMode"><b>Mode proposé au démarrage</b></label>
        <select id="defaultMode" value={settings.defaultMode} onChange={(event) => setSettings(sanitizeAdminSettings({ ...settings, defaultMode: event.target.value }))}>
          {LEARNING_MODES.filter((mode) => settings.enabledModes.includes(mode.id)).map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
        </select>

        <button className="green primaryButton" onClick={saveSettings}>Enregistrer les réglages</button>
        {settingsMessage && <p className="statusBox" role="status">{settingsMessage}</p>}

        <div className="card questionBankSummary">
          <h2>Banque de questions structurée</h2>
          <p><b>Total :</b> {countLabel(bankSummary.total)}</p>
          <h3>Dimensions</h3>
          {Object.entries(QUESTION_DIMENSIONS).map(([id, value]) => <p key={id}><b>{value.label} :</b> {bankSummary.byDimension[id]}</p>)}
          <h3>Types</h3>
          {Object.entries(QUESTION_TYPES).map(([id, label]) => <p key={id}><b>{label} :</b> {bankSummary.byType[id]}</p>)}
          <p><b>Preuve obligatoire :</b> {bankSummary.proofRequired}</p>
          <p><b>Justification obligatoire :</b> {bankSummary.justificationRequired}</p>
          <p className="yellow">Les questions existantes sont classées automatiquement sans exposer les réponses attendues aux élèves.</p>
        </div>
      </section>

      <section className="card">
        <h2>Atelier de contenu</h2>
        <p>Choisis un texte existant, vérifie sa structure et télécharge une copie JSON modifiable.</p>
        <label htmlFor="exercise"><b>Exercice intégré</b></label>
        <select id="exercise" value={selectedExerciseId} onChange={(event) => chooseExercise(event.target.value)}>
          {LEVELS.map((level) => (
            <optgroup label={level.label} key={level.id}>
              {exercises.filter((exercise) => normalizeExerciseLevel(exercise.level) === level.id).map((exercise) => (
                <option key={exercise.id} value={exercise.id}>{exercise.title}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <textarea className="adminJson" value={json} onChange={(event) => setJson(event.target.value)} spellCheck="false" />
        <button className="violet" onClick={classifyJson}>Classifier les questions</button>
        <button className="blue" onClick={validateJson}>Valider le JSON</button>
        <button className="green" onClick={downloadJson}>Télécharger le JSON structuré</button>
        {jsonMessage && <p className="statusBox" role="status">{jsonMessage}</p>}
      </section>
    </div>
  );
}
