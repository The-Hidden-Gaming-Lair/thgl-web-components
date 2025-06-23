"use client";
import {
  cn,
  DrawingsAndNodes,
  saveFile,
  useSettingsStore,
  useUserStore,
  writeFileOverwolf,
} from "@repo/lib";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { CaretSortIcon } from "@radix-ui/react-icons";
import {
  CaseSensitive,
  Clipboard,
  Copy,
  Download,
  EllipsisVertical,
  Pencil,
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
import { RenameFilter } from "./rename-filter";
import { useMemo, useState } from "react";
import { DeleteFilter } from "./delete-filter";

export function MyFilters() {
  const { filters, setFilters, toggleFilter } = useUserStore();
  const myFilters = useSettingsStore((state) => state.myFilters);
  const addMyFilter = useSettingsStore((state) => state.addMyFilter);
  const [deleteMyFilter, setDeleteMyFilter] = useState<DrawingsAndNodes | null>(
    null,
  );
  const [renameMyFilter, setRenameMyFilter] = useState<DrawingsAndNodes | null>(
    null,
  );

  const isDrawingEditing = useSettingsStore(
    (state) => state.tempPrivateDrawing !== null,
  );
  const setTempPrivateDrawing = useSettingsStore(
    (state) => state.setTempPrivateDrawing,
  );

  const filterNames = useMemo(
    () => myFilters.map((filter) => filter.name),
    [myFilters],
  );
  const activeFiltersLength = useMemo(
    () => filterNames.filter((filter) => filters.includes(filter)).length,
    [filters, filterNames],
  );
  if (filterNames.length === 0) {
    return <></>;
  }
  return (
    <Collapsible defaultOpen>
      <div
        className={cn("flex items-center transition-colors w-full px-1.5", {
          "text-muted-foreground": !activeFiltersLength,
        })}
      >
        <button
          className={cn(
            "text-left transition-colors hover:text-primary p-1 truncate grow",
            {
              "text-muted-foreground": !activeFiltersLength,
            },
          )}
          onClick={() => {
            const newFilters = activeFiltersLength
              ? filters.filter((filter) => !filterNames.includes(filter))
              : [...new Set([...filters, ...filterNames])];
            setFilters(newFilters);
          }}
          title="My Filters"
          type="button"
        >
          <span className="font-semibold">My Filters</span>
          <span className="ml-1 text-xs text-muted-foreground">
            ({activeFiltersLength}/{filterNames.length})
          </span>
        </button>
        <CollapsibleTrigger asChild>
          <button className="transition-colors hover:text-primary p-2">
            <CaretSortIcon className="h-4 w-4" />
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="flex flex-wrap w-[200px] md:w-full">
        {myFilters
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((myFilter) => {
            return (
              <div
                key={myFilter.name}
                className="flex md:basis-1/2 overflow-hidden"
              >
                <button
                  className={cn(
                    "grow flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
                    {
                      "text-muted-foreground": !filters.includes(myFilter.name),
                    },
                  )}
                  onClick={() => {
                    toggleFilter(myFilter.name);
                  }}
                  title={myFilter.name.replace(/my_\d+_/, "")}
                  type="button"
                >
                  {!myFilter.isShared ? (
                    <User className={cn("h-5 w-5 shrink-0")} />
                  ) : (
                    <>
                      <Users className={cn("h-5 w-5 shrink-0")} />
                      <SharedFilter myFilter={myFilter} />
                    </>
                  )}
                  <span className="truncate">
                    {myFilter.name.replace(/my_\d+_/, "")}
                  </span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger className="transition-colors text-muted-foreground hover:text-primary p-2">
                    <EllipsisVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuGroup>
                      {myFilter.isShared && (
                        <DropdownMenuItem
                          onClick={() => {
                            const code = myFilter.url?.split("-").at(-1);
                            if (!code) {
                              toast.error("Invalid shared filter code");
                              return;
                            }
                            navigator.clipboard.writeText(code);
                            toast("Copied to clipboard");
                          }}
                        >
                          <Clipboard className="mr-2 h-4 w-4" />
                          <span>Copy Share Code</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          const fileName = `${myFilter.name}_filter_${Date.now()}.json`;
                          if (typeof overwolf === "undefined") {
                            const blob = new Blob([JSON.stringify(myFilter)], {
                              type: "text/json",
                            });
                            saveFile(blob, fileName);
                          } else {
                            writeFileOverwolf(
                              JSON.stringify(myFilter),
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
                          setTempPrivateDrawing({
                            ...(myFilter.drawing ?? {}),
                            name: myFilter.name,
                          });
                        }}
                        disabled={isDrawingEditing}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit Drawing</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setRenameMyFilter(myFilter);
                        }}
                        disabled={isDrawingEditing}
                      >
                        <CaseSensitive className="mr-2 h-4 w-4" />
                        <span>Rename</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const newMyFilter = { ...myFilter };
                          delete newMyFilter.url;
                          newMyFilter.name = `my_${Date.now()}_${newMyFilter.name.replace(
                            /my_\d+_/,
                            "",
                          )}`;
                          addMyFilter(newMyFilter);
                        }}
                        disabled={isDrawingEditing}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        <span>Duplicate</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setDeleteMyFilter(myFilter);
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
            );
          })}
      </CollapsibleContent>
      <RenameFilter
        myFilter={renameMyFilter}
        onClose={() => setRenameMyFilter(null)}
      />
      <DeleteFilter
        myFilter={deleteMyFilter}
        onClose={() => setDeleteMyFilter(null)}
      />
    </Collapsible>
  );
}
