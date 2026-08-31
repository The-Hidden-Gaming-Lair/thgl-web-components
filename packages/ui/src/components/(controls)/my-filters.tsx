"use client";
import {
  apiPutFilter,
  apiSetShare,
  cn,
  DrawingsAndNodes,
  FiltersApiError,
  getCurrentGameId,
  saveFile,
  useAccountStore,
  useSettingsStore,
  writeFileOverwolf,
} from "@repo/lib";
import { useT, useUserStore } from "../(providers)";
import { CommunityFilters } from "./community-filters";
import { AddSharedFilter } from "../(interactive-map)/add-shared-filter";
import { UploadFilter } from "../(interactive-map)/upload-filter";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  CaseSensitive,
  ChevronRight,
  Clipboard,
  Cloud,
  CloudOff,
  CloudUpload,
  Copy,
  Download,
  EllipsisVertical,
  Globe,
  Lock,
  LogIn,
  Pencil,
  Trash,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";
import { RenameFilter } from "./rename-filter";
import { useEffect, useMemo, useRef, useState } from "react";
import { DeleteFilter } from "./delete-filter";

/**
 * Module-level memo of when we last hydrated each (game) from the server,
 * used to throttle re-hydrates. Kept out of zustand so it doesn't persist to
 * localStorage and survive too long.
 */
const lastHydratedAt = new Map<string, number>();
// Minimum gap between hydrates for the same game. Bounds the network cost of
// re-hydrating on window focus / tab-visibility while still letting a stale
// surface (a second browser, or the Overwolf overlay) reconcile deletes made
// elsewhere without a full reload.
const HYDRATE_TTL_MS = 30_000;

