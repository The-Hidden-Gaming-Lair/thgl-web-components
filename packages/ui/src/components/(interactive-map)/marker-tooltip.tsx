import { API_FORGE_URL, useGameState, useSettingsStore, cn } from "@repo/lib";
import { useMemo } from "react";
import { useT } from "../(providers)";
import { DescriptionMarkdown } from "./description-markdown";
import { AdditionalTooltip, AdditionalTooltipType } from "../(content)";
import { Comment } from "../(data)";
import {
  Copy,
  Eye,
  EyeOff,
  MessageCircle,
  Navigation,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../(controls)";
import useSWR from "swr";
import { toast } from "sonner";

export type TooltipItem = {
  id: string;
  termId: string;
  /** Pre-resolved literal label — shown verbatim instead of translating termId. */
  label?: string;
  description?: string;
  type: string;
  group?: string;
  isPrivate?: boolean;
  isLive?: boolean;
  data?: Record<string, string[]>;
  /** Original spawn position — used for unique discovery IDs in clusters */
  p?: [number, number] | [number, number, number];
};

export type TooltipItems = TooltipItem[];

function getDiscoveryId(
  item: TooltipItem,
  latLng: [number, number] | [number, number, number],
): string {
  if (item.id?.includes("@")) return item.id;
  // Always prefer item's own position — latLng is the cluster parent's position
  // which may differ from the child's actual coordinates
  const pos = item.p ?? latLng;
  return `${item.id || item.type}@${pos[0]}:${pos[1]}`;
}

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

function parseItemCoords(
  itemId: string,
  fallback: [number, number] | [number, number, number],
): [number, number] | [number, number, number] {
  const atIndex = itemId.indexOf("@");
  if (atIndex === -1) return fallback;
  const coordPart = itemId.slice(atIndex + 1);
  const parts = coordPart.split(":");
  if (parts.length < 2) return fallback;
  const x = parseFloat(parts[0]);
  const y = parseFloat(parts[1]);
  if (isNaN(x) || isNaN(y)) return fallback;
  if (parts.length >= 3) {
    const z = parseFloat(parts[2]);
    if (!isNaN(z)) return [x, y, z];
  }
  if (fallback.length === 3) return [x, y, fallback[2]];
  return [x, y];
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

function DiscoveryToggle({
  id,
  compact,
  overrideState,
  onToggle,
}: {
  id: string;
  compact?: boolean;
  /** Override the discovered state (for "discover all" button) */
  overrideState?: boolean;
  /** Custom toggle handler (for "discover all" button) */
  onToggle?: () => void;
}) {
  // Subscribe to discovery state changes so the toggle updates reactively
  useSettingsStore((state) => state.discoveredNodes);
  useSettingsStore((state) => state.autoDiscoveredNodes);
  const storeIsDiscovered = useSettingsStore((state) => state.isDiscoveredNode)(
    id,
  );
  const storeToggle = useSettingsStore((state) => state.toggleDiscoveredNode);
  const isAutoDiscoveredNode = useSettingsStore(
    (state) => state.isAutoDiscoveredNode,
  );
  const isDiscovered = overrideState ?? storeIsDiscovered;
  // Auto-discovered = marked from live memory (collected in-game) rather than by
  // the user. Only meaningful when there's no override (the discover-all button).
  const isAutoDiscovered =
    overrideState === undefined && isDiscovered && isAutoDiscoveredNode(id);
  const handleToggle = onToggle ?? (() => storeToggle(id));

  return (
    <span className="relative inline-flex shrink-0">
      <Tooltip delayDuration={400}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "shrink-0 rounded transition-colors",
              compact ? "h-5 w-5 p-0.5" : "h-6 w-6 p-1",
              isDiscovered
                ? "bg-primary/20 text-primary hover:bg-primary/30"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggle();
            }}
          >
            {isDiscovered ? (
              <Eye className="w-full h-full" />
            ) : (
              <EyeOff className="w-full h-full" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px] text-xs">
          {isAutoDiscovered ? (
            <>
              <p>Auto-discovered — collected in-game</p>
              <p className="text-muted-foreground mt-0.5">
                Detected from game memory. Right-click to override, or turn off
                auto-discovery in settings.
              </p>
            </>
          ) : (
            <>
              <p>
                {isDiscovered ? "Mark as undiscovered" : "Mark as discovered"}
              </p>
              <p className="text-muted-foreground mt-0.5">
                Right-click to toggle. Discovered nodes can be hidden in
                settings.
              </p>
            </>
          )}
        </TooltipContent>
      </Tooltip>
      {isAutoDiscovered && (
        <Sparkles
          className="pointer-events-none absolute -right-1 -top-1 h-3 w-3 text-primary"
          aria-label="Auto-discovered"
        />
      )}
    </span>
  );
}

function Description({ desc }: { desc: string }) {
  return (
    <div
      className="text-xs text-popover-foreground/90 leading-snug max-h-[120px] overflow-y-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "hsl(var(--ring) / 0.5) transparent",
      }}
    >
      <DescriptionMarkdown>{desc}</DescriptionMarkdown>
    </div>
  );
}

