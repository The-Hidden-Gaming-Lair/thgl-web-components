"use client";
import {
  apiDeleteComment,
  apiGetComments,
  apiGetFilter,
  apiGetPublic,
  apiPostComment,
  apiVote,
  cn,
  FiltersApiError,
  getCurrentGameId,
  serverFilterToLocal,
  useAccountStore,
  useSettingsStore,
  type DrawingsAndNodes,
  type FilterComment,
  type ServerFilterMeta,
} from "@repo/lib";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  ChevronDown,
  Globe,
  Heart,
  MessageSquare,
  Search,
  Trash,
} from "lucide-react";
import { ReloadIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { useT } from "../(providers)";

type SortOrder = "top" | "new" | "recent";

const PAGE_SIZE = 30;

export function CommunityFilters({
  compact = false,
}: {
  /** Tight icon+label sidebar variant. */
  compact?: boolean;
} = {}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  // getCurrentGameId() is client-only (reads window.location); on the server
  // it returns null, so without this guard the component renders nothing
  // server-side then pops in after hydration, shifting sibling buttons and
  // triggering a hydration mismatch. Defer the game lookup to after mount so
  // the server render and the first client render agree (both null).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const game = mounted ? getCurrentGameId() : null;
  if (!game) return null;

  const trigger = compact ? (
    <button
      type="button"
      title={t("community.browseTitle", {
        fallback: "Browse community filters",
      })}
      aria-label={t("community.browseTitle", {
        fallback: "Browse community filters",
      })}
      className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-primary transition-colors"
    >
      <Globe className="h-3.5 w-3.5" />
    </button>
  ) : (
    <Button
      size="sm"
      type="button"
      variant="secondary"
      className="w-full justify-start gap-2"
    >
      <Globe className="h-4 w-4" />
      {t("community.browse", { fallback: "Browse Community Filters" })}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {t("community.title", { fallback: "Community Filters" })}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("community.description", {
              fallback: "Browse and import community-shared filters.",
            })}
          </DialogDescription>
        </DialogHeader>
        <Browser game={game} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function Browser({ game, onClose }: { game: string; onClose: () => void }) {
  const t = useT();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [sort, setSort] = useState<SortOrder>("top");
  const [items, setItems] = useState<ServerFilterMeta[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Debounce search input.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Initial fetch + on filter/sort change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setItems([]);
    setCursor(null);
    setSelectedId(null);
    apiGetPublic({ game, q: debouncedQ || undefined, sort, limit: PAGE_SIZE })
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setCursor(page.nextCursor);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : t("community.loadFailed", { fallback: "Failed to load filters" }),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [game, debouncedQ, sort]);

  async function loadMore() {
    if (cursor === null || loading) return;
    setLoading(true);
    try {
      const page = await apiGetPublic({
        game,
        q: debouncedQ || undefined,
        sort,
        cursor,
        limit: PAGE_SIZE,
      });
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("community.loadMoreFailed", { fallback: "Failed to load more" }),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 overflow-hidden">
      <div className="flex gap-2 items-center">
        <div className="relative grow">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("community.searchPlaceholder", {
              fallback: "Search filter names…",
            })}
            className="pl-8"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOrder)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">
              {t("community.topVoted", { fallback: "Top voted" })}
            </SelectItem>
            <SelectItem value="new">
              {t("community.newest", { fallback: "Newest" })}
            </SelectItem>
            <SelectItem value="recent">
              {t("community.recentlyUpdated", { fallback: "Recently updated" })}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-sm text-orange-500">{error}</p>}

      <div className="overflow-y-auto flex-1 -mx-2 px-2">
        {items.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {debouncedQ
              ? t("community.noMatch", {
                  fallback: 'No filters match "{{query}}"',
                  vars: { query: debouncedQ },
                })
              : t("community.empty", {
                  fallback:
                    "No public filters for this game yet — be the first to publish one.",
                })}
          </p>
        )}
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Card
                meta={item}
                expanded={selectedId === item.id}
                onToggle={() =>
                  setSelectedId(selectedId === item.id ? null : item.id)
                }
                onVoteChange={(voted, voteCount) => {
                  setItems((prev) =>
                    prev.map((i) =>
                      i.id === item.id ? { ...i, voteCount } : i,
                    ),
                  );
                  // voted is for future UI hint (highlight the heart);
                  // we don't persist it cross-render here.
                  void voted;
                }}
                onCommentChange={(delta) => {
                  setItems((prev) =>
                    prev.map((i) =>
                      i.id === item.id
                        ? {
                            ...i,
                            commentCount: Math.max(0, i.commentCount + delta),
                          }
                        : i,
                    ),
                  );
                }}
                onImported={onClose}
              />
            </li>
          ))}
        </ul>
        {cursor !== null && (
          <div className="flex justify-center mt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={loadMore}
              disabled={loading}
            >
              {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              {t("community.loadMore", { fallback: "Load more" })}
            </Button>
          </div>
        )}
        {loading && items.length === 0 && (
          <div className="flex justify-center py-6">
            <ReloadIcon className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}

interface CardProps {
  meta: ServerFilterMeta;
  expanded: boolean;
  onToggle: () => void;
  onVoteChange: (voted: boolean, voteCount: number) => void;
  onCommentChange: (delta: number) => void;
  onImported: () => void;
}

function Card({
  meta,
  expanded,
  onToggle,
  onVoteChange,
  onCommentChange,
  onImported,
}: CardProps) {
  const t = useT();
  const myUserId = useAccountStore((s) => s.decryptedUserId);
  const isSignedIn = !!myUserId;
  const isOwn = !!myUserId && meta.userId === myUserId;
  const addMyFilter = useSettingsStore((s) => s.addMyFilter);
  const [importing, setImporting] = useState(false);
  const [voting, setVoting] = useState(false);
  const displayName = meta.name.replace(/my_\d+_/, "");

  async function handleVote() {
    if (!isSignedIn) {
      toast.error(t("community.signInToVote", { fallback: "Sign in to vote" }));
      return;
    }
    if (voting) return;
    setVoting(true);
    try {
      const res = await apiVote(meta.id);
      onVoteChange(res.voted, res.voteCount);
    } catch (err) {
      const msg =
        err instanceof FiltersApiError
          ? err.message
          : t("community.voteFailed", { fallback: "Vote failed" });
      toast.error(msg);
    } finally {
      setVoting(false);
    }
  }

  async function handleImport() {
    if (importing) return;
    if (isOwn) {
      // Importing your own public filter would just create a
      // duplicate local copy. Block it client-side; the user already
      // has the original in My Filters.
      toast(
        t("community.alreadyYours", {
          fallback: "This is already your filter",
        }),
      );
      return;
    }
    setImporting(true);
    try {
      const full = await apiGetFilter(meta.id);
      const local: DrawingsAndNodes = {
        ...serverFilterToLocal(full),
        name: `my_${Date.now()}_${full.name.replace(/my_\d+_/, "")}`,
      };
      delete local.id;
      delete local.shareCode;
      delete local.visibility;
      delete local.voteCount;
      delete local.commentCount;
      addMyFilter(local);
      toast.success(
        t("community.imported", {
          fallback: 'Imported "{{name}}"',
          vars: { name: displayName },
        }),
      );
      onImported();
    } catch (err) {
      const msg =
        err instanceof FiltersApiError
          ? err.message
          : t("community.importFailed", { fallback: "Import failed" });
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="border border-border rounded-md bg-muted/20 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          className="grow flex items-center gap-2 text-left truncate min-w-0"
          onClick={onToggle}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              expanded && "rotate-180",
            )}
          />
          <span className="truncate font-medium">{displayName}</span>
          {isOwn && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-primary/15 text-primary shrink-0">
              {t("community.yours", { fallback: "Yours" })}
            </span>
          )}
        </button>
        <span className="flex items-center gap-1 text-sm text-muted-foreground shrink-0 tabular-nums">
          <Heart className="h-4 w-4" />
          {meta.voteCount}
        </span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground shrink-0 tabular-nums">
          <MessageSquare className="h-4 w-4" />
          {meta.commentCount}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleImport}
          disabled={importing || isOwn}
          title={
            isOwn
              ? t("community.alreadyInFilters", {
                  fallback: "This is already in your filters",
                })
              : undefined
          }
        >
          {importing && <ReloadIcon className="mr-1 h-3 w-3 animate-spin" />}
          {t("community.import", { fallback: "Import" })}
        </Button>
      </div>
      {expanded && (
        <CardDetails
          meta={meta}
          isSignedIn={isSignedIn}
          voting={voting}
          onVote={handleVote}
          onCommentChange={onCommentChange}
        />
      )}
    </div>
  );
}

