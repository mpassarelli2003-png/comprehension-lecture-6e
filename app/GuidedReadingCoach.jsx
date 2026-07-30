"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  READING_STRATEGY_STORAGE_KEY,
  buildReadingStrategy,
  detectStrategyLevel,
  detectStrategyMode,
  makeStrategyKey,
  phaseForStep
} from "../lib/readingStrategies";

const PHASE_ORDER = ["understand", "find", "respond"];

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
  const questionCard = Array.from(rightColumn?.querySelectorAll(".card") || []).find((element) => /Question\s+\d+\s*\/\s*\d+/i.test(textOf(element)));
  if (!questionCard) return { step, levelId, modeId, hasQuestion: false };

  const numberText = textOf(questionCard.querySelector("b")) || "Question";
  const countMatch = numberText.match(/Question\s+(\d+)\s*\/\s*(\d+)/i);
  const prompt = textOf(questionCard.querySelector("h2"));
  const meta = Array.from(questionCard.querySelectorAll("p")).map(textOf).find((value) => /point\(s\)|point/i.test(value)) || "comprendre — 1 point";
  const metaParts = meta.split(/\s+—\s+/);
  const type = metaParts[0] || "comprendre";
  const pointsMatch = meta.match(/(\d+)\s*point/i);
  const points = Number(pointsMatch?.[1] || 1);
  const exerciseTitle = textOf(columns[0]?.querySelector("h1")) || "Lecture";
  const proofSectionVisible = textOf(rightColumn).includes("Mes passages sauvegardés");
  const proofCount = Array.from(rightColumn?.querySelectorAll("button") || []).filter((button) => textOf(button).includes("Utiliser dans ma réponse")).length;
  const key = makeStrategyKey({ exerciseTitle, questionNumber: numberText, prompt, levelId, modeId });

  return {
    hasQuestion: true,
    key,
    step,
    levelId,
    modeId,
    exerciseTitle,
    questionNumber: numberText,
    questionIndex: Number(countMatch?.[1] || 1),
    totalQuestions: Number(countMatch?.[2] || 1),
    prompt,
    type,
    points,
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
        const signature = JSON.stringify(next);
        if (signature !== signatureRef.current) {
          signatureRef.current = signature;
          setContext(next);
          setExpanded(false);
          setNotice("");
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
    if (!context?.hasQuestion || !context.proofSectionVisible) return;
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
  }, [context?.key, context?.proofCount, context?.proofSectionVisible, context?.hasQuestion]);

  const record = context?.key ? records[context.key] || {} : {};
  const strategy = useMemo(() => {
    if (!context?.hasQuestion) return null;
    return buildReadingStrategy({
      prompt: context.prompt,
      type: context.type,
      points: context.points,
      levelId: context.levelId,
      modeId: context.modeId
    });
  }, [context]);
  const activePhase = phaseForStep(context?.step || 3);
  const evidenceSaved = Boolean(record.evidenceSaved || context?.proofCount > 0);

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
    const columns = Array.from(document.querySelectorAll("main .grid.cols > section.card"));
    columns[1]?.querySelector("textarea")?.focus();
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
      const title = textOf(document.querySelector("main .grid.cols > section.card h1")) || context?.exerciseTitle || "Lecture";
      const prefix = `${title}|Question`;
      const suffix = `|${context?.levelId || "6e"}|${context?.modeId || "simulation"}`;
      const withEvidence = Object.entries(records).filter(([key, value]) => key.startsWith(prefix) && key.endsWith(suffix) && value?.evidenceSaved).length;
      if (withEvidence < summary.total) {
        blockForMissingEvidence(event, `La remise est bloquée : ${summary.total - withEvidence} question(s) n’ont pas encore de passage ou de note du texte.`);
      }
      return;
    }

    if (!context?.hasQuestion || !strategy?.needsEvidence) return;

    if (label === "Question suivante" && !evidenceSaved) {
      blockForMissingEvidence(event, "Avant de passer à la question suivante, enregistre au moins un passage ou un indice du texte à l’étape 4 — Trouver.");
      return;
    }

    const nextStep = targetStep(button);
    if (nextStep >= 5 && nextStep > context.step && !evidenceSaved) {
      blockForMissingEvidence(event, "Avant de rédiger ou de remettre, passe par l’étape 4 et conserve au moins un appui du texte.");
    }
  }

  function handleInputCapture() {
    if (!enabled) return;
    window.setTimeout(() => {
      const next = parseQuestionContext();
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
              {!strategy.procedureOnly && <span className="badge">{strategy.dimension.nature}</span>}
              <span className={`badge ${evidenceSaved ? "green" : "yellow"}`}>{evidenceSaved ? "Appui du texte enregistré" : "Appui du texte requis"}</span>
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
                <p><b>Mode simulation :</b> aucune réponse ni aucun indice de contenu n’est fourni. Seule la démarche est rappelée.</p>
              ) : (
                <>
                  <p><b>Mot-question :</b> {strategy.questionWord} — {strategy.questionWordHelp}</p>
                  <p><b>Outil conseillé :</b> {strategy.recommendedProofLabel}.</p>
                  <p><b>Niveau :</b> {strategy.levelLabel}. {strategy.needsJustification ? "Une justification est attendue." : "Une réponse directe et complète est attendue."}</p>
                </>
              )}
            </div>
            <div className="readingCoachActions">
              <button type="button" onClick={() => setExpanded(!expanded)}>{expanded ? "Masquer l’aide détaillée" : "Afficher l’aide de cette étape"}</button>
              {!evidenceSaved && <button type="button" className="yellow" onClick={goToFindStep}>Aller à l’étape 4 — Trouver</button>}
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
