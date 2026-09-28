"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Search } from "lucide-react";
import { cn } from "@repo/lib";
import { Button, Input } from "@repo/ui/controls";
import {
  discordThreadUrl,
  STATUS_LABELS,
  type StatsGame,
  type StatsGameWithSummary,
  type StatsStatus,
} from "@/lib/stats-types";
import { formatCount, formatDate } from "./format";
import { StatusBadge } from "./status-badge";
import { signInUrl, useMyRequests } from "./use-my-requests";
import { VoteButton } from "./vote-button";

const SECTION =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

type SearchResult = {
  appId: number;
  name: string;
  imageUrl: string | null;
  tracked: { id: string; status: StatsStatus } | null;
};

async function postJson<T>(
  url: string,
  body: unknown,
  method = "POST",
): Promise<T> {
  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json;
}

function GameThumb({ src }: { src: string | null }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={92}
      height={43}
      loading="lazy"
      className="h-[43px] w-[92px] shrink-0 rounded object-cover"
    />
  ) : (
    <span className="h-[43px] w-[92px] shrink-0 rounded bg-muted" />
  );
}

function RequestForm({
  onDone,
}: {
  onDone: (message: string, id?: string) => void;
}) {
  const { state: my } = useMyRequests();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState<number | "manual" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/stats/search?q=${encodeURIComponent(q)}`, {
        signal: ctrl.signal,
      })
        .then((r) => r.json() as Promise<{ results?: SearchResult[] }>)
        .then((b) => setResults(b.results ?? []))
        .catch(() => undefined)
        .finally(() => setSearching(false));
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  async function requestSteam(r: SearchResult) {
    setBusy(r.appId);
    setError(null);
    try {
      const res = await postJson<{ id: string; created: boolean }>(
        "/api/stats/requests",
        {
          steamAppId: r.appId,
        },
      );
      onDone(
        res.created
          ? `${r.name} was added. Its stats start collecting now.`
          : `Your vote for ${r.name} was counted.`,
        res.id,
      );
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  async function requestManual(e: React.FormEvent) {
    e.preventDefault();
    setBusy("manual");
    setError(null);
    try {
      await postJson("/api/stats/requests", { title, url });
      onDone(`Thanks! ${title} will show up here once it has been reviewed.`);
      setTitle("");
      setUrl("");
      setManual(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  if (my && !my.signedIn) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6 text-center">
        <p className="text-muted-foreground">
          Sign in to request games and vote. Any Patreon account works, it
          doesn&apos;t need a subscription.
        </p>
        <Button asChild>
          <a href={signInUrl()}>Sign in with Patreon</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Steam for a game…"
          // Inline: the Input's own px-3 wins over a pl-* utility here.
          style={{ paddingLeft: "2.25rem" }}
          aria-label="Search Steam for a game"
          disabled={!my}
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {results && (
        <ul className="divide-y rounded-md border">
          {results.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">
              No Steam games found.
            </li>
          )}
          {results.map((r) => (
            <li key={r.appId} className="flex items-center gap-3 p-2">
              <GameThumb src={r.imageUrl} />
              <span className="min-w-0 flex-1 truncate">{r.name}</span>
              {r.tracked?.status === "supported" ? (
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/stats/${r.tracked.id}`}>
                    <Check className="mr-1 h-4 w-4" /> Supported
                  </Link>
                </Button>
              ) : r.tracked?.status === "declined" ? (
                <span className="text-xs text-muted-foreground">Declined</span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => requestSteam(r)}
                  disabled={busy !== null}
                >
                  {busy === r.appId && (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  )}
                  {r.tracked ? "Vote" : "Request"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {manual ? (
        <form
          onSubmit={requestManual}
          className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Game title"
            aria-label="Game title"
            required
            minLength={2}
            maxLength={80}
          />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Official website or store page (https://…)"
            aria-label="Official page"
            type="url"
            required
          />
          <Button type="submit" disabled={busy !== null}>
            {busy === "manual" && (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            )}
            Send request
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setManual(true)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Not on Steam? Request it with a link instead.
        </button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function PendingReview({
  games,
  isAdmin,
  onChanged,
}: {
  games: StatsGame[];
  isAdmin: boolean;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  if (games.length === 0) return null;
  async function act(id: string, action: "requested" | "declined" | "delete") {
    setBusy(id);
    try {
      if (action === "delete")
        await postJson(
          `/api/stats/games/${encodeURIComponent(id)}`,
          undefined,
          "DELETE",
        );
      else
        await postJson(
          `/api/stats/games/${encodeURIComponent(id)}`,
          { status: action },
          "PATCH",
        );
      onChanged();
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="space-y-3">
      <h2 className={SECTION}>
        {isAdmin ? "Waiting for review" : "Your requests waiting for review"}
      </h2>
      <ul className="divide-y rounded-lg border">
        {games.map((g) => (
          <li key={g.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <div className="font-medium">{g.title}</div>
              {g.url && (
                <a
                  href={g.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="block truncate text-xs text-muted-foreground hover:text-foreground"
                >
                  {g.url}
                </a>
              )}
              <div className="text-xs text-muted-foreground">
                Requested {formatDate(g.createdAt)}
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => act(g.id, "requested")}
                  disabled={busy === g.id}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => act(g.id, "declined")}
                  disabled={busy === g.id}
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => act(g.id, "delete")}
                  disabled={busy === g.id}
                >
                  Delete
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

const BOARD_TABS: StatsStatus[] = ["requested", "watching", "in_progress"];

export function RequestsBoard({ games }: { games: StatsGameWithSummary[] }) {
  const { state: my, setState, refresh } = useMyRequests();
  const [tab, setTab] = useState<StatsStatus>("requested");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      games
        .filter((g) => g.status === tab)
        .sort(
          (a, b) =>
            b.voteCount - a.voteCount ||
            (b.summary.steamCcu ?? -1) - (a.summary.steamCcu ?? -1),
        ),
    [games, tab],
  );

  function onVoted(id: string, voted: boolean) {
    setState((s) =>
      s
        ? {
            ...s,
            votes: voted ? [...s.votes, id] : s.votes.filter((v) => v !== id),
          }
        : s,
    );
  }

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className={SECTION}>Request a game</h2>
        <RequestForm
          onDone={(message) => {
            setNotice(message);
            void refresh();
          }}
        />
        {notice && (
          <p className="text-sm text-emerald-400" role="status">
            {notice} New requests appear in the list within 10 minutes.
          </p>
        )}
      </section>

      {my && my.pending.length > 0 && (
        <PendingReview
          games={my.pending}
          isAdmin={my.isAdmin}
          onChanged={() => void refresh()}
        />
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {BOARD_TABS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTab(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                tab === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {STATUS_LABELS[s]}{" "}
              <span className="opacity-70">
                {games.filter((g) => g.status === s).length}
              </span>
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            {tab === "requested"
              ? "No requests yet. Be the first!"
              : "Nothing here right now."}
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {rows.map((g) => (
              <li key={g.id} className="flex items-center gap-3 p-3">
                <VoteButton
                  gameId={g.id}
                  initialCount={g.voteCount}
                  my={my}
                  onVoted={onVoted}
                  onError={setError}
                  size="sm"
                />
                <Link
                  href={`/stats/${g.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 hover:text-primary"
                >
                  <span className="max-sm:hidden">
                    <GameThumb src={g.imageUrl} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {g.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {g.releaseDate
                        ? `Release: ${g.releaseDate}`
                        : g.steamAppId
                          ? "Steam"
                          : "Not on Steam"}
                    </span>
                  </span>
                </Link>
                <div className="text-right text-sm max-sm:hidden">
                  <div className="tabular-nums">
                    {formatCount(g.summary.steamCcu)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    playing now
                  </div>
                </div>
                <div className="text-right text-sm max-md:hidden">
                  <div className="tabular-nums">
                    {formatCount(g.summary.steamFollowers)}
                  </div>
                  <div className="text-xs text-muted-foreground">followers</div>
                </div>
                {g.discordThreadId && (
                  <a
                    href={discordThreadUrl(g.discordThreadId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground max-md:hidden"
                    title={`Discuss ${g.title} on Discord`}
                  >
                    Discord
                  </a>
                )}
                <span className="max-lg:hidden">
                  <StatusBadge status={g.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