interface CardDetailsProps {
  meta: ServerFilterMeta;
  isSignedIn: boolean;
  voting: boolean;
  onVote: () => void;
  onCommentChange: (delta: number) => void;
}

function CardDetails({
  meta,
  isSignedIn,
  voting,
  onVote,
  onCommentChange,
}: CardDetailsProps) {
  const t = useT();
  const myUserId = useAccountStore((s) => s.decryptedUserId);
  const [comments, setComments] = useState<FilterComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsCursor, setCommentsCursor] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setCommentsLoading(true);
    apiGetComments(meta.id)
      .then((page) => {
        if (!mounted.current) return;
        setComments(page.items);
        setCommentsCursor(page.nextCursor);
      })
      .catch((err) => {
        if (mounted.current) {
          console.error("[community filters] comments fetch", err);
        }
      })
      .finally(() => {
        if (mounted.current) setCommentsLoading(false);
      });
    return () => {
      mounted.current = false;
    };
  }, [meta.id]);

  async function loadMoreComments() {
    if (commentsCursor === null) return;
    setCommentsLoading(true);
    try {
      const page = await apiGetComments(meta.id, commentsCursor);
      setComments((prev) => [...prev, ...page.items]);
      setCommentsCursor(page.nextCursor);
    } catch (err) {
      console.error("[community filters] more comments", err);
    } finally {
      setCommentsLoading(false);
    }
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    const body = newComment.trim();
    if (!body || posting) return;
    setPosting(true);
    try {
      const created = await apiPostComment(meta.id, body);
      setComments((prev) => [created, ...prev]);
      setNewComment("");
      onCommentChange(1);
    } catch (err) {
      const msg =
        err instanceof FiltersApiError
          ? err.message
          : t("community.commentFailed", { fallback: "Comment failed" });
      toast.error(msg);
    } finally {
      setPosting(false);
    }
  }

  async function deleteOwnComment(id: string) {
    try {
      await apiDeleteComment(meta.id, id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      onCommentChange(-1);
    } catch (err) {
      const msg =
        err instanceof FiltersApiError
          ? err.message
          : t("community.deleteFailed", { fallback: "Delete failed" });
      toast.error(msg);
    }
  }

  return (
    <div className="border-t border-border px-3 py-2 space-y-3 bg-background/50">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={onVote}
          disabled={voting || !isSignedIn}
          title={
            isSignedIn
              ? t("community.toggleVote", { fallback: "Toggle vote" })
              : t("community.signInToVote", { fallback: "Sign in to vote" })
          }
          className={cn(
            "flex items-center gap-1 hover:text-primary transition-colors",
            !isSignedIn && "cursor-not-allowed opacity-60",
          )}
        >
          {voting ? (
            <ReloadIcon className="h-3 w-3 animate-spin" />
          ) : (
            <Heart className="h-3 w-3" />
          )}
          {t("community.vote", { fallback: "Vote" })}
        </button>
        <span>•</span>
        <span>
          {t("community.by", {
            fallback: "by {{user}}",
            vars: {
              user:
                meta.userId === myUserId
                  ? t("community.you", { fallback: "you" })
                  : meta.userId,
            },
          })}
        </span>
        <span>•</span>
        <span>
          {t("community.updatedAgo", {
            fallback: "updated {{time}}",
            vars: { time: formatTimestamp(meta.updatedAt, t) },
          })}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          {t("community.comments", {
            fallback: "Comments ({{count}})",
            vars: { count: String(meta.commentCount) },
          })}
        </p>
        {comments.length === 0 && !commentsLoading && (
          <p className="text-xs text-muted-foreground">
            {t("community.noComments", { fallback: "No comments yet." })}
          </p>
        )}
        <ul className="space-y-1.5 max-h-48 overflow-y-auto">
          {comments.map((c) => (
            <li key={c.id} className="text-xs flex gap-2 items-start group">
              <span className="text-muted-foreground shrink-0 tabular-nums">
                {formatTimestamp(c.createdAt, t)}
              </span>
              <span className="text-muted-foreground shrink-0">
                {c.userId === myUserId
                  ? t("community.you", { fallback: "you" })
                  : c.userId}
                :
              </span>
              <span className="grow wrap-break-word">{c.body}</span>
              {c.userId === myUserId && (
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => deleteOwnComment(c.id)}
                  title={t("community.deleteComment", {
                    fallback: "Delete comment",
                  })}
                >
                  <Trash className="h-3 w-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
        {commentsCursor !== null && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-primary"
            onClick={loadMoreComments}
            disabled={commentsLoading}
          >
            {t("community.loadMoreComments", {
              fallback: "Load more comments",
            })}
          </button>
        )}
        {isSignedIn ? (
          <form onSubmit={postComment} className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("community.commentPlaceholder", {
                fallback: "Write a comment…",
              })}
              className="h-8 text-sm"
              maxLength={4000}
            />
            <Button
              type="submit"
              size="sm"
              disabled={posting || !newComment.trim()}
            >
              {t("community.post", { fallback: "Post" })}
            </Button>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            {t("community.signInToVoteOrComment", {
              fallback: "Sign in to vote or comment.",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

function formatTimestamp(seconds: number, t: ReturnType<typeof useT>): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - seconds;
  if (diff < 60) return t("community.justNow", { fallback: "just now" });
  if (diff < 3600)
    return t("community.minutesShort", {
      fallback: "{{count}}m",
      vars: { count: String(Math.floor(diff / 60)) },
    });
  if (diff < 86400)
    return t("community.hoursShort", {
      fallback: "{{count}}h",
      vars: { count: String(Math.floor(diff / 3600)) },
    });
  if (diff < 604800)
    return t("community.daysShort", {
      fallback: "{{count}}d",
      vars: { count: String(Math.floor(diff / 86400)) },
    });
  return new Date(seconds * 1000).toLocaleDateString();
}
