import { cn, useGameState, useUserStore } from "@repo/lib";
import { Input } from "../ui/input";
import { useCoordinates, useT } from "../(providers)";
import Markdown from "markdown-to-jsx";
import { useMemo } from "react";
import { Discovery } from "../(interactive-map)";
import { Separator } from "../ui/separator";
import { Comments } from "./comments";
import { ScrollArea } from "../ui/scroll-area";

export function NodeDetails({
  id,
  appName,
  hideComments,
}: {
  id: string;
  appName?: string;
  hideComments?: boolean;
}) {
  const t = useT();
  const { spawns, filters } = useCoordinates();
  const setSelectedNodeId = useUserStore((state) => state.setSelectedNodeId);
  const player = useGameState((state) => state.player);
  const spawn = useMemo(() => {
    let result;
    for (const spawn of spawns) {
      const spawnId = spawn.id?.includes("@")
        ? spawn.id
        : `${spawn.id || spawn.type}@${spawn.p[0]}:${spawn.p[1]}`;
      if (spawnId === id) {
        result = spawn;
        break;
      }
      if (spawn.cluster) {
        for (const cluster of spawn.cluster) {
          const clusterSpawnId = cluster.id?.includes("@")
            ? cluster.id
            : `${cluster.id || cluster.type}@${cluster.p[0]}:${cluster.p[1]}`;
          if (clusterSpawnId === id) {
            result = cluster;
            break;
          }
        }
      }
    }
    return result;
  }, [id, spawns]);

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
  const filter =
    spawn &&
    filters.find((filter) =>
      filter.values.some((filter) => filter.id === spawn.type),
    );
  const termId =
    spawn && (spawn.name ?? spawn.id ?? spawn.type).replace(/my_\d+_/, "");

  return (
    <>
      <div
        className={cn(
          "relative flex w-full pointer-events-auto bg-card border rounded-md",
        )}
      >
        <Input
          autoComplete="off"
          autoCorrect="off"
          className=" placeholder:text-gray-400 pr-4"
          value={spawn ? t(termId, false, spawn.type) || termId : id}
          type="text"
          disabled
        />
        <button
          className="flex absolute inset-y-0 right-0 items-center pr-2 text-gray-400 hover:text-gray-200"
          onClick={() => {
            setSelectedNodeId(null);
          }}
          type="button"
        >
          <svg
            className="block w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 0h24v24H0z" fill="none" stroke="none" />
            <path d="M18 6l-12 12" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      {spawn ? (
        <article className="pointer-events-auto border rounded-md bg-card text-card-foreground shadow grid relative p-2 overflow-hidden">
          <h3 className="text-lg truncate">
            {t(termId, false, spawn.type) || termId}
          </h3>
          <p className="italic flex gap-2 items-center">
            {t(spawn.type) || spawn.type.replace(/my_\d+_/, "")}
            {filter
              ? filter.group && ` | ${t(filter.group) || filter.group}`
              : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            [{spawn.p[1].toFixed(0)}, {spawn.p[0].toFixed(0)}
            {spawn.p[2] ? `, ${spawn.p[2].toFixed(0)}` : ""}]
          </p>
          {distance && (
            <p className="text-xs text-muted-foreground">
              Distance: {distance.toFixed(0)}
            </p>
          )}
          <ScrollArea type="always">
            <Markdown options={{ forceBlock: false }}>
              {spawn.description
                ? spawn.description.replace("\n", "<br>")
                : t(termId, true)}
            </Markdown>
          </ScrollArea>
          <Separator className="my-4" />
          <Discovery
            id={
              spawn.id?.includes("@")
                ? spawn.id
                : `${spawn.id || spawn.type}@${spawn.p[0]}:${spawn.p[1]}`
            }
            isPrivate={spawn.isPrivate}
          />
          {appName && !hideComments && (
            <>
              <Separator className="my-4" />
              {spawn.isPrivate || spawn.address ? (
                <p>Comments are not available for private nodes.</p>
              ) : (
                <Comments
                  id={
                    spawn.id?.includes("@")
                      ? spawn.id
                      : `${spawn.id || spawn.type}@${spawn.p[0]}:${spawn.p[1]}`
                  }
                  appName={appName}
                />
              )}
            </>
          )}
        </article>
      ) : (
        <div>Node not found</div>
      )}
    </>
  );
}
