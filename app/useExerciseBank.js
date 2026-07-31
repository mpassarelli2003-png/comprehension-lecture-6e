"use client";

import { useEffect, useMemo, useState } from "react";
import baseExercises from "./data/exercises";
import moreExercises from "./data/moreExercises";
import genesisExercise from "./data/genesisExercise";
import secondaryExercises from "./data/secondaryExercises";
import {
  LOCAL_EXERCISE_EVENT,
  LOCAL_EXERCISE_STORE_KEY,
  buildRuntimeExerciseBank,
  createEmptyLocalExerciseStore,
  normalizeLocalExerciseStore
} from "../lib/localExerciseWorkshop";

function unique(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export const STATIC_EXERCISES = unique([
  ...baseExercises,
  ...moreExercises,
  genesisExercise,
  ...secondaryExercises
]);

export function loadLocalExerciseStore() {
  if (typeof window === "undefined") return createEmptyLocalExerciseStore();
  try {
    return normalizeLocalExerciseStore(JSON.parse(localStorage.getItem(LOCAL_EXERCISE_STORE_KEY) || "null"));
  } catch {
    return createEmptyLocalExerciseStore();
  }
}

export function saveLocalExerciseStore(store) {
  if (typeof window === "undefined") return;
  const safe = normalizeLocalExerciseStore(store);
  localStorage.setItem(LOCAL_EXERCISE_STORE_KEY, JSON.stringify(safe));
  window.dispatchEvent(new CustomEvent(LOCAL_EXERCISE_EVENT, { detail: safe }));
}

export function useExerciseBank({ includeDrafts = false } = {}) {
  const [store, setStore] = useState(createEmptyLocalExerciseStore());

  useEffect(() => {
    const refresh = (event) => {
      if (event?.detail) setStore(normalizeLocalExerciseStore(event.detail));
      else setStore(loadLocalExerciseStore());
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(LOCAL_EXERCISE_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(LOCAL_EXERCISE_EVENT, refresh);
    };
  }, []);

  const exercises = useMemo(
    () => buildRuntimeExerciseBank(STATIC_EXERCISES, store, { includeDrafts }),
    [store, includeDrafts]
  );

  return { exercises, store, setStore };
}
