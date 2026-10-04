"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  checklistStorageKey,
  parseChecklistProgress,
  serializeChecklistProgress,
  type ChecklistProgress,
} from "@repo/lib";

function read(game: string): ChecklistProgress {
  try {
    return parseChecklistProgress(
      window.localStorage.getItem(checklistStorageKey(game)),
    );
  } catch {
    return {};
  }
}

/** false when the browser refuses storage (private mode, blocked site data). */
function write(game: string, progress: ChecklistProgress): boolean {
  try {
    window.localStorage.setItem(
      checklistStorageKey(game),
      serializeChecklistProgress(progress),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Per-viewer checklist progress of one game (all sections), persisted in
 * localStorage and kept in sync across tabs. `loaded` is false during SSR and
 * the first client render, so pages render the unticked list identically on
 * server and client and fill the ticks in after hydration.
 */
export function useChecklistProgress(game: string) {
  const [progress, setProgress] = useState<ChecklistProgress>({});
  const [loaded, setLoaded] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const ref = useRef<ChecklistProgress>({});

  useEffect(() => {
    const initial = read(game);
    ref.current = initial;
    setProgress(initial);
    setLoaded(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== checklistStorageKey(game)) return;
      const next = parseChecklistProgress(e.newValue);
      ref.current = next;
      setProgress(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [game]);

  const update = useCallback(
    (fn: (prev: ChecklistProgress) => ChecklistProgress) => {
      const next = fn(ref.current);
      ref.current = next;
      setProgress(next);
      setStorageOk(write(game, next));
    },
    [game],
  );

  return { progress, loaded, update, storageOk };
}
