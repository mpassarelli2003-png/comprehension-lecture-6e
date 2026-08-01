"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LOCAL_BACKUP_HISTORY_KEY,
  addLocalBackupSnapshot,
  analyzeLocalBackupConflicts,
  buildLocalExerciseBackup,
  createEmptyLocalBackupHistory,
  localBackupFilename,
  normalizeLocalBackupHistory,
  removeLocalBackupSnapshot,
  restoreLocalExerciseBackup,
  validateLocalExerciseBackup
} from "../../lib/localBackupRestore";
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

function loadHistory() {
  if (typeof window === "undefined") return createEmptyLocalBackupHistory();
  try {
    return normalizeLocalBackupHistory(JSON.parse(localStorage.getItem(LOCAL_BACKUP_HISTORY_KEY) || "null"));
  } catch {
    return createEmptyLocalBackupHistory();
  }
}

function dateLabel(value) {
  if (!value) return "date inconnue";
  try {
    return new Date(value).toLocaleString("fr-CA");
  } catch {
    return value;
  }
}

function summaryText(summary) {
  if (!summary) return "";
  return [
    `${summary.imported} ajouté(s)`,
    `${summary.renamed} renommé(s)`,
    `${summary.replaced} remplacé(s)`,
    `${summary.skippedDuplicates} doublon(s) ignoré(s)`,
    `${summary.skippedConflicts} conflit(s) ignoré(s)`,
    `${summary.restoredAsDraft} remis en brouillon`
  ].join(" · ");
}

