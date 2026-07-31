import moreExercises from "../app/data/moreExercises.js";
import secondaryExercises from "../app/data/secondaryExercises.js";

export const CALIBRATED_BANK_VERSION = "1.1";
export const LOCAL_EXERCISE_STORE_KEY = "lecture_local_exercise_workshop_v1";

function appendUnique(target, source) {
  if (!Array.isArray(target) || !Array.isArray(source)) return target;
  const ids = new Set(target.map((exercise) => String(exercise?.id || "")));
  for (const exercise of source) {
    if (exercise?.id && !ids.has(exercise.id)) {
      target.push(exercise);
      ids.add(exercise.id);
    }
  }
  return target;
}

export function registerCalibratedExercises(target = moreExercises) {
  return appendUnique(target, secondaryExercises);
}

export function readPublishedLocalExercises() {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_EXERCISE_STORE_KEY) || "null");
    const entries = Array.isArray(value?.entries) ? value.entries : [];
    return entries
      .filter((entry) => entry?.status === "published" && entry?.exercise?.id)
      .map((entry) => entry.exercise);
  } catch {
    return [];
  }
}

export function registerPublishedLocalExercises(target = moreExercises) {
  return appendUnique(target, readPublishedLocalExercises());
}

registerCalibratedExercises();
registerPublishedLocalExercises();

export { secondaryExercises };
