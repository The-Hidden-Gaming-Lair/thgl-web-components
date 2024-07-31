import { cn, saveFile, useSettingsStore, writeFileOverwolf } from "@repo/lib";
import { ReactNode } from "react";
import {
  REGION_FILTERS,
  useCoordinates,
  useT,
  useUserStore,
} from "../(providers)";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import {
  AlertCircleIcon,
  Copy,
  Download,
  EllipsisVertical,
  Pencil,
  Spline,
  Trash,
  User,
  Users,
} from "lucide-react";
import { Separator } from "../ui/separator";
import { Presets } from "./presets";
import { MapSelect } from "./map-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { GlobalFilters } from "./global-filters";
import { toast } from "sonner";
import { SharedFilter } from "./shared-filter";

export function MarkersFilters({
  mapNames,
  children,
}: {
  mapNames: string[];
  children?: ReactNode;
}): JSX.Element {
  const { filters: filterDetails, regions } = useCoordinates();
  const t = useT();
  const { filters, setFilters, toggleFilter } = useUserStore();
  const privateNodes = useSettingsStore((state) => state.privateNodes);
  const privateDrawings = useSettingsStore((state) => state.privateDrawings);
  const sharedFilters = useSettingsStore((state) => state.sharedFilters);
  const removePrivateDrawing = useSettingsStore(
    (state) => state.removePrivateDrawing,
  );
  const setPrivateNodes = useSettingsStore((state) => state.setPrivateNodes);
  const removeSharedFilter = useSettingsStore(
    (state) => state.removeSharedFilter,
  );
  const isDrawingEditing = useSettingsStore(
    (state) => state.tempPrivateDrawing !== null,
  );
  const setTempPrivateDrawing = useSettingsStore(
    (state) => state.setTempPrivateDrawing,
  );

  const privateNodesFilters = [
    ...new Set([
      ...privateNodes.map(
        (privateNode) => privateNode.filter ?? "private_Unsorted",
      ),
      ...sharedFilters.map((sharedFilter) => sharedFilter.filter),
    ]),
  ];
  const hasActivePrivateNodesFilters = privateNodes.some((privateNode) =>
    filters.includes(privateNode.filter ?? "private_Unsorted"),
  );
  const hasActiveDrawingFilters = privateDrawings.some((privateDrawing) =>
    filters.includes(privateDrawing.id),
  );
  return (
    <>
      {children && (
        <>
          {children}
          <Separator />
        </>
      )}
      {mapNames.length > 1 && (
        <>
          <MapSelect mapNames={mapNames} />
          <Separator />
        </>
      )}
      <Presets />
      <Separator />
      <GlobalFilters />
      {privateNodesFilters.length > 0 && (
        <Collapsible defaultOpen>
          <div
            className={cn("flex items-center transition-colors w-full px-1.5", {
              "text-muted-foreground": !hasActivePrivateNodesFilters,
            })}
          >
            <button
              className={cn(
                "text-left transition-colors hover:text-primary p-1 truncate grow",
                {
                  "text-muted-foreground": !hasActivePrivateNodesFilters,
                },
              )}
              onClick={() => {
                const newFilters = hasActivePrivateNodesFilters
                  ? filters.filter(
                      (filter) => !privateNodesFilters.includes(filter),
                    )
                  : [...new Set([...filters, ...privateNodesFilters])];
                setFilters(newFilters);
              }}
              title="My Nodes"
              type="button"
            >
              My Nodes
            </button>
            <CollapsibleTrigger asChild>
              <button className="transition-colors hover:text-primary p-2">
                <CaretSortIcon className="h-4 w-4" />
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="flex flex-wrap w-[175px] md:w-full">
            {privateNodesFilters
              .sort((a, b) => a.localeCompare(b))
              .map((nodeFilter) => {
                const sharedFilter =
                  nodeFilter.includes("shared_") &&
                  sharedFilters.find((f) => f.filter === nodeFilter);
                return (
                  <div
                    key={nodeFilter}
                    className="flex md:basis-1/2 overflow-hidden"
                  >
                    <button
                      className={cn(
                        "grow flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
                        {
                          "text-muted-foreground":
                            !filters.includes(nodeFilter),
                        },
                      )}
                      onClick={() => {
                        toggleFilter(nodeFilter);
                      }}
                      title={nodeFilter
                        .replace("private_", "")
                        .replace(/shared_\d+_/, "")}
                      type="button"
                    >
                      {nodeFilter.includes("private_") ? (
                        <User className={cn("h-4 w-4 shrink-0")} />
                      ) : (
                        <>
                          <Users className={cn("h-4 w-4 shrink-0")} />
                          {sharedFilter && (
                            <SharedFilter
                              url={sharedFilter.url}
                              filter={sharedFilter.filter}
                            />
                          )}
                        </>
                      )}
                      <span className="truncate">
                        {nodeFilter
                          .replace("private_", "")
                          .replace(/shared_\d+_/, "")}
                      </span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="transition-colors text-muted-foreground hover:text-primary p-2">
                        <EllipsisVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuGroup>
                          {nodeFilter.includes("shared_") && (
                            <DropdownMenuItem
                              onClick={() => {
                                const sharedFilter = useSettingsStore
                                  .getState()
                                  .sharedFilters.find(
                                    (f) => f.filter === nodeFilter,
                                  );
                                if (!sharedFilter) {
                                  toast.error("Shared filter not found");
                                  return;
                                }
                                const code = sharedFilter.url.split("-").at(-1);
                                if (!code) {
                                  toast.error("Invalid shared filter code");
                                  return;
                                }
                                navigator.clipboard.writeText(code);
                                toast("Copied to clipboard");
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Copy share code</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              const fileName = `${nodeFilter}.json`;
                              const nodes = privateNodes.filter(
                                (n) =>
                                  (n.filter ?? "private_Unsorted") ===
                                  nodeFilter,
                              );
                              if (typeof overwolf === "undefined") {
                                const blob = new Blob([JSON.stringify(nodes)], {
                                  type: "text/json",
                                });
                                saveFile(blob, fileName);
                              } else {
                                writeFileOverwolf(
                                  JSON.stringify(nodes),
                                  overwolf.io.paths.documents +
                                    "\\the-hidden-gaming-lair",
                                  fileName,
                                );
                              }
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            <span>Download</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setPrivateNodes(
                                privateNodes.filter(
                                  (n) =>
                                    (n.filter ?? "private_Unsorted") !==
                                    nodeFilter,
                                ),
                              );
                              removeSharedFilter(nodeFilter);
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
          </CollapsibleContent>
        </Collapsible>
      )}
      {privateDrawings.length > 0 && (
        <Collapsible defaultOpen>
          <div
            className={cn("flex items-center transition-colors w-full px-1.5", {
              "text-muted-foreground": !hasActiveDrawingFilters,
            })}
          >
            <button
              className={cn(
                "text-left transition-colors hover:text-primary p-1 truncate grow",
              )}
              onClick={() => {
                const newFilters = hasActiveDrawingFilters
                  ? filters.filter(
                      (filter) =>
                        !privateDrawings.some((value) => value.id === filter),
                    )
                  : [
                      ...new Set([
                        ...filters,
                        ...privateDrawings.map((value) => value.id),
                      ]),
                    ];
                setFilters(newFilters);
              }}
              title="My Drawings"
              type="button"
            >
              My Drawings
            </button>
            <CollapsibleTrigger asChild>
              <button className="transition-colors hover:text-primary p-2">
                <CaretSortIcon className="h-4 w-4" />
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="flex flex-wrap  w-[175px] md:w-full">
            {privateDrawings
              .sort((a, b) => t(a.id).localeCompare(t(b.id)))
              .map((privateDrawing) => (
                <div
                  key={privateDrawing.id}
                  className="flex md:basis-1/2 overflow-hidden"
                >
                  <button
                    className={cn(
                      "grow flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
                      {
                        "text-muted-foreground": !filters.includes(
                          privateDrawing.id,
                        ),
                      },
                    )}
                    onClick={() => {
                      toggleFilter(privateDrawing.id);
                    }}
                    title={t(privateDrawing.id)}
                    type="button"
                  >
                    <Spline className="h-5 w-5 shrink-0" />
                    <span className="truncate">{privateDrawing.name}</span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="transition-colors text-muted-foreground hover:text-primary p-2">
                      <EllipsisVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={() => {
                            const fileName = `${privateDrawing.id}.json`;
                            if (typeof overwolf === "undefined") {
                              const blob = new Blob(
                                [JSON.stringify(privateDrawing)],
                                {
                                  type: "text/json",
                                },
                              );
                              saveFile(blob, fileName);
                            } else {
                              writeFileOverwolf(
                                JSON.stringify(privateDrawing),
                                overwolf.io.paths.documents +
                                  "\\the-hidden-gaming-lair",
                                fileName,
                              );
                            }
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          <span>Download</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setTempPrivateDrawing(privateDrawing);
                          }}
                          disabled={isDrawingEditing}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            removePrivateDrawing(privateDrawing.id);
                          }}
                          disabled={isDrawingEditing}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
          </CollapsibleContent>
        </Collapsible>
      )}
      {regions.length > 0 && (
        <Collapsible defaultOpen>
          <div
            className={cn("flex items-center transition-colors w-full px-1.5", {
              "text-muted-foreground": !REGION_FILTERS.some((f) =>
                filters.includes(f.id),
              ),
            })}
          >
            <button
              className={cn(
                "text-left transition-colors hover:text-primary p-1 truncate grow",
              )}
              onClick={() => {
                const newFilters = REGION_FILTERS.some((f) =>
                  filters.includes(f.id),
                )
                  ? filters.filter(
                      (filter) =>
                        !REGION_FILTERS.some((value) => value.id === filter),
                    )
                  : [
                      ...new Set([
                        ...filters,
                        ...REGION_FILTERS.map((f) => f.id),
                      ]),
                    ];
                setFilters(newFilters);
              }}
              title={t("drawings")}
              type="button"
            >
              {t("drawings")}
            </button>
            <CollapsibleTrigger asChild>
              <button className="transition-colors hover:text-primary p-2">
                <CaretSortIcon className="h-4 w-4" />
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="flex flex-wrap">
            {REGION_FILTERS.map((filter) => (
              <div
                key={filter.id}
                className={cn("flex md:basis-1/2 overflow-hidden", {
                  hidden:
                    filter.id === "region_borders" &&
                    !regions.some((r) => r.border.length > 0),
                })}
              >
                <button
                  className={cn(
                    "grow flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
                    {
                      "text-muted-foreground": !filters.includes(filter.id),
                    },
                  )}
                  onClick={() => {
                    toggleFilter(filter.id);
                  }}
                  title={t(filter.id)}
                  type="button"
                >
                  <filter.Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{t(filter.id)}</span>
                </button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
      <div className="flex flex-col w-[175px] md:w-full">
        {filterDetails.map(({ group, values, defaultOpen }) => {
          const hasActiveFilters = values.some((filter) =>
            filters.includes(filter.id),
          );
          return (
            <Collapsible key={group} defaultOpen={defaultOpen}>
              <div
                className={cn(
                  "flex items-center transition-colors w-full px-1.5",
                  {
                    "text-muted-foreground": !hasActiveFilters,
                  },
                )}
              >
                <button
                  className={cn(
                    "text-left transition-colors hover:text-primary p-1 truncate grow",
                    {
                      "text-muted-foreground": !hasActiveFilters,
                    },
                  )}
                  onClick={() => {
                    const newFilters = hasActiveFilters
                      ? filters.filter(
                          (filter) =>
                            !values.some((value) => value.id === filter),
                        )
                      : [
                          ...new Set([
                            ...filters,
                            ...values.map((value) => value.id),
                          ]),
                        ];
                    setFilters(newFilters);
                  }}
                  title={t(group)}
                  type="button"
                >
                  {t(group) || group}
                </button>
                <CollapsibleTrigger asChild>
                  <button className="transition-colors hover:text-primary p-2">
                    <CaretSortIcon className="h-4 w-4" />
                  </button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="flex flex-wrap">
                {values
                  .sort((a, b) => t(a.id).localeCompare(t(b.id)))
                  .map((filter) => (
                    <div
                      key={filter.id}
                      className="flex md:basis-1/2 overflow-hidden"
                    >
                      <button
                        className={cn(
                          "grow flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
                          {
                            "text-muted-foreground": !filters.includes(
                              filter.id,
                            ),
                          },
                        )}
                        onClick={() => {
                          toggleFilter(filter.id);
                        }}
                        title={t(filter.id)}
                        type="button"
                      >
                        <img
                          alt=""
                          className="h-5 w-5 shrink-0"
                          height={20}
                          src={`/icons/${filter.icon}`}
                          width={20}
                        />
                        <span className="truncate">
                          {t(filter.id) || filter.id}
                        </span>
                      </button>
                      {filter.live_only && (
                        <Tooltip delayDuration={20} disableHoverableContent>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <AlertCircleIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {filter.live_only && (
                              <div className="text-bold">
                                This filter is only available in live mode.
                                Please install the in-game app.
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </>
  );
}
