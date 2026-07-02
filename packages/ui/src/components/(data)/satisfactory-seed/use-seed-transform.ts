"use client";
import { getAppUrl } from "@repo/lib";
import { useEffect } from "react";
import useSWRImmutable from "swr/immutable";
import { useMapStore } from "../../(interactive-map)/store";
import { useStaticNodesTransformStore } from "../../(providers)/static-nodes-transform-store";
import { useSatisfactorySeedStore } from "./store";
import { applySeedToStaticNodes } from "./transform";
import type { World } from "./types";

const APP_NAME = "satisfactory";

/**
 * Loads the base-world node dataset and, whenever a seed is enabled, installs a
 * static-nodes transform that swaps the default resource/well markers for the
 * seed-adjusted distribution. Side-effecting; call it from the always-mounted
 * seed panel. Returns the base world so the panel can render a summary.
 */
export function useSatisfactorySeedTransform(): {
  base: World | undefined;
  isLoading: boolean;
} {
  const { data: base, isLoading } = useSWRImmutable<World>(
    ["satisfactory-base-nodes"],
    () =>
      fetch(getAppUrl(APP_NAME, "/world/base-nodes.json")).then(
        (r) => r.json() as Promise<World>,
      ),
  );

  const enabled = useSatisfactorySeedStore((s) => s.enabled);
  const seed = useSatisfactorySeedStore((s) => s.seed);
  const mode = useSatisfactorySeedStore((s) => s.mode);
  const purity = useSatisfactorySeedStore((s) => s.purity);
  const setTransform = useStaticNodesTransformStore((s) => s.setTransform);
  const mapName = useMapStore((s) => s.map?.mapName) ?? "world";

  useEffect(() => {
    if (!enabled || !base) {
      setTransform(null);
      return;
    }
    setTransform((nodes) =>
      applySeedToStaticNodes(nodes, base, { seed, mode, purity }, mapName),
    );
    return () => setTransform(null);
  }, [enabled, base, seed, mode, purity, mapName, setTransform]);

  return { base, isLoading };
}
