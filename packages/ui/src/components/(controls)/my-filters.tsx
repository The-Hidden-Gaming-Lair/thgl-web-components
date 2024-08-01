import { cn, saveFile, useSettingsStore, writeFileOverwolf } from "@repo/lib";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { CaretSortIcon } from "@radix-ui/react-icons";
import {
  Copy,
  Download,
  EllipsisVertical,
  Pencil,
  Spline,
  Trash,
  User,
  Users,
} from "lucide-react";
import { SharedFilter } from "./shared-filter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { useT, useUserStore } from "../(providers)";

export function MyFilters() {
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
  const privateFilters = [
    ...privateNodesFilters,
    ...privateDrawings.map((value) => value.id),
  ];
  const hasActiveFilters = privateFilters.some((filter) =>
    filters.includes(filter),
  );

  return (
    <Collapsible defaultOpen>
      <div
        className={cn("flex items-center transition-colors w-full px-1.5", {
          "text-muted-foreground": !hasActiveFilters,
        })}
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
              ? filters.filter((filter) => !privateFilters.includes(filter))
              : [...new Set([...filters, ...privateFilters])];
            setFilters(newFilters);
          }}
          title="My Nodes & Drawings"
          type="button"
        >
          My Drawings & Nodes
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
                      "text-muted-foreground": !filters.includes(nodeFilter),
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
                              (n.filter ?? "private_Unsorted") === nodeFilter,
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
                                (n.filter ?? "private_Unsorted") !== nodeFilter,
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
  );
}
