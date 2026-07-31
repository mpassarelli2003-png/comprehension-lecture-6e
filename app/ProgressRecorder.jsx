"use client";

import { usePathname } from "next/navigation";
import baseExercises from "./data/exercises";
import moreExercises from "./data/moreExercises";
import genesisExercise from "./data/genesisExercise";
import AdminProgressSummary from "./admin/AdminProgressSummary";
import { evaluateExerciseSubmission, evaluateReadingAnswer } from "../lib/formativeFeedback";
import { normalizeExerciseQuestions } from "../lib/questionClassification";
import { progressRecordFromFeedback, writeProgressRecord } from "../lib/progressTracking";
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

function currentStep() {
  const active = document.querySelector(".stepNavigation button.blue");
  return Number(textOf(active).match(/^(\d+)/)?.[1] || 0);
}

function targetStep(button) {
  if (!button.closest(".stepNavigation")) return 0;
  return Number(textOf(button).match(/^(\d+)/)?.[1] || 0);
}

function parseCurrentQuestion() {
  if (typeof document === "undefined") return null;
  const badges = Array.from(document.querySelectorAll(".statusBadges .badge")).map(textOf);
  const levelId = detectStrategyLevel(badges[0] || "6e année");
  const modeId = detectStrategyMode(badges.join(" "));
  const columns = Array.from(document.querySelectorAll("main .grid.cols > section.card"));
  const exerciseTitle = textOf(columns[0]?.querySelector("h1"));
  const exercise = exercises.find((item) => item.title === exerciseTitle);
  const questionCard = Array.from(columns[1]?.querySelectorAll(".card") || [])
    .find((element) => /Question\s+\d+\s*\/\s*\d+/i.test(textOf(element)));
  if (!exercise || !questionCard) return null;

  const numberText = textOf(questionCard.querySelector("b"));
  const match = numberText.match(/Question\s+(\d+)\s*\/\s*(\d+)/i);
  const questionOrder = Math.max(1, Number(match?.[1] || 1));
  const question = exercise.questions[questionOrder - 1];
  if (!question) return null;

  const work = loadStudentWork();
  const textarea = columns[1]?.querySelector("textarea");
  const answer = textarea?.value ?? work?.answers?.[question.id] ?? "";
  return {
    levelId,
    modeId,
    exercise,
    question,
    questionOrder,
    answer,
    work,
    evidence: {
      proofs: Array.isArray(work?.proofs) ? work.proofs : [],
      exerciseId: work?.exerciseId || "",
      modeId: work?.learningMode || ""
    }
  };
}

function recordCurrent(source = "check") {
  const context = parseCurrentQuestion();
  if (!context) return;
  const feedback = evaluateReadingAnswer(
    context.question,
    context.answer,
    context.evidence,
    {
      exerciseId: context.exercise.id,
      modeId: context.modeId,
      levelId: context.levelId
    }
  );
  writeProgressRecord(window.localStorage, progressRecordFromFeedback({
    feedback,
    exercise: context.exercise,
    question: context.question,
    questionOrder: context.questionOrder,
    levelId: context.levelId,
    modeId: context.modeId,
    source
  }));
}

function recordSubmission() {
  const context = parseCurrentQuestion();
  const work = loadStudentWork();
  const exercise = context?.exercise || exercises.find((item) => item.id === work?.exerciseId);
  if (!exercise || !work) return;
  const modeId = work.learningMode === "simulation" ? "simulation" : "training";
  const summary = evaluateExerciseSubmission(exercise, work, { modeId });
  summary.results.forEach((result, index) => {
    const question = exercise.questions[index];
    if (!question) return;
    writeProgressRecord(window.localStorage, {
      source: "submission",
      exerciseId: exercise.id,
      exerciseTitle: exercise.title,
      questionId: question.id,
      questionOrder: index + 1,
      dimension: question.dimension,
      questionType: question.questionType,
      levelId: question.targetLevel,
      modeId,
      status: result.status,
      missingCodes: result.missing.map((item) => item.code),
      canContinue: result.missing.length === 0,
      canSubmit: result.missing.length === 0
    });
  });
}

export default function ProgressRecorder({ children }) {
  const pathname = usePathname();

  function handleClickCapture(event) {
    if (pathname !== "/") return;
    const button = event.target.closest("button");
    if (!button) return;
    const label = textOf(button);

    if (button.closest(".formativeFeedback") && label === "Vérifier ma réponse") {
      window.setTimeout(() => recordCurrent("check"), 120);
      return;
    }

    if (label.includes("Remettre la simulation")) {
      recordSubmission();
      return;
    }

    if (label === "Question suivante") {
      recordCurrent("advance");
      return;
    }

    const current = currentStep();
    const target = targetStep(button);
    if (target > current && current >= 3 && target >= 5) recordCurrent("advance");
  }

  return (
    <div onClickCapture={handleClickCapture}>
      {children}
      {pathname === "/admin" && (
        <section className="page">
          <AdminProgressSummary />
        </section>
      )}
    </div>
  );
}
