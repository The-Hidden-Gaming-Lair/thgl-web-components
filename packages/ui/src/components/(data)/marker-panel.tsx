"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUserStore } from "../(providers)";
import { cn, useGameState, useSettingsStore } from "@repo/lib";
import { SidePanel } from "./side-panel";
import { useCoordinates, useT } from "../(providers)";
import { Separator } from "../ui/separator";
import { Button } from "../(controls)";
import { useMarkerUrlSync } from "./use-marker-url-sync";
import { Copy, Eye, EyeOff, Navigation, Pencil, Trash2, X } from "lucide-react";
import { AdditionalTooltip, AdditionalTooltipType } from "../(content)";
import { Comments } from "./comments";
import { DescriptionMarkdown } from "../(interactive-map)/description-markdown";
import { DbEntryLink } from "../(interactive-map)/db-entry-link";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

function formatCoordinates(
  coords: [number, number] | [number, number, number],
  format?: string,
): string {
  if (format) {
    return format
      .replace("{x}", coords[1].toFixed(0))
      .replace("{y}", coords[0].toFixed(0))
      .replace("{z}", coords[2]?.toFixed(0) ?? "");
  }
  return coords[2] !== undefined
    ? `${coords[1].toFixed(0)}, ${coords[0].toFixed(0)}, ${coords[2].toFixed(0)}`
    : `${coords[1].toFixed(0)}, ${coords[0].toFixed(0)}`;
}

function copyToClipboard(text: string): void {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

function DiscoveryToggle({ id }: { id: string }) {
  // Subscribe to discoveredNodes changes so the toggle updates reactively
  useSettingsStore((state) => state.discoveredNodes);
  const isDiscovered = useSettingsStore((state) => state.isDiscoveredNode)(id);
  const toggle = useSettingsStore((state) => state.toggleDiscoveredNode);

  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors w-full",
            isDiscovered
              ? "bg-primary/15 text-primary hover:bg-primary/25"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
          )}
          onClick={() => toggle(id)}
          onContextMenu={(e) => {
            e.preventDefault();
            toggle(id);
          }}
        >
          {isDiscovered ? (
            <Eye className="w-4 h-4 shrink-0" />
          ) : (
            <EyeOff className="w-4 h-4 shrink-0" />
          )}
          <span>{isDiscovered ? "Discovered" : "Not discovered"}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[200px] text-xs">
        <p>
          Right-click to toggle. Discovered nodes can be hidden in settings.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function PrivateNodeActions({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const setTempPrivateNode = useSettingsStore(
    (state) => state.setTempPrivateNode,
  );
  const removeMyNode = useSettingsStore((state) => state.removeMyNode);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="flex-1 gap-1.5"
        onClick={() => {
          const myFilter = useSettingsStore
            .getState()
            .myFilters.find((filter) =>
              filter.nodes?.some(
                (node) =>
                  `${node.id ?? filter.name}@${node.p[0]}:${node.p[1]}` === id,
              ),
            );
          const privateNode = myFilter?.nodes?.find(
            (node) =>
              `${node.id ?? myFilter.name}@${node.p[0]}:${node.p[1]}` === id,
          );
          if (!myFilter || !privateNode) return;
          setTempPrivateNode({
            ...privateNode,
            filter: myFilter.name,
          });
          onClose();
        }}
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="flex-1 gap-1.5"
        onClick={() => {
          removeMyNode(id.split("@")[0]);
          onClose();
        }}
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </Button>
    </div>
  );
}

