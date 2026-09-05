import { useMemo } from "react";
import { useT } from "../(providers)";
import { ScrollArea } from "../ui/scroll-area";
import Markdown from "markdown-to-jsx";
import { Separator } from "../ui/separator";
import { Discovery } from "./discovery";
import useSWR from "swr";
import { API_FORGE_URL, cn } from "@repo/lib";
import { Comment, Skeleton } from "../(data)";
import { Copy, MessageCircle } from "lucide-react";
import { AdditionalTooltip, AdditionalTooltipType } from "../(content)";
import { Button } from "../(controls)";
import { toast } from "sonner";

export type TooltipItem = {
  id: string;
  termId: string;
  description?: string;
  type: string;
  group?: string;
  isPrivate?: boolean;
  isLive?: boolean;
  data?: Record<string, string[]>;
};

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
    ? `[${coords[1].toFixed(0)}, ${coords[0].toFixed(0)}, ${coords[2].toFixed(0)}]`
    : `[${coords[1].toFixed(0)}, ${coords[0].toFixed(0)}]`;
}

function copyToClipboard(text: string): void {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    // Fallback for non-secure contexts
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

// Parse individual coordinates from item.id format: "type@x:y" or "type@x:y:z"
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

  // Preserve z from fallback when ID doesn't include it
  if (fallback.length === 3) {
    return [x, y, fallback[2]];
  }
  return [x, y];
}

export function MarkerDetails({
  appName,
  item,
  latLng,
  distance,
  hideDiscovered,
  hideComments,
  onClick,
  onClose,
  additionalTooltip,
  coordinateCopyFormat,
}: {
  appName: string;
  item: TooltipItem;
  latLng: [number, number] | [number, number, number];
  distance?: number;
  hideDiscovered?: boolean;
  hideComments?: boolean;
  onClick: () => void;
  onClose: () => void;
  additionalTooltip?: AdditionalTooltipType;
  coordinateCopyFormat?: string;
}) {
  const t = useT();

  // Use item-specific coordinates if embedded in ID, otherwise fall back to shared latLng
  const itemCoords = useMemo(
    () => parseItemCoords(item.id, latLng),
    [item.id, latLng],
  );

  const { data: comments, isLoading } = useSWR(
    `/comments/${item.id}`,
    !item.isPrivate && !item.isLive && !hideComments
      ? async () => {
          const res = await fetch(
            `${API_FORGE_URL}/comments?node_id=${item.id}&app_id=${appName}`,
          );
          if (!res.ok) {
            throw new Error("Failed to fetch comments");
          }
          return ((await res.json()) as { comments: Comment[] }).comments.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          );
        }
      : null,
  );
  // Build description with template interpolation from spawn.data
  const desc = useMemo(() => {
    if (item.description) {
      return item.description.replace("\n", "<br>");
    }

    // Convert spawn.data arrays to flat vars object for template interpolation
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
    <>
      <article
        className={cn("space-y-1", {
          "hover:cursor-pointer": !item.isLive,
        })}
        onClick={onClick}
        onMouseMove={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg">
          {t(item.termId, { fallback: item.type }) || item.termId}
        </h3>
        <p className="italic flex gap-2 items-center">
          {t(item.type, { fallback: item.type })}
          {item.group && ` | ${t(item.group, { fallback: item.group })}`}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span>
            [{itemCoords[1].toFixed(0)}, {itemCoords[0].toFixed(0)}
            {itemCoords[2] ? `, ${itemCoords[2].toFixed(0)}` : ""}]
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(
                formatCoordinates(itemCoords, coordinateCopyFormat),
              );
              toast(
                t("common.copiedToClipboard", {
                  fallback: "Copied to clipboard",
                }),
              );
            }}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </p>
        {distance && (
          <p className="text-xs text-muted-foreground">
            {t("markers.distance", { fallback: "Distance:" })}{" "}
            {distance.toFixed(0)}
          </p>
        )}
        {additionalTooltip && (
          <AdditionalTooltip items={additionalTooltip} latLng={latLng} />
        )}
        {!hideComments && (
          <div className="flex text-sm items-center">
            <MessageCircle className="h-5 w-5 mr-1" />
            {isLoading ? <Skeleton className="w-2" /> : comments?.length}
          </div>
        )}
        {desc.length > 100 ? (
          <ScrollArea type="always" className="h-32">
            <div className="text-sm">
              <Markdown options={{ forceBlock: false }}>{desc}</Markdown>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-sm">
            <Markdown options={{ forceBlock: false }}>{desc}</Markdown>
          </div>
        )}
      </article>
      {!hideDiscovered && (
        <>
          <Separator className="my-4" />
          <Discovery
            id={
              item.id.includes("@")
                ? item.id
                : `${item.id}@${latLng[0]}:${latLng[1]}`
            }
            isPrivate={item.isPrivate}
            isLive={item.isLive}
            onClose={onClose}
          />
        </>
      )}
    </>
  );
}
