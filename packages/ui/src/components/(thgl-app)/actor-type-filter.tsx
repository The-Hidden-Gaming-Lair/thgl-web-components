"use client";

import { updateActorTypeFilters } from "@repo/lib/thgl-app";
import { useEffect, useMemo } from "react";
import { useUserStore } from "../(providers)";

// Matches no actor class. Sent when no filter is enabled, because an EMPTY types
// array means "all actors" to the native reader — the opposite of intent (and for
// games with per-instance foliage like Conan Exiles, "all" is ~85k reads per poll).
const NONE_SENTINEL = "__none__";

export function ActorTypeFilter({
  typesIdMap,
}: {
  typesIdMap: Record<string, string>;
}) {
  const filters = useUserStore((state) => state.filters);

  // Only request types whose mapped filter value is currently enabled — the
  // native reader skips everything else before touching game memory, so
  // disabling a filter genuinely stops its memory reads and payload cost.
  const types = useMemo(() => {
    const enabled = new Set(filters);
    const result = Object.keys(typesIdMap).filter((key) =>
      enabled.has(typesIdMap[key]),
    );
    return result.length > 0 ? result : [NONE_SENTINEL];
  }, [typesIdMap, filters]);

  useEffect(() => {
    // Only send native IPC updates when running inside the native desktop app host
    if (typeof window === "undefined" || !window.chrome?.webview) {
      return;
    }
    // Debounced: toggling a filter group fires many store updates back-to-back,
    // and every native update invalidates the reader's scan cache.
    const timeout = setTimeout(() => {
      updateActorTypeFilters(types)
        .then(() => {
          console.log("Actor type filter updated with", types.length, "types");
        })
        .catch((error) => {
          console.error("Failed to update actor type filter:", error);
        });
    }, 500);
    return () => clearTimeout(timeout);
  }, [types]);

  return null;
}
