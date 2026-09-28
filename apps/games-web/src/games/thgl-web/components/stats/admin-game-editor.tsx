"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Input, Label } from "@repo/ui/controls";
import {
  PLATFORM_CLIENTS,
  PLATFORM_LABELS,
  STATS_STATUSES,
  STATUS_LABELS,
  type PlatformEntry,
  type StatsGame,
} from "@/lib/stats-types";
import { useMyRequests } from "./use-my-requests";

/** Admin-only (PATREON_SPECIAL_USERS) editor; the server re-checks on PATCH. */
export function AdminGameEditor({ game }: { game: StatsGame }) {
  const { state: my } = useMyRequests();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => ({
    title: game.title,
    status: game.status,
    steamAppId: game.steamAppId ? String(game.steamAppId) : "",
    thglId: game.thglId ?? "",
    discordInvite: game.discordInvite ?? "",
    twitchGameId: game.twitchGameId ?? "",
    releaseDate: game.releaseDate ?? "",
    url: game.url ?? "",
    note: game.note ?? "",
  }));
  const [platforms, setPlatforms] = useState<PlatformEntry[]>(game.platforms);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!my?.isAdmin) return null;

  const setField =
    (key: keyof typeof draft) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDraft((d) => ({ ...d, [key]: e.target.value }));

  function togglePlatform(client: PlatformEntry["client"], on: boolean) {
    setPlatforms((ps) =>
      on ? [...ps, { client }] : ps.filter((p) => p.client !== client),
    );
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/stats/games/${encodeURIComponent(game.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...draft,
            steamAppId: draft.steamAppId ? Number(draft.steamAppId) : null,
            platforms: PLATFORM_CLIENTS.flatMap((c) =>
              platforms.filter((p) => p.client === c),
            ),
          }),
        },
      );
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Save failed");
      setMessage("Saved. The public page updates within 10 minutes.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="text-center">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Edit (admin)
        </Button>
      </div>
    );
  }

  const text = (
    key: keyof typeof draft,
    label: string,
    placeholder?: string,
  ) => (
    <div className="space-y-1">
      <Label htmlFor={`edit-${key}`}>{label}</Label>
      <Input
        id={`edit-${key}`}
        value={draft[key]}
        onChange={setField(key)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Admin
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {text("title", "Title")}
        <div className="space-y-1">
          <Label htmlFor="edit-status">Status</Label>
          <select
            id="edit-status"
            value={draft.status}
            onChange={setField("status")}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            {STATS_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        {text("steamAppId", "Steam app id")}
        {text("thglId", "TH.GL game id (games.ts)")}
        {text("discordInvite", "Official Discord invite code", "e.g. palworld")}
        {text(
          "twitchGameId",
          "Twitch category id",
          "auto-resolved by title when empty",
        )}
        {text("releaseDate", "Release date")}
        {text("url", "Official page")}
      </div>
      {text("note", "Public note", "Shown under the title")}
      <div className="space-y-2">
        <Label>Platforms</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {PLATFORM_CLIENTS.map((client) => {
            const entry = platforms.find((p) => p.client === client);
            return (
              <div key={client} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`platform-${client}`}
                  checked={Boolean(entry)}
                  onChange={(e) => togglePlatform(client, e.target.checked)}
                />
                <label
                  htmlFor={`platform-${client}`}
                  className="w-40 shrink-0 text-sm"
                >
                  {PLATFORM_LABELS[client]}
                </label>
                {entry && (
                  <Input
                    value={entry.url ?? ""}
                    placeholder="https://…"
                    className="h-8"
                    onChange={(e) =>
                      setPlatforms((ps) =>
                        ps.map((p) =>
                          p.client === client
                            ? { ...p, url: e.target.value || undefined }
                            : p,
                        ),
                      )
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={busy}>
          {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          Save
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Close
        </Button>
        {message && (
          <span className="text-sm text-muted-foreground">{message}</span>
        )}
      </div>
    </section>
  );
}