export function MyFilters() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { filters, setFilters, toggleFilter } = useUserStore();
  const myFilters = useSettingsStore((state) => state.myFilters);
  const addMyFilter = useSettingsStore((state) => state.addMyFilter);
  const setMyFilter = useSettingsStore((state) => state.setMyFilter);
  const hydrate = useSettingsStore((state) => state.hydrateFiltersFromServer);
  const decryptedUserId = useAccountStore((s) => s.decryptedUserId);
  const isSignedIn = !!decryptedUserId;
  const [deleteMyFilter, setDeleteMyFilter] = useState<DrawingsAndNodes | null>(
    null,
  );
  const [renameMyFilter, setRenameMyFilter] = useState<DrawingsAndNodes | null>(
    null,
  );

  // Hydrate filters from the server for signed-in users: once on mount, then
  // again on window focus / tab-visibility (throttled to HYDRATE_TTL_MS per
  // game). The focus re-hydrate is what lets a stale surface — a second
  // browser, or the Overwolf overlay — pick up filters deleted elsewhere
  // instead of resurrecting them on its next edit. Filters synced from other
  // devices land in myFilters; local-only / in-flight filters survive untouched
  // (see mergeHydratedFilters + getPendingSyncIds).
  useEffect(() => {
    if (!isSignedIn) return;
    const runHydrate = () => {
      const game = getCurrentGameId();
      if (!game) return;
      const last = lastHydratedAt.get(game) ?? 0;
      if (Date.now() - last < HYDRATE_TTL_MS) return;
      lastHydratedAt.set(game, Date.now());
      void hydrate(game);
    };
    runHydrate();
    const onFocus = () => runHydrate();
    const onVisible = () => {
      if (document.visibilityState === "visible") runHydrate();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isSignedIn, hydrate]);

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

  const ratio =
    filterNames.length > 0 ? activeFiltersLength / filterNames.length : 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn("flex items-center transition-colors w-full px-1.5", {
          "text-muted-foreground": !activeFiltersLength,
        })}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 text-left transition-colors hover:text-primary py-1 px-0.5 truncate grow min-w-0",
              {
                "text-muted-foreground": !activeFiltersLength,
              },
            )}
            title={t("myFilters.title", { fallback: "My Filters" })}
            type="button"
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 shrink-0 transition-transform duration-200",
                open && "rotate-90",
              )}
            />
            <span className="font-semibold truncate">
              {t("myFilters.title", { fallback: "My Filters" })}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {activeFiltersLength}/{filterNames.length}
            </span>
          </button>
        </CollapsibleTrigger>
        <div className="flex items-center shrink-0">
          <CommunityFilters compact />
          <AddSharedFilter compact />
          <UploadFilter compact />
        </div>
        <button
          className="text-[10px] text-muted-foreground hover:text-primary px-1.5 py-1 transition-colors shrink-0 uppercase tracking-wide"
          onClick={() => {
            const newFilters = activeFiltersLength
              ? filters.filter((filter) => !filterNames.includes(filter))
              : [...new Set([...filters, ...filterNames])];
            setFilters(newFilters);
          }}
          type="button"
          title={
            activeFiltersLength
              ? t("myFilters.disableAll", { fallback: "Disable all" })
              : t("myFilters.enableAll", { fallback: "Enable all" })
          }
        >
          {activeFiltersLength
            ? t("myFilters.none", { fallback: "None" })
            : t("myFilters.all", { fallback: "All" })}
        </button>
      </div>
      <div className="h-[2px] bg-muted/20 mx-1.5 overflow-hidden rounded-full">
        <div
          className="h-full bg-primary/50 transition-all duration-300 rounded-full"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <CollapsibleContent className="flex flex-wrap w-[200px] md:w-full">
        {filterNames.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-3 leading-snug">
            {t("myFilters.empty.intro", {
              fallback: "No saved filters yet. Browse",
            })}{" "}
            <span className="text-foreground">
              {t("myFilters.empty.community", { fallback: "Community" })}
            </span>{" "}
            {t("myFilters.empty.forPublic", {
              fallback: "for public filters, paste a",
            })}{" "}
            <span className="text-foreground">
              {t("myFilters.empty.code", { fallback: "Code" })}
            </span>{" "}
            {t("myFilters.empty.shared", {
              fallback: "a friend shared, or",
            })}{" "}
            <span className="text-foreground">
              {t("myFilters.empty.upload", { fallback: "Upload" })}
            </span>{" "}
            {t("myFilters.empty.file", { fallback: "a filter file." })}
          </p>
        )}
        {myFilters
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((myFilter) => (
            <FilterRow
              key={myFilter.name}
              myFilter={myFilter}
              isActive={filters.includes(myFilter.name)}
              isSignedIn={isSignedIn}
              isDrawingEditing={isDrawingEditing}
              onToggle={() => toggleFilter(myFilter.name)}
              onDuplicate={(f) => {
                // Duplicate as a fresh local filter — strip server-only
                // and legacy-share fields so the copy doesn't try to
                // adopt the original's identity.
                const copy: DrawingsAndNodes = {
                  ...f,
                  name: `my_${Date.now()}_${f.name.replace(/my_\d+_/, "")}`,
                };
                delete copy.id;
                delete copy.shareCode;
                delete copy.visibility;
                delete copy.voteCount;
                delete copy.commentCount;
                delete copy.url;
                delete copy.isShared;
                addMyFilter(copy);
              }}
              onRename={setRenameMyFilter}
              onDelete={setDeleteMyFilter}
              onEditDrawing={(f) =>
                setTempPrivateDrawing({
                  ...(f.drawing ?? {}),
                  name: f.name,
                })
              }
              onShareChange={(updated) => {
                setMyFilter(updated.name, updated);
              }}
            />
          ))}
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

interface FilterRowProps {
  myFilter: DrawingsAndNodes;
  isActive: boolean;
  isSignedIn: boolean;
  isDrawingEditing: boolean;
  onToggle: () => void;
  onDuplicate: (f: DrawingsAndNodes) => void;
  onRename: (f: DrawingsAndNodes) => void;
  onDelete: (f: DrawingsAndNodes) => void;
  onEditDrawing: (f: DrawingsAndNodes) => void;
  onShareChange: (next: DrawingsAndNodes) => void;
}

