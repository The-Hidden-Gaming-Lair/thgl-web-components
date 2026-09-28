"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Badge, Button } from "@repo/ui/controls";
import { ForumReply } from "@/games/thgl-web/components/forum-reply";
import type { DiscussionEntry, RequestComment } from "@/lib/stats-types";
import { signInUrl, useMyRequests } from "./use-my-requests";

const SECTION =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

/** "What should the map or app cover?" box; posts a web comment. */
export function CommentBox({
  gameId,
  title,
  onPosted,
  autoFocus,
}: {
  gameId: string;
  title: string;
  onPosted?: (comment: RequestComment) => void;
  autoFocus?: boolean;
}) {
  const { state: my } = useMyRequests();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  if (my && !my.signedIn) {
    return (
      <p className="text-sm text-muted-foreground">
        <a href={signInUrl()} className="text-primary hover:underline">
          Sign in
        </a>{" "}
        to add what the {title} map or app should cover.
      </p>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/stats/requests/${encodeURIComponent(gameId)}/comments`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        },
      );
      const body = (await res.json()) as RequestComment & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Could not post the comment");
      setText("");
      setPosted(true);
      onPosted?.(body);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not post the comment",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor={`comment-${gameId}`} className="text-sm font-medium">
        What should the {title} map or app cover?
      </label>
      <textarea
        id={`comment-${gameId}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Locations, features you'd use, useful links…"
        rows={3}
        maxLength={1000}
        autoFocus={autoFocus}
        disabled={!my || busy}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          size="sm"
          disabled={busy || text.trim().length < 3}
        >
          {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          Post comment
        </Button>
        {posted && !error && (
          <span className="text-sm text-muted-foreground">
            Thanks! It also shows up in the game&apos;s Discord post soon.
          </span>
        )}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}

export function GameDiscussion({
  gameId,
  title,
  entries,
  canComment,
  threadUrl,
}: {
  gameId: string;
  title: string;
  entries: DiscussionEntry[];
  canComment: boolean;
  threadUrl: string | null;
}) {
  const [items, setItems] = useState(entries);
  const { state: my, setState: setMy } = useMyRequests();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  if (!canComment && items.length === 0) return null;

  const canDelete = (entry: DiscussionEntry) =>
    entry.source === "web" &&
    Boolean(my?.isAdmin || my?.commentIds?.includes(entry.id));

  async function remove(entry: DiscussionEntry) {
    if (
      !window.confirm("Delete this comment? It's also removed from Discord.")
    ) {
      return;
    }
    setDeleting(entry.id);
    setDeleteError(null);
    try {
      const res = await fetch(
        `/api/stats/requests/${encodeURIComponent(gameId)}/comments/${encodeURIComponent(entry.id)}`,
        { method: "DELETE", credentials: "include" },
      );
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok)
        throw new Error(body.error ?? "Could not delete the comment");
      setItems((list) => list.filter((e) => e.id !== entry.id));
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Could not delete the comment",
      );
    } finally {
      setDeleting(null);
    }
  }
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={SECTION}>Discussion</h2>
        {threadUrl && (
          <a
            href={threadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Join the discussion on Discord
          </a>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map((entry) => (
            <ForumReply
              key={entry.id}
              authorName={entry.bot ? "TH.GL" : entry.authorName}
              authorAvatar={entry.authorAvatar}
              createdAt={entry.createdAt * 1000}
              text={entry.text}
              images={entry.images}
              badge={
                <Badge variant="outline" className="text-[10px]">
                  {entry.source === "web" ? "th.gl" : "Discord"}
                </Badge>
              }
              actions={
                canDelete(entry) ? (
                  <button
                    type="button"
                    onClick={() => remove(entry)}
                    disabled={deleting === entry.id}
                    title="Delete comment"
                    aria-label="Delete comment"
                    className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    {deleting === entry.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                ) : null
              }
            />
          ))}
        </div>
      )}
      {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
      {canComment && (
        <CommentBox
          gameId={gameId}
          title={title}
          onPosted={(c) => {
            // Own it right away so the delete button shows without a reload.
            setMy((s) =>
              s ? { ...s, commentIds: [...(s.commentIds ?? []), c.id] } : s,
            );
            setItems((list) => [
              ...list,
              {
                id: c.id,
                source: "web",
                authorName: c.authorName,
                authorAvatar: c.authorAvatar,
                bot: false,
                text: c.body,
                images: [],
                createdAt: c.createdAt,
              },
            ]);
          }}
        />
      )}
    </section>
  );
}