export default function LocalBackupRestorePanel() {
  const { store, setStore } = useExerciseBank({ includeDrafts: true });
  const [history, setHistory] = useState(createEmptyLocalBackupHistory());
  const [label, setLabel] = useState("");
  const [importText, setImportText] = useState("");
  const [pendingBackup, setPendingBackup] = useState(null);
  const [restoreMode, setRestoreMode] = useState("merge");
  const [conflictPolicy, setConflictPolicy] = useState("rename");
  const [message, setMessage] = useState("Gestionnaire de sauvegardes prêt.");
  const fileInputRef = useRef(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const currentCounts = useMemo(() => ({
    total: store.entries?.length || 0,
    drafts: (store.entries || []).filter((entry) => entry.status === "draft").length,
    published: (store.entries || []).filter((entry) => entry.status === "published").length
  }), [store]);

  const pendingValidation = useMemo(
    () => pendingBackup ? validateLocalExerciseBackup(pendingBackup) : null,
    [pendingBackup]
  );
  const conflictAnalysis = useMemo(
    () => pendingBackup ? analyzeLocalBackupConflicts(store, pendingBackup) : null,
    [store, pendingBackup]
  );

  function persistHistory(next) {
    const safe = normalizeLocalBackupHistory(next);
    setHistory(safe);
    localStorage.setItem(LOCAL_BACKUP_HISTORY_KEY, JSON.stringify(safe));
  }

  function createSnapshot({ download = false, snapshotLabel = "" } = {}) {
    const backup = buildLocalExerciseBackup(store, {
      label: snapshotLabel || label || `Sauvegarde manuelle du ${new Date().toLocaleDateString("fr-CA")}`
    });
    persistHistory(addLocalBackupSnapshot(history, backup));
    if (download) downloadJson(localBackupFilename(backup), backup);
    setLabel("");
    setMessage(download
      ? `Sauvegarde complète créée et téléchargée — ${backup.entryCount} exercice(s).`
      : `Sauvegarde datée créée localement — ${backup.entryCount} exercice(s).`);
    return backup;
  }

  function inspectBackup(value) {
    const validation = validateLocalExerciseBackup(value);
    if (!validation.valid) {
      setPendingBackup(typeof value === "string" ? value : null);
      setMessage(`Sauvegarde refusée — ${validation.errors.join(" · ")}`);
      return;
    }
    setPendingBackup(validation.backup);
    setImportText("");
    const conflicts = analyzeLocalBackupConflicts(store, validation.backup);
    setMessage(`Sauvegarde intègre : ${validation.entryCount} exercice(s), ${conflicts.conflicts.length} conflit(s), ${conflicts.exactDuplicates.length} doublon(s) identique(s).`);
  }

  async function inspectFile(file) {
    if (!file) return;
    try {
      inspectBackup(await file.text());
    } catch (error) {
      setMessage(`Lecture impossible : ${error.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function restoreBackup(backup, mode = restoreMode) {
    const validation = validateLocalExerciseBackup(backup);
    if (!validation.valid) {
      setMessage(`Restauration bloquée — ${validation.errors.join(" · ")}`);
      return;
    }

    const analysis = analyzeLocalBackupConflicts(store, backup);
    const replacementWarning = mode === "replace"
      ? `Cette opération remplacera les ${currentCounts.total} exercice(s) actuellement enregistrés. Une copie de sécurité sera créée automatiquement. Continuer?`
      : `Fusionner ${validation.entryCount} exercice(s) avec la banque actuelle? Une copie de sécurité sera créée automatiquement.`;
    if (!window.confirm(replacementWarning)) {
      setMessage("Restauration annulée. Aucune donnée n’a été modifiée.");
      return;
    }

    if (mode === "merge" && conflictPolicy === "replace" && analysis.conflicts.length > 0) {
      if (!window.confirm(`${analysis.conflicts.length} exercice(s) portant le même identifiant seront écrasés et remis en brouillon. Confirmer l’écrasement?`)) {
        setMessage("Écrasement annulé. Aucune donnée n’a été modifiée.");
        return;
      }
    }

    const emergency = buildLocalExerciseBackup(store, {
      label: `Copie automatique avant restauration — ${new Date().toLocaleString("fr-CA")}`
    });
    let nextHistory = addLocalBackupSnapshot(history, emergency);
    nextHistory = addLocalBackupSnapshot(nextHistory, backup);

    const result = restoreLocalExerciseBackup(store, backup, {
      mode,
      conflictPolicy
    });
    if (!result.valid) {
      setMessage(`Restauration bloquée — ${result.errors.join(" · ")}`);
      return;
    }

    saveLocalExerciseStore(result.store);
    setStore(result.store);
    persistHistory(nextHistory);
    setMessage(`Restauration terminée — ${summaryText(result.summary)}. Tous les exercices restaurés sont en brouillon.`);
  }

  function selectSnapshot(snapshot) {
    const validation = validateLocalExerciseBackup(snapshot);
    setPendingBackup(snapshot);
    setMessage(validation.valid
      ? `Version du ${dateLabel(snapshot.generatedAt)} prête à être restaurée.`
      : `Version locale invalide — ${validation.errors.join(" · ")}`);
  }

  function deleteSnapshot(snapshot) {
    const checksum = snapshot?.integrity?.checksum;
    if (!checksum || !window.confirm(`Supprimer la sauvegarde « ${snapshot.label || checksum} » de ce navigateur?`)) return;
    persistHistory(removeLocalBackupSnapshot(history, checksum));
    if (pendingBackup?.integrity?.checksum === checksum) setPendingBackup(null);
    setMessage("Sauvegarde locale supprimée. La banque d’exercices n’a pas été modifiée.");
  }

  return (
    <section className="card localBackupRestore" aria-label="Sauvegarde, restauration et transfert local">
      <div className="localBackupHeader">
        <div>
          <p className="eyebrow">Bloc 12</p>
          <h2>Sauvegarde, restauration et transfert local</h2>
          <p>Les fichiers contiennent uniquement la banque de contenus. Les exercices restaurés ou transférés reviennent toujours comme brouillons.</p>
        </div>
        <span className="badge">{history.snapshots.length} version(s) conservée(s)</span>
      </div>

      <div className="localBackupStats">
        <div><b>{currentCounts.total}</b><span>exercices locaux</span></div>
        <div><b>{currentCounts.drafts}</b><span>brouillons</span></div>
        <div><b>{currentCounts.published}</b><span>publiés</span></div>
        <div><b>{history.snapshots.length}</b><span>sauvegardes locales</span></div>
      </div>

      <div className="localBackupGrid">
        <section className="card localBackupCreate">
          <h3>1. Sauvegarder la banque actuelle</h3>
          <label>Nom facultatif de la sauvegarde
            <input value={label} maxLength={180} onChange={(event) => setLabel(event.target.value)} placeholder="Ex. Avant la révision des textes de septembre" />
          </label>
          <div className="localBackupActions">
            <button type="button" className="blue" onClick={() => createSnapshot()}>Créer une sauvegarde datée</button>
            <button type="button" onClick={() => createSnapshot({ download: true })}>Télécharger la sauvegarde complète</button>
          </div>
          <p className="smallText">Une somme de contrôle est calculée pour détecter un fichier incomplet ou modifié.</p>
        </section>

        <section className="card localBackupImport">
          <h3>2. Inspecter une sauvegarde</h3>
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Colle ici une sauvegarde complète du bloc 12." />
          <div className="localBackupActions">
            <button type="button" onClick={() => inspectBackup(importText)}>Vérifier le JSON collé</button>
            <button type="button" onClick={() => fileInputRef.current?.click()}>Choisir un fichier de sauvegarde</button>
            <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={(event) => inspectFile(event.target.files?.[0])} />
          </div>
          <p className="smallText">Les anciens exports du bloc 10 restent importables dans l’atelier, mais seule une sauvegarde du bloc 12 possède un contrôle d’intégrité vérifiable.</p>
        </section>
      </div>

      <section className="card localBackupHistory">
        <h3>3. Versions précédentes conservées dans ce navigateur</h3>
        {history.snapshots.length === 0 ? (
          <p className="yellow">Aucune sauvegarde locale n’a encore été créée.</p>
        ) : (
          <div className="localBackupHistoryList">
            {history.snapshots.map((snapshot) => {
              const validation = validateLocalExerciseBackup(snapshot);
              const checksum = snapshot?.integrity?.checksum || `invalid-${snapshot.generatedAt}`;
              return (
                <article className={`localBackupSnapshot ${validation.valid ? "valid" : "invalid"}`} key={checksum}>
                  <div>
                    <b>{snapshot.label || "Sauvegarde sans titre"}</b>
                    <p>{dateLabel(snapshot.generatedAt)} · {snapshot.entryCount ?? validation.entryCount} exercice(s)</p>
                    <small>{validation.valid ? `Intégrité conforme — ${checksum}` : `Invalide — ${validation.errors.join(" · ")}`}</small>
                  </div>
                  <div className="localBackupActions">
                    <button type="button" disabled={!validation.valid} onClick={() => selectSnapshot(snapshot)}>Préparer</button>
                    <button type="button" disabled={!validation.valid} onClick={() => downloadJson(localBackupFilename(snapshot), snapshot)}>Télécharger</button>
                    <button type="button" onClick={() => deleteSnapshot(snapshot)}>Supprimer</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="card localBackupRestoreBox">
        <h3>4. Restaurer ou transférer</h3>
        {!pendingBackup || !pendingValidation ? (
          <p className="yellow">Choisis ou inspecte d’abord une sauvegarde complète.</p>
        ) : !pendingValidation.valid ? (
          <div>
            <p className="errorBox"><b>Restauration impossible.</b></p>
            {pendingValidation.errors.map((error) => <p className="errorBox" key={error}>{error}</p>)}
          </div>
        ) : (
          <>
            <div className="localBackupIntegrity">
              <p><b>{pendingValidation.label}</b></p>
              <p>{dateLabel(pendingValidation.generatedAt)} · {pendingValidation.entryCount} exercice(s)</p>
              <p className="green"><b>Intégrité conforme.</b> Somme : {pendingBackup.integrity.checksum}</p>
            </div>

            <div className="localBackupConflictSummary">
              <span><b>{conflictAnalysis?.newEntries.length || 0}</b> nouveaux</span>
              <span><b>{conflictAnalysis?.exactDuplicates.length || 0}</b> identiques</span>
              <span><b>{conflictAnalysis?.conflicts.length || 0}</b> conflits</span>
            </div>

            <div className="localBackupOptions">
              <label>Mode de restauration
                <select value={restoreMode} onChange={(event) => setRestoreMode(event.target.value)}>
                  <option value="merge">Fusionner avec la banque actuelle</option>
                  <option value="replace">Remplacer toute la banque actuelle</option>
                </select>
              </label>
              {restoreMode === "merge" && (
                <label>Conflits d’identifiants
                  <select value={conflictPolicy} onChange={(event) => setConflictPolicy(event.target.value)}>
                    <option value="rename">Conserver les deux avec un nouvel identifiant</option>
                    <option value="skip">Garder l’exercice actuel et ignorer le conflit</option>
                    <option value="replace">Écraser l’exercice actuel</option>
                  </select>
                </label>
              )}
            </div>

            {conflictAnalysis?.conflicts.length > 0 && (
              <details>
                <summary>Voir les conflits détectés</summary>
                <ul>{conflictAnalysis.conflicts.map((item) => <li key={item.id}><code>{item.id}</code> — {item.title}</li>)}</ul>
              </details>
            )}

            <p className="yellow"><b>Avant l’opération :</b> une copie de sécurité de la banque actuelle sera créée automatiquement. Aucun exercice restauré ne sera publié automatiquement.</p>
            <button type="button" className="green" onClick={() => restoreBackup(pendingBackup)}>Restaurer cette sauvegarde</button>
          </>
        )}
      </section>

      <div className="localBackupPrivacy">
        <b>Données exclues :</b> réponses d’élèves, preuves sélectionnées, tentatives et historique de rétroaction. Aucun compte, serveur, API ou système de base de données n’est utilisé.
      </div>
      <p className="statusBox" role="status"><b>{message}</b></p>
    </section>
  );
}
