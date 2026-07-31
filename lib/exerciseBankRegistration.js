import moreExercises from "../app/data/moreExercises.js";
import secondaryExercises from "../app/data/secondaryExercises.js";

export const CALIBRATED_BANK_VERSION = "1.0";

export function registerCalibratedExercises(target = moreExercises) {
  if (!Array.isArray(target)) return target;
  const ids = new Set(target.map((exercise) => String(exercise?.id || "")));
  for (const exercise of secondaryExercises) {
    if (!ids.has(exercise.id)) {
      target.push(exercise);
      ids.add(exercise.id);
    }
  }
  return target;
}

registerCalibratedExercises();

export { secondaryExercises };
