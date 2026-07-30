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

const exercises = [...baseExercises, ...moreExercises, genesisExercise];

function validateExercise(value) {
  const required = ["id", "title", "level", "textType", "category", "intention", "text"];
  const missing = required.filter((key) => !String(value?.[key] || "").trim());
  if (missing.length) return `Champs manquants : ${missing.join(", ")}.`;
  if (!Array.isArray(value.questions) || value.questions.length === 0) return "Ajoute au moins une question.";
  if (value.questions.some((question) => !question?.id || !question?.prompt)) return "Chaque question doit avoir un id et une consigne.";
  return "Exercice valide pour un aperçu local.";
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

  function validateJson() {
    try {
      setJsonMessage(validateExercise(JSON.parse(json)));
    } catch (error) {
      setJsonMessage(`JSON invalide : ${error.message}`);
    }
  }

  function downloadJson() {
    try {
      const value = JSON.parse(json);
      const message = validateExercise(value);
      setJsonMessage(message);
      if (!message.startsWith("Exercice valide")) return;
      const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${value.id || "exercice"}.json`;
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
        <button className="blue" onClick={validateJson}>Valider le JSON</button>
        <button className="green" onClick={downloadJson}>Télécharger le JSON</button>
        {jsonMessage && <p className="statusBox" role="status">{jsonMessage}</p>}
      </section>
    </div>
  );
}