function FilterRow({
  myFilter,
  isActive,
  isSignedIn,
  isDrawingEditing,
  onToggle,
  onDuplicate,
  onRename,
  onDelete,
  onEditDrawing,
  onShareChange,
}: FilterRowProps) {
  const t = useT();
  // Track in-flight share operation so the menu doesn't fire twice
  // on rapid clicks.
  const busyRef = useRef(false);
  const isSynced = !!myFilter.id;
  const isPublic = myFilter.visibility === "public";
  // Legacy: pre-rework localStorage with isShared + url but no server id.
  // The blob endpoint is 410-Gone now, so these are effectively local-only.
  const isLegacy = !!myFilter.url && !myFilter.id;
  const displayName = myFilter.name.replace(/my_\d+_/, "");

  async function callShare(input: {
    visibility?: "private" | "public";
    generateCode?: boolean;
    revokeCode?: boolean;
  }) {
    if (busyRef.current) return;
    if (!myFilter.id) {
      toast.error(
        t("myFilters.notSynced", {
          fallback:
            "Filter not yet synced to your account — try again in a moment",
        }),
      );
      return;
    }
    busyRef.current = true;
    try {
      const updated = await apiSetShare(myFilter.id, input);
      onShareChange({
        ...myFilter,
        visibility: updated.visibility,
        shareCode: updated.shareCode ?? undefined,
        updatedAt: updated.updatedAt,
      });
    } catch (err) {
      const msg =
        err instanceof FiltersApiError
          ? err.message
          : t("myFilters.sharingFailed", { fallback: "Sharing failed" });
      toast.error(msg);
    } finally {
      busyRef.current = false;
    }
  }

  async function saveToAccount() {
    if (busyRef.current) return;
    const game = myFilter.game ?? getCurrentGameId();
    if (!game) {
      toast.error(
        t("myFilters.unknownGame", {
          fallback: "Could not determine which game this filter belongs to",
        }),
      );
      return;
    }
    busyRef.current = true;
    try {
      const id = crypto.randomUUID();
      const updated = await apiPutFilter(id, {
        game,
        name: myFilter.name,
        payload: { nodes: myFilter.nodes, drawing: myFilter.drawing },
        visibility: "private",
      });
      onShareChange({
        ...myFilter,
        id: updated.id,
        game: updated.game,
        visibility: updated.visibility,
        shareCode: updated.shareCode ?? undefined,
        voteCount: updated.voteCount,
        commentCount: updated.commentCount,
        updatedAt: updated.updatedAt,
        // Now confirmed on the server, so hydrate won't treat it as
        // never-uploaded (and re-push) or as deleted.
        synced: true,
        // Drop legacy fields — vestigial after the rework.
        url: undefined,
        isShared: undefined,
      });
      toast.success(
        t("myFilters.savedToAccount", {
          fallback: '"{{name}}" saved to your account',
          vars: { name: displayName },
        }),
      );
    } catch (err) {
      const msg =
        err instanceof FiltersApiError
          ? err.message
          : t("myFilters.saveFailed", { fallback: "Save failed" });
      toast.error(msg);
    } finally {
      busyRef.current = false;
    }
  }

  async function copyShareCode() {
    if (!myFilter.id) {
      toast.error(
        t("myFilters.notSyncedShort", {
          fallback: "Filter not yet synced to your account",
        }),
      );
      return;
    }
    let code = myFilter.shareCode;
    if (!code) {
      // Generate on first use.
      try {
        const updated = await apiSetShare(myFilter.id, { generateCode: true });
        code = updated.shareCode ?? undefined;
        onShareChange({
          ...myFilter,
          visibility: updated.visibility,
          shareCode: updated.shareCode ?? undefined,
          updatedAt: updated.updatedAt,
        });
      } catch (err) {
        const msg =
          err instanceof FiltersApiError
            ? err.message
            : t("myFilters.generateCodeFailed", {
                fallback: "Could not generate share code",
              });
        toast.error(msg);
        return;
      }
    }
    if (!code) {
      toast.error(
        t("myFilters.noShareCode", { fallback: "No share code available" }),
      );
      return;
    }
    await navigator.clipboard.writeText(code);
    toast(
      t("myFilters.shareCodeCopied", {
        fallback: "Share code copied: {{code}}",
        vars: { code },
      }),
    );
  }

  return (
    <div className="flex md:basis-1/2 overflow-hidden">
      <button
        className={cn(
          "grow flex gap-2 items-center transition-colors hover:text-primary p-2 truncate",
          { "text-muted-foreground": !isActive },
        )}
        onClick={onToggle}
        title={displayName}
        type="button"
      >
        {isPublic ? (
          <Globe className="h-5 w-5 shrink-0" />
        ) : isSynced ? (
          <Cloud className="h-5 w-5 shrink-0" />
        ) : (
          <CloudOff className="h-5 w-5 shrink-0" />
        )}
        <span className="truncate">{displayName}</span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger className="transition-colors text-muted-foreground hover:text-primary p-2">
          <EllipsisVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            {!isSignedIn && (
              <DropdownMenuItem
                onClick={() => {
                  useAccountStore.getState().setShowUserDialog(true);
                }}
              >
                <LogIn className="mr-2 h-4 w-4" />
                <span>
                  {t("myFilters.signInToShare", {
                    fallback: "Sign in to share",
                  })}
                </span>
              </DropdownMenuItem>
            )}
            {isSignedIn && !isSynced && (
              <>
                <DropdownMenuItem onClick={saveToAccount}>
                  <CloudUpload className="mr-2 h-4 w-4" />
                  <span>
                    {isLegacy
                      ? t("myFilters.saveToAccountLegacy", {
                          fallback: "Save to my account (replace legacy share)",
                        })
                      : t("myFilters.saveToAccount", {
                          fallback: "Save to my account",
                        })}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {isSignedIn && isSynced && (
              <>
                <DropdownMenuItem onClick={copyShareCode}>
                  <Clipboard className="mr-2 h-4 w-4" />
                  <span>
                    {myFilter.shareCode
                      ? t("myFilters.copyShareCode", {
                          fallback: "Copy share code",
                        })
                      : t("myFilters.createShareCode", {
                          fallback: "Create share code",
                        })}
                  </span>
                </DropdownMenuItem>
                {myFilter.shareCode && (
                  <DropdownMenuItem
                    onClick={() => callShare({ revokeCode: true })}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    <span>
                      {t("myFilters.revokeShareCode", {
                        fallback: "Revoke share code",
                      })}
                    </span>
                  </DropdownMenuItem>
                )}
                {isPublic ? (
                  <DropdownMenuItem
                    onClick={() => callShare({ visibility: "private" })}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    <span>
                      {t("myFilters.makePrivate", { fallback: "Make private" })}
                    </span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => callShare({ visibility: "public" })}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    <span>
                      {t("myFilters.publishToCommunity", {
                        fallback: "Publish to community",
                      })}
                    </span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
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
                    overwolf.io.paths.documents + "\\the-hidden-gaming-lair",
                    fileName,
                  );
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              <span>{t("common.download", { fallback: "Download" })}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEditDrawing(myFilter)}
              disabled={isDrawingEditing}
            >
              <Pencil className="mr-2 h-4 w-4" />
              <span>
                {t("myFilters.editDrawing", { fallback: "Edit drawing" })}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRename(myFilter)}
              disabled={isDrawingEditing}
            >
              <CaseSensitive className="mr-2 h-4 w-4" />
              <span>{t("common.rename", { fallback: "Rename" })}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDuplicate(myFilter)}
              disabled={isDrawingEditing}
            >
              <Copy className="mr-2 h-4 w-4" />
              <span>{t("common.duplicate", { fallback: "Duplicate" })}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(myFilter)}
              disabled={isDrawingEditing}
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>{t("common.delete", { fallback: "Delete" })}</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
