import { Hash, Users } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useState } from "react";
import { Input } from "../ui/input";
import { ReloadIcon } from "@radix-ui/react-icons";
import {
  apiGetByCode,
  FiltersApiError,
  serverFilterToLocal,
  useAccountStore,
  useSettingsStore,
  type DrawingsAndNodes,
} from "@repo/lib";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useT } from "../(providers)";

/**
 * Import a shared filter by share code.
 *
 * Anonymous users: the resolved filter is stripped of its server
 * identity (id / shareCode / visibility) so it becomes a local copy
 * in their localStorage. They can't re-share it themselves without
 * signing in.
 *
 * Signed-in users: copied with a fresh server id of their own. The
 * store then PUTs it to their account. Updates to the original by
 * the publisher don't propagate (we copy, don't follow).
 */
export function AddSharedFilter({
  onFilterAdded,
  compact = false,
}: {
  onFilterAdded?: (filterName: string) => void;
  /** Tight icon+label sidebar variant. */
  compact?: boolean;
} = {}) {
  const t = useT();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [shareCode, setShareCode] = useState("");
  const addMyFilter = useSettingsStore((state) => state.addMyFilter);
  const isSignedIn = useAccountStore((s) => !!s.decryptedUserId);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const server = await apiGetByCode(shareCode.trim());
      // Always import as a fresh copy. Strip server-side identity so
      // the store treats this as a new owned filter (signed-in users
      // get a new id from addMyFilter; anonymous keeps it id-less).
      const local: DrawingsAndNodes = {
        ...serverFilterToLocal(server),
        name: `my_${Date.now()}_${server.name.replace(/my_\d+_/, "")}`,
      };
      delete local.id;
      delete local.shareCode;
      delete local.visibility;
      delete local.voteCount;
      delete local.commentCount;
      addMyFilter(local);
      toast.success(
        t("sharedFilter.added", {
          fallback: "Shared filter added successfully",
        }),
      );
      onFilterAdded?.(local.name);
      setOpen(false);
    } catch (error) {
      if (error instanceof FiltersApiError) {
        setErrorMessage(
          error.status === 404
            ? t("sharedFilter.notFound", {
                fallback: "Share code not found — check the code and try again",
              })
            : error.message,
        );
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          t("common.unknownError", { fallback: "An unknown error occurred" }),
        );
      }
    }
    setIsLoading(false);
  };

  const trigger = compact ? (
    <button
      type="button"
      title={t("sharedFilter.importByCode", {
        fallback: "Import filter by share code",
      })}
      aria-label={t("sharedFilter.importByCode", {
        fallback: "Import filter by share code",
      })}
      className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-primary transition-colors"
    >
      <Hash className="h-3.5 w-3.5" />
    </button>
  ) : (
    <Button size="sm" type="button" variant="secondary">
      <Users className="h-4 w-4 mr-2" />
      {t("sharedFilter.title", { fallback: "Add Shared Filter" })}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t("sharedFilter.title", { fallback: "Add Shared Filter" })}
          </DialogTitle>
          <div className="text-xs text-muted-foreground">
            <TooltipProvider>
              <Tooltip delayDuration={200} disableHoverableContent>
                <TooltipTrigger asChild>
                  <span className="underline cursor-help">
                    {t("sharedFilter.whatIsThis", {
                      fallback: "What is this?",
                    })}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[360px]">
                  {t("sharedFilter.explanation", {
                    fallback:
                      "Paste a share code to import someone else's filter (their nodes + drawings) as a copy under your account. The original owner's edits won't affect your copy.",
                  })}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <DialogDescription className="sr-only">
            {t("sharedFilter.description", {
              fallback: "Import a shared filter by its share code.",
            })}
          </DialogDescription>
        </DialogHeader>
        <section className="space-y-4 overflow-hidden">
          {!isSignedIn && (
            <p className="text-xs text-muted-foreground">
              {t("sharedFilter.localOnlyNotice", {
                fallback:
                  "You're importing as a local-only copy. Sign in to keep imported filters synced across devices.",
              })}
            </p>
          )}
          <p className="text-orange-500 truncate">{errorMessage}</p>
          <form className="space-y-2" onSubmit={handleSubmit}>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="shareCode">
                {t("sharedFilter.shareCode", { fallback: "Share Code" })}
              </Label>
              <Input
                id="shareCode"
                type="text"
                value={shareCode}
                onChange={(event) => setShareCode(event.target.value)}
                required
                placeholder={t("sharedFilter.codePlaceholder", {
                  fallback: "Enter the code",
                })}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !shareCode}
              className="w-full"
            >
              {isLoading && (
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("sharedFilter.title", { fallback: "Add Shared Filter" })}
            </Button>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
