import { gameRunning } from "./games";
import { promisifyOverwolf } from "./promisify";

// Detection telemetry for the Overwolf apps WITHOUT the THGL plugin (Diablo 4 reads the
// player through Overwolf GEP). The plugin apps report from THGLOverwolfPlugin.dll
// (Core\DetectionTelemetry.cs), THGLApp from detection_telemetry.cpp - same payload:
// every 300 s POST https://actors-api.th.gl/telemetry/{game} with read health only, no
// positions. actors-api's hourly health check files broken reads into the THGL Inbox.

const PERIOD_MS = 300_000; // matches GET /config intervalS
const TICK_MS = 15_000;
const MAP_SAMPLE_MS = 10_000;
const MAX_MAPS = 20;

type Stats = {
  periodStart: number;
  playerReads: number;
  playerOk: number;
  runningS: number;
  maps: Set<string>;
  lastMapSample: number;
};

export type DetectionTelemetry = {
  onPlayerRead(ok: boolean, mapName?: string): void;
};

export function createDetectionTelemetry(
  game: string,
  gameClassId: number,
): DetectionTelemetry {
  // Random per app start (not per user/install): counts distinct sessions.
  const session = Math.random().toString(16).slice(2, 18);
  let running = false;
  let stats: Stats | null = null;
  let appVersion = "";
  promisifyOverwolf(overwolf.extensions.current.getManifest)()
    .then((manifest) => (appVersion = manifest.meta.version))
    .catch(() => {});

  const touch = () =>
    (stats ??= {
      periodStart: Date.now(),
      playerReads: 0,
      playerOk: 0,
      runningS: 0,
      maps: new Set(),
      lastMapSample: 0,
    });

  setInterval(() => {
    overwolf.games.getRunningGameInfo((res) => {
      running = gameRunning(res, gameClassId);
      if (running) {
        touch().runningS += TICK_MS / 1000;
      }
      const s = stats;
      if (!s) {
        return;
      }
      const age = Date.now() - s.periodStart;
      // Game closed: send what we have. Nothing read and not running: drop it.
      if (age < PERIOD_MS && running) {
        return;
      }
      stats = null;
      if (s.playerReads + s.runningS === 0) {
        return;
      }
      send(s, Math.round(age / 1000));
    });
  }, TICK_MS);

  function send(s: Stats, periodS: number) {
    fetch(`https://actors-api.th.gl/telemetry/${game}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Version": appVersion,
      },
      body: JSON.stringify({
        v: 1,
        client: "overwolf",
        appVersion,
        // Overwolf exposes no game build for GEP games.
        game: {},
        periodS,
        player: { reads: s.playerReads, ok: s.playerOk },
        actors: { reads: 0, ok: 0, nonEmpty: 0, types: {} },
        maps: [...s.maps],
        runningS: s.runningS,
        session,
      }),
    }).catch(() => {
      // best-effort
    });
  }

  return {
    onPlayerRead(ok, mapName) {
      // The GEP poll keeps running after the game closed; only reads while it runs count.
      if (!running) {
        return;
      }
      const s = touch();
      s.playerReads++;
      if (!ok) {
        return;
      }
      s.playerOk++;
      const now = Date.now();
      if (
        mapName &&
        now - s.lastMapSample >= MAP_SAMPLE_MS &&
        s.maps.size < MAX_MAPS
      ) {
        s.lastMapSample = now;
        s.maps.add(mapName.slice(0, 160));
      }
    },
  };
}
