"use client";

import { useState } from "react";
import { games, type StatusDocument } from "@repo/lib";

export function StatusAdminPanel({ doc }: { doc: StatusDocument }) {
  const [game, setGame] = useState(games[0]?.id ?? "");
  const [gameState, setGameState] = useState<
    "operational" | "degraded" | "outage"
  >("degraded");
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState<"degraded" | "outage">("degraded");
  const [busy, setBusy] = useState(false);

  async function post(url: string, payload: unknown) {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        location.reload();
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

  const openIncidents = doc.incidents.filter((i) => i.resolvedAt === null);

  return (
    <div className="bg-muted/30 rounded-lg p-6 space-y-6 border border-primary/30">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Admin
      </h2>

      {/* Set game live-mode status */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Set game live-mode status</p>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="bg-background border border-border rounded px-2 py-1 text-sm"
          >
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
          <select
            value={gameState}
            onChange={(e) =>
              setGameState(
                e.target.value as "operational" | "degraded" | "outage",
              )
            }
            className="bg-background border border-border rounded px-2 py-1 text-sm"
          >
            <option value="operational">Operational (clear)</option>
            <option value="degraded">Degraded</option>
            <option value="outage">Outage</option>
          </select>
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-background border border-border rounded px-2 py-1 text-sm flex-1 min-w-[180px]"
          />
          <button
            disabled={busy}
            onClick={() =>
              post("/api/status/flags", {
                game,
                state: gameState,
                note: note.trim() || null,
              })
            }
            className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {/* Open incident */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Open incident</p>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background border border-border rounded px-2 py-1 text-sm flex-1 min-w-[200px]"
            />
            <select
              value={severity}
              onChange={(e) =>
                setSeverity(e.target.value as "degraded" | "outage")
              }
              className="bg-background border border-border rounded px-2 py-1 text-sm"
            >
              <option value="degraded">Degraded</option>
              <option value="outage">Outage</option>
            </select>
          </div>
          <textarea
            placeholder="Body (optional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm"
          />
          <button
            disabled={busy || !title.trim()}
            onClick={() =>
              post("/api/status/incidents", {
                action: "open",
                title: title.trim(),
                body: body.trim() || null,
                severity,
              })
            }
            className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            Open Incident
          </button>
        </div>
      </div>

      {/* Open incidents list */}
      {openIncidents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Open Incidents</p>
          {openIncidents.map((incident) => (
            <div
              key={incident.id}
              className="flex items-center justify-between gap-3 text-sm py-1"
            >
              <span className="flex-1 text-muted-foreground">
                {incident.title}
              </span>
              <button
                disabled={busy}
                onClick={() =>
                  post("/api/status/incidents", {
                    action: "resolve",
                    id: incident.id,
                  })
                }
                className="px-2 py-0.5 rounded border border-border text-xs disabled:opacity-50"
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