function PrivateNodeActions({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) {
  const setTempPrivateNode = useSettingsStore(
    (state) => state.setTempPrivateNode,
  );
  const removeMyNode = useSettingsStore((state) => state.removeMyNode);

  return (
    <div className="flex items-center gap-1.5 pt-1">
      <Button
        size="sm"
        variant="outline"
        className="h-6 text-xs px-2 gap-1"
        onClick={(e) => {
          e.stopPropagation();
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
          onClose?.();
        }}
      >
        <Pencil className="w-3 h-3" />
        Edit
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="h-6 text-xs px-2 gap-1"
        onClick={(e) => {
          e.stopPropagation();
          removeMyNode(id.split("@")[0]);
          onClose?.();
        }}
      >
        <Trash2 className="w-3 h-3" />
        Delete
      </Button>
    </div>
  );
}

function SingleItemTooltip({
  appName,
  item,
  latLng,
  distance,
  additionalTooltip,
  hideDiscovered,
  hideComments,
  coordinateCopyFormat,
  onClick,
  onClose,
}: {
  appName: string;
  item: TooltipItem;
  latLng: [number, number] | [number, number, number];
  distance?: number;
  additionalTooltip?: AdditionalTooltipType;
  hideDiscovered?: boolean;
  hideComments?: boolean;
  coordinateCopyFormat?: string;
  onClick?: () => void;
  onClose?: () => void;
}) {
  const t = useT();
  // Private nodes use the user-supplied raw name as termId — don't run it
  // through translation (which would return the filter-name fallback when
  // the user-supplied string isn't a known key).
  const name = item.label
    ? item.label
    : item.isPrivate
      ? item.termId
      : t(item.termId, { fallback: item.type }) || item.termId;
  const typeName = t(item.type, { fallback: item.type });
  const groupName = item.group ? t(item.group, { fallback: item.group }) : null;
  const itemCoords = useMemo(
    () => parseItemCoords(item.id, latLng),
    [item.id, latLng],
  );

  const { data: comments } = useSWR(
    `/comments/${item.id}`,
    !item.isPrivate && !item.isLive && !hideComments
      ? async () => {
          const res = await fetch(
            `${API_FORGE_URL}/comments?node_id=${item.id}&app_id=${appName}`,
          );
          if (!res.ok) throw new Error("Failed to fetch comments");
          return ((await res.json()) as { comments: Comment[] }).comments;
        }
      : null,
  );

  // Build description
  const desc = useMemo(() => {
    if (item.description) return item.description.replace("\n", "<br>");
    const vars: Record<string, string> | undefined = item.data
      ? Object.fromEntries(
          Object.entries(item.data).map(([key, values]) => [
            key,
            values?.[0] ?? "",
          ]),
        )
      : undefined;
    return t(item.termId, { isDesc: true, fallback: item.type, vars });
  }, [item, t]);

  return (
    <article
      className={cn("space-y-1.5", !item.isLive && "cursor-pointer")}
      onClick={onClick}
      onMouseMove={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Row 1: Name + discovery toggle */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold leading-tight truncate grow">
          {name}
        </h3>
        {!hideDiscovered && !item.isLive && (
          <DiscoveryToggle id={getDiscoveryId(item, latLng)} />
        )}
      </div>

      {/* Row 2: Type badge + distance + comments */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {item.type && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium leading-none shrink-0">
            {typeName}
          </span>
        )}
        {groupName && <span className="truncate opacity-60">{groupName}</span>}
        <div className="grow" />
        {distance != null && (
          <span className="inline-flex items-center gap-0.5 shrink-0">
            <Navigation className="w-3 h-3" />
            {distance.toFixed(0)}
          </span>
        )}
        {!hideComments && !item.isPrivate && (
          <span className="inline-flex items-center gap-0.5 shrink-0">
            <MessageCircle className="w-3 h-3" />
            {comments?.length ?? 0}
          </span>
        )}
      </div>

      {/* Row 3: Coordinates with copy */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className="truncate">
          {formatCoordinates(itemCoords, coordinateCopyFormat)}
        </span>
        <button
          type="button"
          className="shrink-0 h-4 w-4 p-0.5 rounded hover:bg-muted hover:text-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(
              formatCoordinates(itemCoords, coordinateCopyFormat),
            );
            toast("Copied to clipboard");
          }}
        >
          <Copy className="w-full h-full" />
        </button>
      </div>

      {/* Optional game-specific data */}
      {additionalTooltip && (
        <div className="text-xs text-muted-foreground">
          <AdditionalTooltip items={additionalTooltip} latLng={latLng} />
        </div>
      )}

      {/* Description */}
      {desc && desc !== item.type && <Description desc={desc} />}

      {/* Private node actions */}
      {item.isPrivate && (
        <PrivateNodeActions
          id={getDiscoveryId(item, latLng)}
          onClose={onClose}
        />
      )}
    </article>
  );
}

