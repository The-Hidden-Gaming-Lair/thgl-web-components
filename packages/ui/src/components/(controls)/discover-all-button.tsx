"use client";

import { useMemo, useState } from "react";
import { getSpawnDiscoveryId, useSettingsStore } from "@repo/lib";
import { useCoordinates } from "../(providers)";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

/**
 * Bulk discover/undiscover for every plotted spawn of the given filter
 * type(s). Complete-then-toggle: while any spawn is undiscovered the button
 * completes the set; once all are discovered it clears them (same semantics
 * as the cluster tooltip's "Discover All"). Always rendered; disabled at 0/0
 * when the types have no plotted spawns on the current map (live-only
 * filters, or the filter's spawns live on another map).
 *
 * When the action would touch existing discovered state, an AlertDialog asks
 * for approval first. Mounting the modal dialog inside the popover is safe:
 * its overlay disables outside-pointerdown dismissal for the layers below it,
 * so the popover stays open (and this component mounted) while it's shown.
 *
 * Public feature (was Elite-Supporter/Preview-Release gated — now open to all).
 */
export function DiscoverAllButton({ filterIds }: { filterIds: string[] }) {
  const { nodes } = useCoordinates();
  // Subscribe so label + badge update reactively (mirrors ClusterTooltip).
  const discoveredNodes = useSettingsStore((s) => s.discoveredNodes);
  const isDiscoveredNode = useSettingsStore((s) => s.isDiscoveredNode);
  const setDiscoveredNodesBulk = useSettingsStore(
    (s) => s.setDiscoveredNodesBulk,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const spawnIds = useMemo(
    () =>
      nodes
        .filter((node) => filterIds.includes(node.type))
        .flatMap((node) =>
          node.spawns.map((spawn) => getSpawnDiscoveryId(node.type, spawn)),
        ),
    [nodes, filterIds],
  );

  const discoveredCount = useMemo(
    () => spawnIds.filter((id) => isDiscoveredNode(id)).length,
    [spawnIds, discoveredNodes, isDiscoveredNode],
  );

  const noSpawns = spawnIds.length === 0;
  const allDiscovered = !noSpawns && discoveredCount === spawnIds.length;
  const actionLabel = allDiscovered ? "Undiscover all" : "Discover all";

  const applyBulk = () => setDiscoveredNodesBulk(spawnIds, !allDiscovered);

  const handleClick = () => {
    // Nothing discovered yet → nothing to override, apply directly. Otherwise
    // ask for approval first.
    if (discoveredCount === 0) {
      applyBulk();
      return;
    }
    setConfirmOpen(true);
  };

  const button = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full justify-between text-xs h-7"
      disabled={noSpawns}
      onClick={handleClick}
    >
      <span className="flex items-center gap-1">{actionLabel}</span>
      <span className="text-muted-foreground tabular-nums">
        {discoveredCount}/{spawnIds.length}
      </span>
    </Button>
  );

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Discovered</Label>
      {button}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {allDiscovered
                ? `Undiscover all ${spawnIds.length} spots?`
                : `Discover ${spawnIds.length - discoveredCount} remaining spots?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {allDiscovered
                ? "This clears every discovered spot of this selection — including ones you marked manually or that were auto-discovered."
                : `${discoveredCount} of ${spawnIds.length} are already discovered and will be merged in — undiscovering later clears those too.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={applyBulk}>
              {actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
