"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ANSWER_GUARD_STORAGE_KEY,
  ANSWER_LOCK_SECONDS,
  detectLevelId,
  detectModeId,
  evaluateMinimumAnswer,
  getProgressiveSupport
} from "../lib/answerProgression";

function loadRecords() {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(localStorage.getItem(ANSWER_GUARD_STORAGE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function stopInteraction(event) {
  event.preventDefault();
  event.stopPropagation();
  event.nativeEvent?.stopImmediatePropagation?.();
}

function textOf(element) {
  return String(element?.textContent || "").replace(/\s+/g, " ").trim();
}

function findQuestionContext() {
  const badges = Array.from(document.querySelectorAll(".statusBadges .badge")).map(textOf);
  const levelId = detectLevelId(badges[0] || "6e année");
  const modeId = detectModeId(badges.join(" "));
  const questionCards = Array.from(document.querySelectorAll("main .grid.cols section.card .card"));
  const questionCard = questionCards.find((element) => /Question\s+\d+\s*\/\s*\d+/i.test(textOf(element)));
  const questionNumber = textOf(questionCard?.querySelector("b")) || "Question";
  const prompt = textOf(questionCard?.querySelector("h2")) || "Consigne";
  const exerciseTitle = textOf(document.querySelector("main .grid.cols > section.card h1")) || "Lecture";
  const textarea = document.querySelector("main .grid.cols textarea");
  const key = [exerciseTitle, questionNumber, prompt, levelId, modeId].join("|");
  return { key, levelId, modeId, questionNumber, prompt, exerciseTitle, textarea };
}

function findCurrentStep() {
  const active = document.querySelector(".stepNavigation button.blue");
  const match = textOf(active).match(/^(\d+)/);
  return Number(match?.[1] || 0);
}

function findTargetStep(button) {
  if (!button.closest(".stepNavigation")) return 0;
  const match = textOf(button).match(/^(\d+)/);
  return Number(match?.[1] || 0);
}

function readSimulationSummary(button) {
  const container = button.closest("section.card") || button.parentElement;
  const match = textOf(container).match(/Questions répondues\s*:\s*(\d+)\s*\/\s*(\d+)/i);
  return match ? { answered: Number(match[1]), total: Number(match[2]) } : null;
}

export default function ProgressiveAnswerGuard({ children }) {
  const pathname = usePathname();
  const [records, setRecords] = useState({});
  const [panel, setPanel] = useState(null);
  const [now, setNow] = useState(Date.now());

  const enabled = pathname === "/";

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ANSWER_GUARD_STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    const hasLock = Object.values(records).some((record) => Number(record?.lockUntil || 0) > Date.now());
    if (!hasLock) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [records]);

  const panelRecord = panel?.key ? records[panel.key] || {} : {};
  const secondsLeft = Math.max(0, Math.ceil((Number(panelRecord.lockUntil || 0) - now) / 1000));
  const support = useMemo(() => {
    if (!panel?.context) return null;
    return getProgressiveSupport(panel.context.levelId, panel.context.modeId, panelRecord.attempts || 2);
  }, [panel, panelRecord.attempts]);

  function focusAnswer() {
    window.setTimeout(() => document.querySelector("main .grid.cols textarea")?.focus(), 0);
  }

  function updateRecord(key, updater) {
    setRecords((current) => {
      const previous = current[key] || { attempts: 0, helpRequired: false, helpAcknowledged: false, lockUntil: 0 };
      return { ...current, [key]: updater(previous) };
    });
  }

  function showFirstReminder(context, evaluation, attempts) {
    setPanel({
      key: context.key,
      context,
      kind: "reminder",
      title: evaluation.empty ? "Une réponse est requise" : "Ta réponse est commencée",
      message: evaluation.empty
        ? `Écris au moins ${evaluation.minimumWords} mots et une idée complète avant de continuer.`
        : `Conserve ce que tu as écrit et ajoute assez d’information pour former une réponse minimale de ${evaluation.minimumWords} mots.`
    });
    updateRecord(context.key, (record) => ({ ...record, attempts }));
  }

  function startTemporaryLock(context, attempts) {
    const lockUntil = Date.now() + ANSWER_LOCK_SECONDS * 1000;
    updateRecord(context.key, (record) => ({
      ...record,
      attempts,
      lockUntil,
      helpRequired: true,
      helpAcknowledged: false
    }));
    setNow(Date.now());
    setPanel({
      key: context.key,
      context,
      kind: "locked",
      title: "Pause obligatoire",
      message: `Le passage à la suite est bloqué pendant ${ANSWER_LOCK_SECONDS} secondes. Ta réponse actuelle est conservée.`
    });
  }

  function requireProgressiveHelp(context, attempts) {
    updateRecord(context.key, (record) => ({
      ...record,
      attempts,
      helpRequired: true,
      helpAcknowledged: false,
      lockUntil: 0
    }));
    setPanel({
      key: context.key,
      context,
      kind: "help",
      title: "Aide obligatoire",
      message: "Lis l’aide, confirme que tu l’as consultée, puis complète ta réponse."
    });
  }

  function guardQuestionAdvance(event) {
    const context = findQuestionContext();
    if (!context.textarea) return false;

    const evaluation = evaluateMinimumAnswer(context.textarea.value, context.levelId);
    const record = records[context.key] || { attempts: 0, helpRequired: false, helpAcknowledged: false, lockUntil: 0 };

    if (Number(record.lockUntil || 0) > Date.now()) {
      stopInteraction(event);
      setPanel({ key: context.key, context, kind: "locked", title: "Pause obligatoire", message: "Le blocage temporaire est encore actif. Ta réponse n’est pas effacée." });
      return true;
    }

    if (evaluation.ok) {
      if (record.helpRequired && !record.helpAcknowledged) {
        stopInteraction(event);
        setPanel({ key: context.key, context, kind: "help", title: "Aide obligatoire", message: "Consulte et confirme l’aide avant de poursuivre." });
        return true;
      }
      if (record.attempts || record.helpRequired) {
        setRecords((current) => {
          const next = { ...current };
          delete next[context.key];
          return next;
        });
      }
      setPanel(null);
      return false;
    }

    stopInteraction(event);
    const attempts = Number(record.attempts || 0) + 1;
    if (attempts === 1) showFirstReminder(context, evaluation, attempts);
    else if (attempts === 2) startTemporaryLock(context, attempts);
    else requireProgressiveHelp(context, attempts);
    return true;
  }

  function guardSimulationSubmission(event, button) {
    const summary = readSimulationSummary(button);
    if (!summary) return false;

    const badges = Array.from(document.querySelectorAll(".statusBadges .badge")).map(textOf);
    const context = {
      key: `simulation-submit|${textOf(document.querySelector("main h1"))}|${summary.total}`,
      levelId: detectLevelId(badges[0] || "6e année"),
      modeId: "simulation",
      questionNumber: "Remise finale",
      prompt: summary.answered >= summary.total ? "Toutes les questions sont complétées" : `${summary.total - summary.answered} question(s) sans réponse`,
      exerciseTitle: textOf(document.querySelector("main h1")) || "Simulation",
      textarea: null
    };
    const record = records[context.key] || { attempts: 0, helpRequired: false, helpAcknowledged: false, lockUntil: 0 };

    if (Number(record.lockUntil || 0) > Date.now()) {
      stopInteraction(event);
      setPanel({ key: context.key, context, kind: "locked", title: "Remise temporairement bloquée", message: "Retourne aux réponses pendant la pause. Aucun texte déjà écrit ne sera effacé." });
      return true;
    }

    if (record.helpRequired && !record.helpAcknowledged) {
      stopInteraction(event);
      setPanel({ key: context.key, context, kind: "help", title: "Aide obligatoire", message: "Consulte et confirme l’aide de procédure avant la remise finale." });
      return true;
    }

    if (summary.answered >= summary.total) {
      if (record.attempts || record.helpRequired) {
        setRecords((current) => {
          const next = { ...current };
          delete next[context.key];
          return next;
        });
      }
      setPanel(null);
      return false;
    }

    stopInteraction(event);
    const attempts = Number(record.attempts || 0) + 1;
    if (attempts === 1) {
      updateRecord(context.key, (value) => ({ ...value, attempts }));
      setPanel({ key: context.key, context, kind: "submission", title: "Simulation incomplète", message: `Il reste ${summary.total - summary.answered} question(s) sans réponse. La remise finale n’est pas encore permise.` });
    } else if (attempts === 2) {
      startTemporaryLock(context, attempts);
    } else {
      requireProgressiveHelp(context, attempts);
    }
    return true;
  }

  function handleClickCapture(event) {
    if (!enabled) return;
    const button = event.target.closest("button");
    if (!button) return;
    const label = textOf(button);

    if (label.includes("Insérer un début de phrase")) {
      const textarea = document.querySelector("main .grid.cols textarea");
      if (textarea && textarea.value.trim()) {
        stopInteraction(event);
        const context = findQuestionContext();
        setPanel({ key: context.key, context, kind: "protected", title: "Réponse protégée", message: "Le début de phrase n’a pas remplacé ton texte. Ta réponse existante est conservée." });
      }
      return;
    }

    if (label.includes("Remettre la simulation")) {
      guardSimulationSubmission(event, button);
      return;
    }

    if (label === "Question suivante") {
      guardQuestionAdvance(event);
      return;
    }

    const currentStep = findCurrentStep();
    const targetStep = findTargetStep(button);
    const skipsResponseWork = targetStep > currentStep && ((currentStep === 3 && targetStep >= 5) || (currentStep === 5 && targetStep >= 6));
    if (skipsResponseWork) guardQuestionAdvance(event);
  }

  function acknowledgeHelp() {
    if (!panel?.key) return;
    updateRecord(panel.key, (record) => ({ ...record, helpAcknowledged: true, lockUntil: 0 }));
    setPanel(null);
    focusAnswer();
  }

  function returnToResponses() {
    const stepThree = Array.from(document.querySelectorAll(".stepNavigation button")).find((button) => /^3\./.test(textOf(button)));
    setPanel(null);
    stepThree?.click();
  }

  return (
    <div onClickCapture={handleClickCapture}>
      {enabled && panel && (
        <section className={`answerGuard ${secondsLeft > 0 ? "answerGuardLocked" : ""}`} role="alert" aria-live="assertive">
          <div>
            <p className="eyebrow">Progression protégée</p>
            <h2>{secondsLeft > 0 ? `Pause obligatoire — ${secondsLeft} s` : panel.title}</h2>
            <p>{panel.message}</p>
            {panel.context?.questionNumber && <p><b>{panel.context.questionNumber}</b> — {panel.context.prompt}</p>}

            {panelRecord.helpRequired && secondsLeft === 0 && support && (
              <div className="answerGuardHelp">
                <h3>{support.title}</h3>
                <p>{support.note}</p>
                <ol>{support.items.map((item) => <li key={item}>{item}</li>)}</ol>
              </div>
            )}
          </div>

          <div className="answerGuardActions">
            {secondsLeft > 0 ? (
              <button disabled>Attendre la fin de la pause</button>
            ) : panelRecord.helpRequired && !panelRecord.helpAcknowledged ? (
              <button className="green" onClick={acknowledgeHelp}>J’ai lu l’aide</button>
            ) : panel.kind === "submission" ? (
              <button className="blue" onClick={returnToResponses}>Retourner aux réponses</button>
            ) : (
              <button className="blue" onClick={() => { setPanel(null); focusAnswer(); }}>Retourner à ma réponse</button>
            )}
          </div>
        </section>
      )}
      {children}
    </div>
  );
}
