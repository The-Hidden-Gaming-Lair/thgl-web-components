import { useT } from "../(providers)";
import { ScrollArea } from "../ui/scroll-area";
import Markdown from "markdown-to-jsx";
import { Separator } from "../ui/separator";
import { Discovery } from "./discovery";
import useSWR from "swr";
import { API_FORGE_URL, cn } from "@repo/lib";
import { Comment, Skeleton } from "../(data)";
import { MessageCircle } from "lucide-react";
import { AdditionalTooltip, AdditionalTooltipType } from "../(content)";

export type TooltipItem = {
  id: string;
  termId: string;
  description?: string;
  type: string;
  group?: string;
  isPrivate?: boolean;
  isLive?: boolean;
};

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
}) {
  const t = useT();

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
  const desc = item.description
    ? item.description.replace("\n", "<br>")
    : t(item.termId, { isDesc: true, fallback: item.type });
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
          {t(item.type) || item.type.replace(/my_\d+_/, "")}
          {item.group && ` | ${t(item.group) || item.group}`}
        </p>
        <p className="text-xs text-muted-foreground">
          [{latLng[1].toFixed(0)}, {latLng[0].toFixed(0)}
          {latLng[2] ? `, ${latLng[2].toFixed(0)}` : ""}]
        </p>
        {distance && (
          <p className="text-xs text-muted-foreground">
            Distance: {distance.toFixed(0)}
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
        <ScrollArea
          type="always"
          className={cn({
            "h-48": desc.length > 100,
          })}
        >
          <Markdown options={{ forceBlock: false }}>{desc}</Markdown>
        </ScrollArea>
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