function ClusterTooltip({
  items,
  latLng,
  hideDiscovered,
  onClick,
}: {
  items: TooltipItems;
  latLng: [number, number] | [number, number, number];
  hideDiscovered?: boolean;
  onClick?: (id: string) => void;
}) {
  const t = useT();
  // Subscribe to discoveredNodes changes so count updates reactively
  const discoveredNodes = useSettingsStore((state) => state.discoveredNodes);
  const isDiscoveredNode = useSettingsStore((state) => state.isDiscoveredNode);
  const setDiscoverNode = useSettingsStore((state) => state.setDiscoverNode);

  const typeName = t(items[0].type, { fallback: items[0].type });

  const itemIds = useMemo(
    () => items.map((item) => getDiscoveryId(item, latLng)),
    [items, latLng],
  );
  const discoveredCount = useMemo(
    () => itemIds.filter((id) => isDiscoveredNode(id)).length,
    [itemIds, discoveredNodes, isDiscoveredNode],
  );
  const allDiscovered = discoveredCount === items.length;

  // Build shared description (use first item's)
  const desc = useMemo(() => {
    const item = items[0];
    if (item.description) return item.description.replace("\n", "<br>");
    const vars: Record<string, string> | undefined = item.data
      ? Object.fromEntries(
          Object.entries(item.data).map(([key, values]) => [
            key,
            values?.[0] ?? "",
          ]),
        )
      : undefined;
    return t(item.termId, { isDesc: true, fallback: item.type, vars });
  }, [items, t]);

  const toggleAll = () => {
    const target = !allDiscovered;
    for (const id of itemIds) {
      if (isDiscoveredNode(id) !== target) {
        setDiscoverNode(id, target);
      }
    }
  };

  // Clamp item list height: show ~6 items then scroll
  const needsScroll = items.length > 6;

  return (
    <div
      className="space-y-1.5"
      onMouseMove={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Header: "3x Iron Ore" + discover all toggle + count */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold leading-tight truncate grow">
          {items.length}x {typeName}
        </h3>
        {!hideDiscovered && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground">
              {discoveredCount}/{items.length}
            </span>
            <DiscoveryToggle
              id="__cluster_all"
              compact
              overrideState={allDiscovered}
              onToggle={toggleAll}
            />
          </div>
        )}
      </div>

      {/* Description (shared across same-type cluster) */}
      {desc && desc !== items[0].type && (
        <div className="text-xs text-popover-foreground/90 leading-snug line-clamp-2">
          <DescriptionMarkdown>{desc}</DescriptionMarkdown>
        </div>
      )}

      {/* Item list */}
      <div className={cn(needsScroll && "h-[150px]")}>
        <ScrollArea className={cn(needsScroll && "h-full")} type="auto">
          <div className="space-y-0.5 pr-2">
            {items.map((item, i) => {
              const discoveryId = itemIds[i];
              const name = item.isPrivate
                ? item.termId
                : t(item.termId, { fallback: item.type }) || item.termId;

              return (
                <div
                  key={item.id ?? i}
                  className="flex items-center gap-2 py-0.5 px-1 -mx-1 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.(discoveryId);
                  }}
                >
                  <span className="text-xs truncate grow">{name}</span>
                  {!hideDiscovered && !item.isLive && (
                    <DiscoveryToggle id={discoveryId} compact />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export function MarkerTooltip({
  appName,
  latLng,
  items,
  onClick,
  onClose,
  hideDiscovered,
  hideComments,
  additionalTooltip,
  coordinateCopyFormat,
}: {
  appName: string;
  latLng: [number, number] | [number, number, number];
  items: TooltipItems;
  onClose: () => void;
  onClick?: (id: string) => void;
  hideDiscovered?: boolean;
  hideComments?: boolean;
  additionalTooltip?: AdditionalTooltipType;
  coordinateCopyFormat?: string;
}) {
  // Throttled player: the distance readout only needs ~1Hz, and an open tooltip
  // subscribing to the raw player re-rendered 16×/s while moving.
  const player = useGameState((state) => state.throttledPlayer);
  const distance = useMemo(
    () =>
      player
        ? Math.sqrt(
            Math.pow(player.x - latLng[0], 2) +
              Math.pow(player.y - latLng[1], 2) +
              Math.pow(
                player.z - (latLng.length === 3 ? latLng[2] : player.z),
                2,
              ),
          )
        : undefined,
    [player, latLng],
  );

  // Cluster: multiple items
  if (items.length > 1) {
    return (
      <ClusterTooltip
        items={items}
        latLng={latLng}
        hideDiscovered={hideDiscovered}
        onClick={onClick}
      />
    );
  }

  // Single item
  const item = items[0];
  return (
    <SingleItemTooltip
      appName={appName}
      item={item}
      latLng={latLng}
      distance={distance}
      additionalTooltip={additionalTooltip}
      hideDiscovered={hideDiscovered}
      hideComments={hideComments}
      coordinateCopyFormat={coordinateCopyFormat}
      onClick={() => {
        if (item.isLive) return;
        onClick?.(getDiscoveryId(item, latLng));
      }}
      onClose={onClose}
    />
  );
}
