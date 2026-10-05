import { useSettingsStore } from "@repo/lib";
import { toast } from "sonner";
import type { useT } from "../(providers)";

/**
 * Clears every discovered node of the active game, with an Undo action on the
 * toast, so a stray click on the settings Reset button doesn't cost the user
 * their progress.
 */
export function resetDiscoveredNodes(t: ReturnType<typeof useT>): void {
  const { discoveredNodes, setDiscoveredNodes } = useSettingsStore.getState();
  if (discoveredNodes.length === 0) {
    toast(
      t("discovered.nothingToReset", {
        fallback: "No discovered nodes to reset",
      }),
      { duration: 2000, id: "reset-discovered" },
    );
    return;
  }
  const previous = discoveredNodes;
  setDiscoveredNodes([]);
  toast.warning(
    t("discovered.resetDone", { fallback: "Discovered nodes reset" }),
    {
      id: "reset-discovered",
      duration: 6000,
      action: {
        label: t("common.undo", { fallback: "Undo" }),
        // Keep anything discovered since the reset.
        onClick: () => {
          const current = useSettingsStore.getState().discoveredNodes;
          setDiscoveredNodes([...new Set([...previous, ...current])]);
        },
      },
    },
  );
}
