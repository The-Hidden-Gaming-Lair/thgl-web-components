import { requireStatusAdmin } from "@/lib/status-admin";
import { StatusAdminPanel } from "./status-admin-panel";
import { buildStatusDocument } from "@/lib/status-document";
import { type StatusDocument, type StatusState } from "@repo/lib";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Status - The Hidden Gaming Lair",
  description: "Live health of TH.GL services, apps, and game integrations.",
  robots: { index: false, follow: false },
};

const DOT: Record<StatusState, string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  outage: "bg-red-500",
};

const HERO: Record<StatusState, string> = {
  operational: "All systems operational",
  degraded: "Some systems degraded",
  outage: "Service outage",
};

const INCIDENT_STYLE: Record<
  "degraded" | "outage",
  { border: string; bg: string; dot: string }
> = {
  degraded: {
    border: "border-amber-500/50",
    bg: "bg-amber-500/10",
    dot: "bg-amber-500",
  },
  outage: {
    border: "border-red-500/50",
    bg: "bg-red-500/10",
    dot: "bg-red-500",
  },
};

function formatTime(unix: number) {
  return new Date(unix * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Uptime({ value }: { value: number | null }) {
  if (value === null)
    return <span className="text-muted-foreground/40">—</span>;
  const color =
    value >= 99.5
      ? "text-emerald-500"
      : value >= 95
        ? "text-amber-500"
        : "text-red-500";
  return <span className={color}>{value.toFixed(1)}%</span>;
}

export default async function StatusPage() {
  const [result, adminId] = await Promise.all([
    buildStatusDocument().catch(() => null),
    requireStatusAdmin(),
  ]);
  const doc: StatusDocument | null = result?.doc ?? null;

  if (!doc) {
    return (
      <section className="space-y-8 px-4 pt-10 pb-20 max-w-3xl mx-auto">
        <div className="bg-muted/30 rounded-lg p-6 text-center">
          <p className="text-muted-foreground">
            Status temporarily unavailable. Please try again shortly.
          </p>
        </div>
      </section>
    );
  }

  const open = doc.incidents.filter((i) => i.resolvedAt === null);
  const resolved = doc.incidents.filter((i) => i.resolvedAt !== null);

  return (
    <section className="space-y-8 px-4 pt-10 pb-20 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="flex items-center gap-3">
        <span
          className={`w-4 h-4 rounded-full shrink-0 ${DOT[doc.state]}`}
          aria-hidden
        />
        <h1 className="text-2xl font-bold">{HERO[doc.state]}</h1>
      </div>
      <p className="text-xs text-muted-foreground -mt-4">
        Updated {formatTime(doc.updatedAt)} — checks run every minute
      </p>

      {/* Active incidents */}
      {open.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active Incidents
          </h2>
          {open.map((incident) => {
            const style = INCIDENT_STYLE[incident.severity];
            return (
              <div
                key={incident.id}
                className={`rounded-lg border p-4 space-y-2 ${style.border} ${style.bg}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`}
                    aria-hidden
                  />
                  <span className="font-semibold text-sm">
                    {incident.title}
                  </span>
                </div>
                {incident.body && (
                  <p className="text-sm text-muted-foreground">
                    {incident.body}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Since {formatTime(incident.createdAt)}
                </p>
                {incident.affects.length > 0 &&
                  !incident.affects.includes("all") && (
                    <p className="text-xs text-muted-foreground">
                      Affects:{" "}
                      <span className="font-medium text-foreground">
                        {incident.affects.join(", ")}
                      </span>
                    </p>
                  )}
              </div>
            );
          })}
        </div>
      )}

      {/* Services */}
      <div className="bg-muted/30 rounded-lg p-6 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Services
        </h2>
        <div className="space-y-3">
          {doc.components.map((comp) => (
            <div key={comp.id} className="flex items-center gap-3 text-sm">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${DOT[comp.state]}`}
                aria-hidden
              />
              <span className="flex-1 font-medium">{comp.label}</span>
              {comp.detail && (
                <span className="text-amber-500 text-xs">{comp.detail}</span>
              )}
              {comp.latencyMs !== null && (
                <span className="text-xs text-muted-foreground">
                  {comp.latencyMs}ms
                </span>
              )}
              <span className="text-xs text-muted-foreground min-w-[60px] text-right">
                <Uptime value={comp.uptime24h} />
                {" / "}
                <Uptime value={comp.uptime7d} />
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground pt-1">Uptime: 24 h / 7 d</p>
      </div>

      {/* Games */}
      {doc.games.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Game Integrations
          </h2>
          <div className="space-y-3">
            {doc.games.map((game) => (
              <div key={game.id} className="text-sm space-y-1">
                <div className="flex items-center gap-3">
                  <span className="flex-1 font-medium">{game.label}</span>
                  {game.thglEvents !== null && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${DOT[game.thglEvents]}`}
                        aria-hidden
                      />
                      THGL events
                    </span>
                  )}
                  {game.owEvents !== null && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${DOT[game.owEvents]}`}
                        aria-hidden
                      />
                      Overwolf events
                    </span>
                  )}
                </div>
                {game.liveMode?.note && (
                  <p className="text-xs text-amber-500">{game.liveMode.note}</p>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            THGL events = our own live tracking (player position, live mode).
            Overwolf events = Overwolf's Game Events Provider, used by the
            Diablo IV, Sons of the Forest, and New World Overwolf apps.
          </p>
        </div>
      )}

      {/* Recent resolved incidents */}
      {resolved.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Incidents
          </h2>
          <div className="space-y-3">
            {resolved.map((incident) => (
              <div key={incident.id} className="text-sm space-y-0.5">
                <p className="font-medium">{incident.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(incident.createdAt)}
                  {incident.resolvedAt !== null && (
                    <> → {formatTime(incident.resolvedAt)}</>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin panel */}
      {adminId && <StatusAdminPanel doc={doc} />}
    </section>
  );
}
