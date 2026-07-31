"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import baseExercises from "./data/exercises";
import moreExercises from "./data/moreExercises";
import genesisExercise from "./data/genesisExercise";
import { normalizeExerciseQuestions } from "../lib/questionClassification";
import {
  READING_STRATEGY_STORAGE_KEY,
  buildReadingStrategy,
  countEvidenceInStudentWork,
  detectStrategyLevel,
  detectStrategyMode,
  hasEvidenceForQuestion,
  makeStrategyKey,
  missingEvidenceCount,
  phaseForStep,
  shouldBlockForEvidence
} from "../lib/readingStrategies";

const PHASE_ORDER = ["understand", "find", "respond"];
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

function stopInteraction(event) {
  event.preventDefault();
  event.stopPropagation();
  event.nativeEvent?.stopImmediatePropagation?.();
}

function loadRecords() {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(localStorage.getItem(READING_STRATEGY_STORAGE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function loadStudentWork() {
  if (typeof window === "undefined") return null;
  for (const key of STUDENT_WORK_KEYS) {
    try {
      const value = localStorage.getItem(key);
      if (value) return JSON.parse(value);
    } catch {}
  }
  return null;
}

function studentWorkIsEmpty(work) {
  if (!work || typeof work !== "object") return true;
  const hasProof = Array.isArray(work.proofs) && work.proofs.some((proof) => String(proof?.text || "").trim());
  const hasAnswer = Object.values(work.answers || {}).some((answer) => String(answer || "").trim());
  return !hasProof && !hasAnswer;
}

function compactQuestionModel(question = {}, fallback = {}) {
  return {
    id: question.id || fallback.id || "",
    prompt: question.prompt || fallback.prompt || "",
    type: question.type || fallback.type || "comprendre",
    points: Number(question.points || fallback.points || 1),
    proofTypeSuggested: question.proofTypeSuggested || "",
    dimension: question.dimension || "",
    questionType: question.questionType || "",
    proofRequired: typeof question.proofRequired === "boolean" ? question.proofRequired : undefined,
    justificationRequired: typeof question.justificationRequired === "boolean" ? question.justificationRequired : undefined,
    minimumExpectedElements: Number(question.minimumExpectedElements || 0) || undefined,
    targetLevel: question.targetLevel || fallback.levelId || "6e",
    validationProfile: question.validationProfile || null
  };
}

function parseQuestionContext() {
  if (typeof document === "undefined") return null;
  const activeStep = document.querySelector(".stepNavigation button.blue");
  const stepMatch = textOf(activeStep).match(/^(\d+)/);
  const step = Number(stepMatch?.[1] || 0);
  const badges = Array.from(document.querySelectorAll(".statusBadges .badge")).map(textOf);
  const levelId = detectStrategyLevel(badges[0] || "6e année");
  const modeId = detectStrategyMode(badges.join(" "));
  const columns = Array.from(document.querySelectorAll("main .grid.cols > section.card"));
  const rightColumn = columns[1];
  const exerciseTitle = textOf(columns[0]?.querySelector("h1")) || "Lecture";
  const exerciseData = exercises.find((item) => item.title === exerciseTitle);
  const studentWork = loadStudentWork();
  const exerciseId = exerciseData?.id || studentWork?.exerciseId || "";
  const questionCard = Array.from(rightColumn?.querySelectorAll(".card") || []).find((element) => /Question\s+\d+\s*\/\s*\d+/i.test(textOf(element)));

  if (!questionCard) {
    return { step, levelId, modeId, hasQuestion: false, exerciseTitle, exerciseId };
  }

  const numberText = textOf(questionCard.querySelector("b")) || "Question";
  const countMatch = numberText.match(/Question\s+(\d+)\s*\/\s*(\d+)/i);
  const questionIndex = Number(countMatch?.[1] || 1);
  const prompt = textOf(questionCard.querySelector("h2"));
  const meta = Array.from(questionCard.querySelectorAll("p")).map(textOf).find((value) => /point\(s\)|point/i.test(value)) || "comprendre — 1 point";
  const metaParts = meta.split(/\s+—\s+/);
  const pointsMatch = meta.match(/(\d+)\s*point/i);
  const questionData = exerciseData?.questions?.[questionIndex - 1]
    || exerciseData?.questions?.find((item) => String(item.prompt || "").trim() === prompt);
  const question = compactQuestionModel(questionData, {
    prompt,
    type: metaParts[0] || "comprendre",
    points: Number(pointsMatch?.[1] || 1),
    levelId
  });
  const questionId = question.id;
  const proofSectionVisible = textOf(rightColumn).includes("Mes passages sauvegardés");
  const domProofCount = Array.from(rightColumn?.querySelectorAll("button") || []).filter((button) => textOf(button).includes("Utiliser dans ma réponse")).length;
  const savedEvidence = hasEvidenceForQuestion(studentWork, { exerciseId, modeId, questionId });
  const proofCount = Math.max(domProofCount, savedEvidence ? 1 : 0);
  const key = makeStrategyKey({ exerciseTitle, questionNumber: numberText, prompt, levelId, modeId });

  return {
    hasQuestion: true,
    key,
    step,
    levelId,
    modeId,
    exerciseTitle,
    exerciseId,
    questionId,
    questionNumber: numberText,
    questionIndex,
    totalQuestions: Number(countMatch?.[2] || 1),
    prompt,
    question,
    proofCount,
    proofSectionVisible
  };
}

function readSubmissionSummary(button) {
  const container = button.closest("section.card") || button.parentElement;
  const match = textOf(container).match(/Questions répondues\s*:\s*(\d+)\s*\/\s*(\d+)/i);
  return match ? { answered: Number(match[1]), total: Number(match[2]) } : null;
}

function targetStep(button) {
  if (!button.closest(".stepNavigation")) return 0;
  return Number(textOf(button).match(/^(\d+)/)?.[1] || 0);
}

function rightQuestionColumn() {
  return Array.from(document.querySelectorAll("main .grid.cols > section.card"))[1];
}

function synchronizeDisplayedQuestionWord(context) {
  if (!context?.hasQuestion || context.modeId === "simulation" || context.step !== 3) return;
  const rightColumn = rightQuestionColumn();
  const paragraph = Array.from(rightColumn?.querySelectorAll("p.yellow") || []).find((item) => textOf(item).startsWith("Mot-question"));
  if (!paragraph) return;
  const strategy = buildReadingStrategy({ question: context.question, levelId: context.levelId, modeId: context.modeId });
  const expected = `Mot-question : ${strategy.questionWord}. ${strategy.questionWordHelp}`;
  if (textOf(paragraph) !== expected) paragraph.textContent = expected;
}

function synchronizeLegacySupports(context) {
  if (!context?.hasQuestion || context.modeId === "simulation" || context.step !== 5) return;
  const rightColumn = rightQuestionColumn();
  if (!rightColumn) return;
  const strategy = buildReadingStrategy({ question: context.question, levelId: context.levelId, modeId: context.modeId });

  const targetCard = Array.from(rightColumn.querySelectorAll(".card")).find((card) => textOf(card.querySelector("b")) === "Ce que la question demande :");
  const targetParagraph = targetCard?.querySelector("p");
  const targetText = `${strategy.classification.validationProfile.shortInstruction} La question attend au moins ${strategy.minimumExpectedElements} élément${strategy.minimumExpectedElements > 1 ? "s" : ""}.`;
  if (targetParagraph && textOf(targetParagraph) !== targetText) targetParagraph.textContent = targetText;

  const hintsCard = Array.from(rightColumn.querySelectorAll(".card")).find((card) => textOf(card.querySelector("h3")) === "Indices gradués");
  const details = Array.from(hintsCard?.querySelectorAll("details") || []);
  const safeHints = [
    ["Indice 1 — Comprendre", `Mot-question : « ${strategy.questionWord} ». ${strategy.questionWordHelp}`],
    ["Indice 2 — Trouver", strategy.phases.find.short],
    ["Indice 3 — Répondre", strategy.classification.validationProfile.shortInstruction]
  ];
  details.slice(0, safeHints.length).forEach((detail, index) => {
    const [title, body] = safeHints[index];
    const summary = detail.querySelector("summary");
    const paragraph = detail.querySelector("p");
    if (summary && textOf(summary) !== title) summary.textContent = title;
    if (paragraph && textOf(paragraph) !== body) paragraph.textContent = body;
  });
}

function synchronizeQuestionSupports(context) {
  synchronizeDisplayedQuestionWord(context);
  synchronizeLegacySupports(context);
}

export default function GuidedReadingCoach({ children }) {
  const pathname = usePathname();
  const enabled = pathname === "/";
  const [context, setContext] = useState(null);
  const [records, setRecords] = useState({});
  const [expanded, setExpanded] = useState(false);
  const [notice, setNotice] = useState("");
  const signatureRef = useRef("");

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(READING_STRATEGY_STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return undefined;
    let timer;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const next = parseQuestionContext();
        synchronizeQuestionSupports(next);
        const signature = JSON.stringify(next);
        if (signature !== signatureRef.current) {
          signatureRef.current = signature;
          setContext(next);
          setExpanded(false);
          setNotice("");
        }
        if (!next?.hasQuestion && next?.step === 1) {
          window.setTimeout(() => {
            const work = loadStudentWork();
            if (studentWorkIsEmpty(work)) setRecords({});
          }, 120);
        }
      }, 30);
    };

    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener("popstate", refresh);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("popstate", refresh);
    };
  }, [enabled]);

  useEffect(() => {
    if (!context?.hasQuestion) return;
    setRecords((current) => {
      const previous = current[context.key] || {};
      const evidenceSaved = context.proofCount > 0;
      if (Boolean(previous.evidenceSaved) === evidenceSaved) return current;
      return {
        ...current,
        [context.key]: {
          ...previous,
          evidenceSaved,
          updatedAt: new Date().toISOString()
        }
      };
    });
  }, [context?.key, context?.proofCount, context?.hasQuestion]);

  const record = context?.key ? records[context.key] || {} : {};
  const strategy = useMemo(() => {
    if (!context?.hasQuestion) return null;
    return buildReadingStrategy({ question: context.question, levelId: context.levelId, modeId: context.modeId });
  }, [context]);
  const activePhase = phaseForStep(context?.step || 3);
  const evidenceSaved = Boolean(context?.proofCount > 0);

  function updateRecord(updater) {
    if (!context?.key) return;
    setRecords((current) => {
      const previous = current[context.key] || { completed: {} };
      return { ...current, [context.key]: updater(previous) };
    });
  }

  function toggleCompleted(phase) {
    updateRecord((previous) => ({
      ...previous,
      completed: { ...previous.completed, [phase]: !previous.completed?.[phase] },
      updatedAt: new Date().toISOString()
    }));
  }

  function goToFindStep() {
    const button = Array.from(document.querySelectorAll(".stepNavigation button")).find((item) => /^4\./.test(textOf(item)));
    button?.click();
  }

  function focusAnswer() {
    rightQuestionColumn()?.querySelector("textarea")?.focus();
  }

  function blockForMissingEvidence(event, message) {
    stopInteraction(event);
    setNotice(message);
    window.setTimeout(() => document.querySelector(".readingCoach")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function handleClickCapture(event) {
    if (!enabled) return;
    const button = event.target.closest("button");
    if (!button) return;
    const label = textOf(button);

    if (label.includes("Remettre la simulation")) {
      const summary = readSubmissionSummary(button);
      if (!summary) return;
      const studentWork = loadStudentWork();
      const exerciseData = exercises.find((item) => item.id === (context?.exerciseId || studentWork?.exerciseId));
      const requiredQuestionIds = (exerciseData?.questions || []).filter((question) => question.proofRequired).map((question) => question.id);
      const withEvidence = countEvidenceInStudentWork(studentWork, {
        exerciseId: context?.exerciseId || studentWork?.exerciseId || "",
        modeId: context?.modeId || "simulation",
        questionIds: requiredQuestionIds
      });
      const missing = missingEvidenceCount(requiredQuestionIds.length, withEvidence);
      if (missing > 0) {
        blockForMissingEvidence(event, `La remise est bloquée : ${missing} question(s) exigent encore un passage ou une note du texte.`);
      }
      return;
    }

    if (!context?.hasQuestion || !strategy?.needsEvidence) return;

    if (label === "Question suivante" && shouldBlockForEvidence({ action: "next-question", currentStep: context.step, evidenceSaved, needsEvidence: strategy.needsEvidence })) {
      blockForMissingEvidence(event, "Avant de passer à la question suivante, enregistre au moins un passage ou un indice du texte à l’étape 4 — Trouver.");
      return;
    }

    const nextStep = targetStep(button);
    if (shouldBlockForEvidence({ action: "step", currentStep: context.step, targetStep: nextStep, evidenceSaved, needsEvidence: strategy.needsEvidence })) {
      blockForMissingEvidence(event, "Avant de rédiger ou de remettre, passe par l’étape 4 et conserve au moins un appui du texte.");
    }
  }

  function handleInputCapture() {
    if (!enabled) return;
    window.setTimeout(() => {
      const next = parseQuestionContext();
      synchronizeQuestionSupports(next);
      if (next) setContext(next);
    }, 0);
  }

  return (
    <div onClickCapture={handleClickCapture} onInputCapture={handleInputCapture}>
      {enabled && context?.hasQuestion && strategy && context.step >= 3 && context.step <= 5 && (
        <section className={`readingCoach ${strategy.procedureOnly ? "readingCoachSimulation" : strategy.dimension.colorClass}`} aria-label="Stratégie de réponse guidée">
          <div className="readingCoachHeader">
            <div>
              <p className="eyebrow">Lecture guidée</p>
              <h2>Comprendre → Trouver → Répondre</h2>
              <p><b>{context.questionNumber}</b> — {context.prompt}</p>
            </div>
            <div className="readingCoachBadges">
              <span className="badge">{strategy.procedureOnly ? "Procédure seulement" : strategy.dimension.label}</span>
              {!strategy.procedureOnly && <span className="badge">{strategy.questionTypeLabel}</span>}
              <span className="badge">Au moins {strategy.minimumExpectedElements} élément{strategy.minimumExpectedElements > 1 ? "s" : ""}</span>
              <span className={`badge ${strategy.needsEvidence && !evidenceSaved ? "yellow" : "green"}`}>
                {!strategy.needsEvidence ? "Appui facultatif" : evidenceSaved ? "Appui du texte enregistré" : "Appui du texte requis"}
              </span>
            </div>
          </div>

          {notice && <div className="statusBox errorBox" role="alert"><b>{notice}</b></div>}

          <div className="readingCoachPhases">
            {PHASE_ORDER.map((phase, index) => {
              const item = strategy.phases[phase];
              const isActive = activePhase === phase;
              const isDone = Boolean(record.completed?.[phase]);
              return (
                <article className={`readingCoachPhase ${isActive ? "readingCoachPhaseActive" : ""} ${isDone ? "readingCoachPhaseDone" : ""}`} key={phase}>
                  <p className="readingCoachNumber">{index + 1}</p>
                  <h3>{item.title}</h3>
                  <p>{item.short}</p>
                  {isActive && expanded && <ul>{item.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}
                  <button type="button" onClick={() => toggleCompleted(phase)}>{isDone ? "Étape faite" : "Marquer comme fait"}</button>
                </article>
              );
            })}
          </div>

          <div className="readingCoachFooter">
            <div>
              {strategy.procedureOnly ? (
                <p><b>Mode simulation :</b> aucune réponse ni aucun indice de contenu n’est fourni. Seule la démarche et les exigences de forme sont rappelées.</p>
              ) : (
                <>
                  <p><b>Mot-question :</b> {strategy.questionWord} — {strategy.questionWordHelp}</p>
                  <p><b>Type de réponse :</b> {strategy.questionTypeLabel}.</p>
                  <p><b>Outil conseillé :</b> {strategy.recommendedProofLabel}.</p>
                  <p><b>Niveau :</b> {strategy.levelLabel}. {strategy.needsJustification ? "Une justification est attendue." : "Une réponse directe et complète est attendue."}</p>
                </>
              )}
            </div>
            <div className="readingCoachActions">
              <button type="button" onClick={() => setExpanded(!expanded)}>{expanded ? "Masquer l’aide détaillée" : "Afficher l’aide de cette étape"}</button>
              {strategy.needsEvidence && !evidenceSaved && <button type="button" className="yellow" onClick={goToFindStep}>Aller à l’étape 4 — Trouver</button>}
              {activePhase === "respond" && <button type="button" className="green" onClick={focusAnswer}>Retourner à ma réponse</button>}
            </div>
          </div>

          {activePhase === "respond" && (
            <details className="readingCoachChecklist">
              <summary><b>Vérifier ma réponse</b></summary>
              {strategy.checklist.map((item) => <p key={item}>☐ {item}</p>)}
            </details>
          )}
        </section>
      )}
      {children}
    </div>
  );
}
