"use client";

import { useState } from "react";
import type { AppInvite } from "@/lib/invites";

export function InvitesAdminPanel({
  games,
  invites,
}: {
  games: { id: string; title: string }[];
  invites: AppInvite[];
}) {
  const [app, setApp] = useState(games[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(method: "POST" | "DELETE", payload: unknown) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/invites", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Fresh server render (the page is force-dynamic, but a unique query
        // param also defeats any intermediate cache — same as the status page).
        location.assign(`${location.pathname}?updated=${Date.now()}`);
      } else {
        const text = await res.text().catch(() => `HTTP ${res.status}`);
        alert(`Error: ${text}`);
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  const byApp = new Map<string, AppInvite[]>();
  for (const invite of invites) {
    const list = byApp.get(invite.app) ?? [];
    list.push(invite);
    byApp.set(invite.app, list);
  }

  return (
    <div className="space-y-8">
      <div className="bg-muted/30 rounded-lg p-6 space-y-3 border border-primary/30">
        <p className="text-sm font-semibold">Add invite</p>
        {games.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No invite-only companion games are configured (games.ts
            `companion.inviteOnly`).
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={app}
              onChange={(e) => setApp(e.target.value)}
              className="bg-background border border-border rounded px-2 py-1 text-sm"
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Patreon user id"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-background border border-border rounded px-2 py-1 text-sm flex-1 min-w-[220px]"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-background border border-border rounded px-2 py-1 text-sm flex-1 min-w-[160px]"
            />
            <button
              disabled={busy || !subject.trim()}
              onClick={() =>
                send("POST", {
                  app,
                  subject: subject.trim(),
                  note: note.trim() || null,
                })
              }
              className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              Invite
            </button>
          </div>
        )}
      </div>

      {games.map((game) => {
        const list = byApp.get(game.id) ?? [];
        return (
          <div key={game.id} className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-semibold">{game.title}</h2>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {list.length} invited
              </span>
            </div>
            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invites yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {list.map((invite) => (
                  <li
                    key={`${invite.app}:${invite.subject}`}
                    className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm"
                  >
                    <span className="font-mono">{invite.subject}</span>
                    {invite.note && (
                      <span className="text-muted-foreground">
                        {invite.note}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(invite.createdAt * 1000).toLocaleDateString()}
                    </span>
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (confirm(`Remove invite for ${invite.subject}?`)) {
                          send("DELETE", {
                            app: invite.app,
                            subject: invite.subject,
                          });
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
