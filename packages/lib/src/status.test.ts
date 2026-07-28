import {
  applyFlapSuppression,
  incidentMatchesSurface,
  overallState,
  worstState,
  type StatusIncident,
} from "./status";

describe("worstState", () => {
  it("returns the worst of the given states", () => {
    expect(worstState(["operational", "degraded"])).toBe("degraded");
    expect(worstState(["degraded", "outage", "operational"])).toBe("outage");
    expect(worstState([])).toBe("operational");
  });
});

describe("applyFlapSuppression", () => {
  // Input is newest-first raw states; [0] is the current run.
  it("stays operational until 3 consecutive failures", () => {
    expect(applyFlapSuppression(["outage"])).toBe("operational");
    expect(applyFlapSuppression(["outage", "outage"])).toBe("operational");
    expect(applyFlapSuppression(["outage", "outage", "outage"])).toBe("outage");
  });
  it("recovers on the first success", () => {
    expect(applyFlapSuppression(["operational", "outage", "outage"])).toBe(
      "operational",
    );
  });
  it("surfaces the newest state once suppression clears", () => {
    expect(applyFlapSuppression(["degraded", "outage", "outage"])).toBe(
      "degraded",
    );
  });
  it("treats short history (new component) as operational by design", () => {
    expect(applyFlapSuppression([])).toBe("operational");
    expect(applyFlapSuppression(["degraded"])).toBe("operational");
  });
  it("only considers the newest 3 entries", () => {
    expect(
      applyFlapSuppression(["operational", "outage", "outage", "outage"]),
    ).toBe("operational");
  });
});

describe("overallState", () => {
  it("is the worst across components, games, and active incidents", () => {
    expect(
      overallState({
        componentStates: ["operational", "degraded"],
        gameStates: ["operational"],
        activeIncidentSeverities: [],
      }),
    ).toBe("degraded");
    expect(
      overallState({
        componentStates: ["operational"],
        gameStates: ["operational"],
        activeIncidentSeverities: ["outage"],
      }),
    ).toBe("outage");
  });
  it("is operational when everything is empty", () => {
    expect(
      overallState({
        componentStates: [],
        gameStates: [],
        activeIncidentSeverities: [],
      }),
    ).toBe("operational");
  });
});

describe("incidentMatchesSurface", () => {
  const incident = (affects: string[]): StatusIncident => ({
    id: "i1",
    title: "t",
    body: null,
    severity: "degraded",
    affects,
    source: "manual",
    createdAt: 0,
    resolvedAt: null,
  });
  const surface = { components: ["auth", "database", "cdn"], game: "palworld" };
  it("'all' matches every surface", () => {
    expect(incidentMatchesSurface(incident(["all"]), surface)).toBe(true);
  });
  it("matches on component overlap", () => {
    expect(incidentMatchesSurface(incident(["auth"]), surface)).toBe(true);
    expect(incidentMatchesSurface(incident(["actors-api"]), surface)).toBe(
      false,
    );
  });
  it("matches on the current game", () => {
    expect(incidentMatchesSurface(incident(["palworld"]), surface)).toBe(true);
    expect(incidentMatchesSurface(incident(["diablo4"]), surface)).toBe(false);
  });
  it("ignores game-scoped incidents when the surface has no game", () => {
    expect(
      incidentMatchesSurface(incident(["palworld"]), {
        components: ["auth"],
        game: null,
      }),
    ).toBe(false);
  });
});
