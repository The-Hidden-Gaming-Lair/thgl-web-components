"use client";

import { requestSetActorTypeFilter } from "@repo/lib/thgl-app";
import { useEffect } from "react";

export function ActorTypeFilter({
  typesIdMap,
}: {
  typesIdMap: Record<string, string>;
}) {
  useEffect(() => {
    const types = Object.keys(typesIdMap);
    if (types.length > 0) {
      // Send actor types to filter - will apply to all games
      requestSetActorTypeFilter(types)
        .then(() => {
          console.log("Actor type filter updated with", types.length, "types");
        })
        .catch((error) => {
          console.error("Failed to update actor type filter:", error);
        });
    }
  }, [typesIdMap]);

  return null;
}
