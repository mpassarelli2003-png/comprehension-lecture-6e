"use client";

function normalize(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

export default function VoiceHelpNavSync() {
  function saveCurrentContext() {
    if (typeof window === "undefined") return;

    const headings = Array.from(document.querySelectorAll("h1, h2"))
      .map((el) => normalize(el.textContent))
      .filter(Boolean);

    const possibleExerciseTitle = headings.find((text) =>
      !text.includes("Lecture 6e") &&
      !text.includes("Choisir une lecture") &&
      !text.includes("Espace enseignant") &&
      !text.includes("Mes progrès") &&
      !text.includes("Étape") &&
      !text.includes("Aide vocale")
    );

    const possibleQuestion = headings.find((text) =>
      text.endsWith("?") ||
      text.includes("Explique") ||
      text.includes("Commente") ||
      text.includes("Justifie")
    );

    if (possibleExerciseTitle) {
      localStorage.setItem("lectureCurrentExerciseTitle", possibleExerciseTitle);
    }
    if (possibleQuestion) {
      localStorage.setItem("lectureCurrentQuestionPrompt", possibleQuestion);
    }
  }

  if (typeof window !== "undefined") {
    window.__saveLectureContextForVoiceHelp = saveCurrentContext;
  }

  return null;
}
