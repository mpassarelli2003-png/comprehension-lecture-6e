"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import baseExercises from "./data/exercises";
import moreExercises from "./data/moreExercises";
import genesisExercise from "./data/genesisExercise";
import {
  FINAL_READING_CHECKLIST,
  evaluateExerciseSubmission,
  evaluateReadingAnswer
} from "../lib/formativeFeedback";
import { normalizeExerciseQuestions } from "../lib/questionClassification";
import { detectStrategyLevel, detectStrategyMode } from "../lib/readingStrategies";

const exercises = [...baseExercises, ...moreExercises, genesisExercise].map(normalizeExerciseQuestions);
const STUDENT_WORK_KEYS = [
  "lecture_student_work_v9",
  "lecture6e_student_work_v8",
  "lecture6e_student_work_v7",
  "lecture6e_student_work_v6",
  "lecture6e_student_work_v5",
  "lecture6e_student_work_v4",
  "lecture6e_student_work_v3"
];

function textOf(element) {
  return String(element?.textContent || "").replace(/\s+/g, " ").trim();
}

function loadStudentWork() {
  if (typeof window === "undefined") return null;
  for (const key of STUDENT_WORK_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
}

function stopInteraction(event) {
  event.preventDefault();
  event.stopPropagation();
  event.nativeEvent?.stopImmediatePropagation?.();
}

function activeStep() {
  const active = document.querySelector(".stepNavigation button.blue");
  return Number(textOf(active).match(/^(\d+)/)?.[1] || 0);
}

function targetStep(button) {
  if (!button.closest(".stepNavigation")) return 0;
  return Number(textOf(button).match(/^(\d+)/)?.[1] || 0);
}

function parseContext() {
  if (typeof document === "undefined") return null;
  const step = activeStep();
  const badges = Array.from(document.querySelectorAll(".statusBadges .badge")).map(textOf);
  const levelId = detectStrategyLevel(badges[0] || "6e année");
  const modeId = detectStrategyMode(badges.join(" "));
  const columns = Array.from(document.querySelectorAll("main .grid.cols > section.card"));
  const leftColumn = columns[0];
  const rightColumn = columns[1];
  const exerciseTitle = textOf(leftColumn?.querySelector("h1"));
  const exercise = exercises.find((item) => item.title === exerciseTitle);
  const work = loadStudentWork();
  const questionCard = Array.from(rightColumn?.querySelectorAll(".card") || [])
    .find((element) => /Question\s+\d+\s*\/\s*\d+/i.test(textOf(element)));

  if (!exercise || !questionCard) {
    return {
      step,
      levelId,
      modeId,
      hasQuestion: false,
      exercise,
      exerciseTitle,
      work
    };
  }

  const numberText = textOf(questionCard.querySelector("b"));
  const match = numberText.match(/Question\s+(\d+)\s*\/\s*(\d+)/i);
  const questionIndex = Math.max(0, Number(match?.[1] || 1) - 1);
  const question = exercise.questions[questionIndex];
  if (!question) {
    return { step, levelId, modeId, hasQuestion: false, exercise, exerciseTitle, work };
  }

  const textarea = rightColumn?.querySelector("textarea");
  const answer = textarea?.value ?? work?.answers?.[question.id] ?? "";
  const key = [exercise.id, question.id, levelId, modeId].join("|");

  return {
    key,
    hasQuestion: true,
    step,
    levelId,
    modeId,
    exercise,
    exerciseTitle,
    question,
    questionIndex,
    totalQuestions: Number(match?.[2] || exercise.questions.length),
    questionNumber: numberText,
    answer,
    work,
    evidence: {
      proofs: Array.isArray(work?.proofs) ? work.proofs : [],
      exerciseId: work?.exerciseId || "",
      modeId: work?.learningMode || ""
    }
  };
}

function statusLabel(status) {
  if (status === "strong") return "Réponse bien structurée";
  if (status === "acceptable") return "Exigences présentes";
  if (status === "partial") return "Réponse à compléter";
  return "Réponse à commencer";
}

function summaryRequirements(summary) {
  const items = [];
  if (summary.missingQuestions) items.push(`${summary.missingQuestions} réponse(s) à commencer`);
  if (summary.missingEvidence) items.push(`${summary.missingEvidence} appui(s) du texte manquant(s) ou trop vague(s)`);
  if (summary.missingJustification) items.push(`${summary.missingJustification} justification(s) manquante(s)`);
  if (summary.missingElements) items.push(`${summary.missingElements} réponse(s) sans tous les éléments demandés`);
  if (summary.missingPersonalPosition) items.push(`${summary.missingPersonalPosition} opinion(s) ou réaction(s) personnelle(s) manquante(s)`);
  if (summary.missingCriterion) items.push(`${summary.missingCriterion} critère(s) d’appréciation manquant(s)`);
  return items.slice(0, 6);
}

export default function FormativeFeedbackPanel({ children }) {
  const pathname = usePathname();
  const enabled = pathname === "/";
  const [context, setContext] = useState(null);
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState("");
  const [submission, setSubmission] = useState(null);
  const signatureRef = useRef("");
  const currentKeyRef = useRef("");

  function refresh(delay = 0) {
    if (!enabled || typeof window === "undefined") return;
    window.setTimeout(() => {
      const next = parseContext();
      const signature = JSON.stringify({
        key: next?.key,
        step: next?.step,
        answer: next?.answer,
        proofs: next?.work?.proofs,
        savedAt: next?.work?.savedAt
      });
      if (signature !== signatureRef.current) {
        const questionChanged = Boolean(next?.key) && next.key !== currentKeyRef.current;
        signatureRef.current = signature;
        currentKeyRef.current = next?.key || "";
        setContext(next);
        if (questionChanged) {
          setAttempted(false);
          setNotice("");
        }
        setSubmission(null);
      }
    }, delay);
  }

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return undefined;
    refresh();
    let timer;
    const observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => refresh(), 50);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [enabled]);

  const feedback = useMemo(() => {
    if (!context?.hasQuestion) return null;
    return evaluateReadingAnswer(
      context.question,
      context.answer,
      context.evidence,
      {
        exerciseId: context.exercise.id,
        modeId: context.modeId,
        levelId: context.levelId
      }
    );
  }, [context]);

  function showFeedback(message = "") {
    setAttempted(true);
    setNotice(message || feedback?.nextStep || "Complète ta réponse avant de continuer.");
    window.setTimeout(() => document.querySelector(".formativeFeedback")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function blockWithFeedback(event, message = "") {
    stopInteraction(event);
    showFeedback(message);
  }

  function letProgressiveGuardHandleEmpty() {
    return feedback?.status === "missing"
      && context?.step === 5
      && Boolean(document.querySelector("main .grid.cols textarea"));
  }

  function handleClickCapture(event) {
    if (!enabled) return;
    const button = event.target.closest("button");
    if (!button) return;
    const label = textOf(button);

    if (button.closest(".formativeFeedback") && label === "Vérifier ma réponse") {
      setAttempted(true);
      setNotice("");
      refresh(80);
      return;
    }

    if (label.includes("Remettre la simulation")) {
      const latest = parseContext();
      const exercise = latest?.exercise || context?.exercise;
      const work = loadStudentWork();
      if (!exercise) return;
      const summary = evaluateExerciseSubmission(exercise, work, { modeId: "simulation" });
      setSubmission(summary);
      if (!summary.readyToSubmit) {
        showFeedback("Tu ne peux pas encore remettre. Certaines réponses doivent être complétées.");
        if (summary.missingQuestions === 0) stopInteraction(event);
      }
      return;
    }

    if (!context?.hasQuestion || !feedback) return;

    if (label === "Question suivante" && !feedback.canContinue) {
      if (letProgressiveGuardHandleEmpty()) {
        showFeedback();
        return;
      }
      blockWithFeedback(event);
      return;
    }

    const current = activeStep();
    const target = targetStep(button);
    const leavingResponseWork = target > current && target >= 6;
    if (leavingResponseWork && !feedback.canContinue) {
      if (letProgressiveGuardHandleEmpty()) {
        showFeedback();
        return;
      }
      blockWithFeedback(event);
      return;
    }

    refresh(100);
  }

  function handleInputCapture(event) {
    if (!enabled || event.target.tagName !== "TEXTAREA") return;
    setAttempted(true);
    setNotice("");
    refresh(20);
  }

  const showPanel = enabled
    && context?.hasQuestion
    && feedback
    && context.step >= 3
    && context.step <= 5
    && (attempted || String(context.answer || "").trim());
  const visibleStrengths = feedback?.procedureOnly
    ? (String(context?.answer || "").trim() ? ["Une réponse est écrite."] : [])
    : feedback?.strengths?.slice(0, 2) || [];
  const visibleMissing = feedback?.missing?.slice(0, 3) || [];

  return (
    <div onClickCapture={handleClickCapture} onInputCapture={handleInputCapture}>
      {showPanel && (
        <section className={`formativeFeedback formativeStatus-${feedback.status}`} aria-label="Rétroaction formative" aria-live="polite">
          <div className="formativeFeedbackHeader">
            <div>
              <p className="eyebrow">Correction formative</p>
              <h2>Ce que tu peux améliorer</h2>
              <p><b>{context.questionNumber}</b> — {statusLabel(feedback.status)}</p>
            </div>
            <span className="badge">{feedback.procedureOnly ? "Procédure seulement" : context.question.dimensionLabel}</span>
          </div>

          {notice && <div className="statusBox warningBox"><b>{notice}</b></div>}

          <div className="formativeFeedbackGrid">
            <div>
              <h3>Ce qui est réussi</h3>
              {visibleStrengths.length
                ? visibleStrengths.map((item) => <p key={item}>✓ {item}</p>)
                : <p>La réponse est encore à commencer.</p>}
            </div>
            <div>
              <h3>À améliorer</h3>
              {visibleMissing.length
                ? visibleMissing.map((item) => <p key={item.code}>• {item.message}</p>)
                : <p>✓ Les exigences principales sont présentes.</p>}
            </div>
            <div className="formativeNextStep">
              <h3>Prochaine action</h3>
              <p><b>{feedback.nextStep}</b></p>
            </div>
          </div>

          <div className="formativeFeedbackActions">
            <button type="button" className="blue" onClick={() => { setAttempted(true); refresh(50); }}>Vérifier ma réponse</button>
            {context.step === 5 && <button type="button" onClick={() => document.querySelector("main .grid.cols textarea")?.focus()}>Retourner à ma réponse</button>}
          </div>

          {context.step === 5 && (
            <details className="formativeChecklist">
              <summary><b>Grille finale simplifiée</b></summary>
              <div className="formativeChecklistGrid">
                {FINAL_READING_CHECKLIST.map((group) => (
                  <div key={group.group}>
                    <h3>{group.group}</h3>
                    {group.items.map((item) => <p key={item}>☐ {item}</p>)}
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>
      )}

      {submission && !submission.readyToSubmit && (
        <section className="formativeFeedback formativeSubmission" role="alert">
          <p className="eyebrow">Bilan avant remise</p>
          <h2>Travail à compléter</h2>
          <p><b>{submission.completeQuestions}</b> réponse(s) complète(s), <b>{submission.partialQuestions}</b> partielle(s), <b>{submission.missingQuestions}</b> manquante(s).</p>
          {summaryRequirements(submission).map((item) => <p key={item}>• {item}</p>)}
          <p className="yellow"><b>Aucun contenu attendu n’est révélé.</b> Seules les exigences manquantes sont indiquées.</p>
        </section>
      )}

      {children}
    </div>
  );
}