export function MarkerPanel({
  appName,
  markerSlug,
  hideComments,
  additionalTooltip,
  coordinateCopyFormat,
  headerOffset = "54px",
}: {
  appName: string;
  markerSlug?: string;
  hideComments?: boolean;
  additionalTooltip?: AdditionalTooltipType;
  coordinateCopyFormat?: string;
  headerOffset?: string;
}) {
  useMarkerUrlSync(markerSlug);
  const t = useT();
  const { spawns, filters } = useCoordinates();
  const selectedNodeId = useUserStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useUserStore((state) => state.setSelectedNodeId);
  const player = useGameState((state) => state.player);

  // Track previous ID for slide animation
  const [visible, setVisible] = useState(false);
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedNodeId) {
      // Small delay for slide-in animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
    prevIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  // Find the spawn data
  const spawn = useMemo(() => {
    if (!selectedNodeId) return null;

    const matchId = (s: (typeof spawns)[number]) => {
      const spawnId = s.id?.includes("@")
        ? s.id
        : `${s.id || s.type}@${s.p[0]}:${s.p[1]}`;
      return spawnId === selectedNodeId;
    };

    // Pass 1: exact match on parent or cluster child in filtered spawns
    for (const s of spawns) {
      if (matchId(s)) return s;
      if (s.cluster) {
        for (const c of s.cluster) {
          if (matchId(c)) return c;
        }
      }
    }

    // Pass 2: match by id prefix (before @) — handles coordinate mismatch from clustering
    const atIdx = selectedNodeId.indexOf("@");
    if (atIdx > 0) {
      const idPart = selectedNodeId.slice(0, atIdx);
      for (const s of spawns) {
        const sid = s.id?.includes("@")
          ? s.id.slice(0, s.id.indexOf("@"))
          : s.id || s.type;
        if (sid === idPart) return s;
        if (s.cluster) {
          for (const c of s.cluster) {
            const cid = c.id?.includes("@")
              ? c.id.slice(0, c.id.indexOf("@"))
              : c.id || c.type;
            if (cid === idPart) return c;
          }
        }
      }
    }

    return null;
  }, [selectedNodeId, spawns]);

  const distance = useMemo(
    () =>
      player && spawn
        ? Math.sqrt(
            Math.pow(player.x - spawn.p[0], 2) +
              Math.pow(player.y - spawn.p[1], 2) +
              Math.pow(
                player.z - (spawn.p.length === 3 ? spawn.p[2] : player.z),
                2,
              ),
          )
        : undefined,
    [player, spawn],
  );

  const filter = spawn
    ? filters.find((f) => f.values.some((v) => v.id === spawn.type))
    : null;
  // Codex cross-link: when the marker's filter value declares a `dbSection`, the entry is keyed by
  // the spawn id (per-instance — landmarks) or the type id (per-type — a bestiary species).
  const dbValue = spawn
    ? filter?.values.find((v) => v.id === spawn.type)
    : undefined;
  const dbSection = dbValue?.dbSection;
  const dbEntryId = spawn ? (spawn.id ?? spawn.type) : "";

  const termId = spawn
    ? (spawn.name ?? spawn.id ?? spawn.type).replace(/my_\d+_/, "")
    : "";

  const nodeId = spawn
    ? spawn.id?.includes("@")
      ? spawn.id
      : `${spawn.id || spawn.type}@${spawn.p[0]}:${spawn.p[1]}`
    : "";

  const desc = useMemo(() => {
    if (!spawn) return "";
    if (spawn.description) return spawn.description.replace("\n", "<br>");
    if (termId) return t(termId, { isDesc: true, fallback: "" });
    return "";
  }, [spawn, termId, t]);

  const close = () => setSelectedNodeId(null);

  if (!selectedNodeId) return null;

  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0">
        <button
          type="button"
          aria-label="Close"
          className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          onClick={close}
        >
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold truncate grow">
          {spawn
            ? t(termId || spawn.type, { fallback: spawn.type })
            : "Loading..."}
        </h2>
        {spawn?.type && (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium leading-none shrink-0">
            {t(spawn.type, { fallback: spawn.type })}
          </span>
        )}
      </div>

      {spawn ? (
        <div
          className="flex-1 overflow-y-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "hsl(var(--ring) / 0.5) transparent",
          }}
        >
          <div className="p-3 space-y-3">
            {/* Metadata */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1">
                {formatCoordinates(spawn.p, coordinateCopyFormat)}
                <button
                  type="button"
                  aria-label="Copy coordinates"
                  className="h-4 w-4 p-0.5 rounded hover:bg-muted hover:text-foreground transition-colors"
                  onClick={() => {
                    copyToClipboard(
                      formatCoordinates(spawn.p, coordinateCopyFormat),
                    );
                    toast("Copied to clipboard");
                  }}
                >
                  <Copy className="w-full h-full" />
                </button>
              </span>
              {distance != null && (
                <>
                  <span className="opacity-30">|</span>
                  <span className="inline-flex items-center gap-0.5">
                    <Navigation className="w-3 h-3" />
                    {distance.toFixed(0)}
                  </span>
                </>
              )}
              {filter?.group && (
                <>
                  <span className="opacity-30">|</span>
                  <span>{t(filter.group, { fallback: filter.group })}</span>
                </>
              )}
            </div>

            {/* Additional game-specific data */}
            {additionalTooltip && (
              <div className="text-xs text-muted-foreground">
                <AdditionalTooltip items={additionalTooltip} latLng={spawn.p} />
              </div>
            )}

            {/* Description */}
            {desc && (
              <>
                <Separator />
                <div className="text-sm leading-relaxed">
                  <DescriptionMarkdown>{desc}</DescriptionMarkdown>
                </div>
              </>
            )}

            {/* Codex cross-link */}
            {dbSection && (
              <>
                <Separator />
                <DbEntryLink section={dbSection} entryId={dbEntryId} />
              </>
            )}

            {/* Discovery */}
            <Separator />
            <DiscoveryToggle id={nodeId} />

            {/* Private node actions */}
            {spawn.isPrivate && (
              <>
                <Separator />
                <PrivateNodeActions id={nodeId} onClose={close} />
              </>
            )}

            {/* Comments */}
            {!hideComments && !spawn.isPrivate && !spawn.address && (
              <>
                <Separator />
                <Comments id={nodeId} appName={appName} />
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 text-sm text-muted-foreground">Node not found</div>
      )}
    </>
  );

  return (
    <SidePanel visible={visible} onClose={close} headerOffset={headerOffset}>
      {panelContent}
    </SidePanel>
  );
}
