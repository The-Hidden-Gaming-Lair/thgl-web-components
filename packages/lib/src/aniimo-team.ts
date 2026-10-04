/**
 * Aniimo Team Builder — pure logic over `config/team-builder.json` (data-forge
 * `aniimo/components.ts` → `teamBuilder`). Runs on server (per-Aniimo matchup
 * pages) and client (the builder).
 *
 * Damage model, straight from the game tables:
 *  - an attack's element is its skill's element; the multiplier against a
 *    defender is `chart[attackElement][defenderMainElement]` (element_against_data);
 *  - a defender is hit on its MAIN element (`mainElementType`); secondary
 *    element affinities are shown but do not change incoming damage.
 */

export type TeamBuilderSkill = {
  id: string;
  element?: string;
  /** 0 basic attack, 1 passive, 2 action, 3 skill, 4 ultimate, 5 special. */
  type: number;
  power?: number;
  ep?: number;
  cd?: number;
};

export type TeamBuilderSpecies = {
  main: string;
  elements: string[];
  role?: string;
  stage?: number;
  /** HP, ATK, Special ATK, DEF, Special DEF. */
  stats: number[];
  skills: TeamBuilderSkill[];
};

export type TeamBuilderData = {
  /** `typeChartId` = the codex `type_chart` entry carrying the element's badge icon. */
  elements: { id: string; color?: string; typeChartId?: string }[];
  /** attacker element → defender element → damage multiplier. */
  chart: Record<string, Record<string, number>>;
  /** `codexId` = the codex `roles` entry (name + role badge icon). */
  roles: { id: string; codexId?: string }[];
  damageSkillTypes: number[];
  species: Record<string, TeamBuilderSpecies>;
  /** The game's own recommended Aniimo per element and role. */
  recommended: { element: string; roles: Record<string, string[]> }[];
};

/** One team slot: a species and the skills switched OFF for it. */
export type TeamMember = { id: string; off?: string[] };

export const TEAM_SIZE = 4;
export const STAT_KEYS = ["hp", "atk", "spAtk", "def", "spDef"] as const;

export function multiplier(
  data: TeamBuilderData,
  attack: string | undefined,
  defender: string,
): number {
  if (!attack) return 1;
  return data.chart[attack]?.[defender] ?? 1;
}

/** Damaging skills with an element on the chart, strongest first. */
export function damageSkills(
  data: TeamBuilderData,
  speciesId: string,
): TeamBuilderSkill[] {
  const sp = data.species[speciesId];
  if (!sp) return [];
  const types = new Set(data.damageSkillTypes);
  return sp.skills
    .filter(
      (s) =>
        types.has(s.type) &&
        !!s.power &&
        !!s.element &&
        !!data.chart[s.element],
    )
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0));
}

/** The damaging skills a slot actually uses (all of them minus switched-off ones). */
export function activeSkills(
  data: TeamBuilderData,
  member: TeamMember,
): TeamBuilderSkill[] {
  const off = new Set(member.off ?? []);
  return damageSkills(data, member.id).filter((s) => !off.has(s.id));
}

export type CoverageHit = {
  element: string;
  /** Best multiplier any team skill reaches against this defending element. */
  multiplier: number;
  /** Every (member, skill) reaching that best multiplier. */
  by: { member: string; skill: string; power: number }[];
};

/** For every defending element: the team's best attack multiplier and who delivers it. */
export function offenseCoverage(
  data: TeamBuilderData,
  members: TeamMember[],
): CoverageHit[] {
  return data.elements.map(({ id: def }) => {
    let best = 0;
    let by: CoverageHit["by"] = [];
    for (const m of members) {
      for (const s of activeSkills(data, m)) {
        const x = multiplier(data, s.element, def);
        if (x > best) {
          best = x;
          by = [];
        }
        if (x === best)
          by.push({ member: m.id, skill: s.id, power: s.power ?? 0 });
      }
    }
    return { element: def, multiplier: best || 1, by };
  });
}

export type DefenseRow = {
  /** Attacking element. */
  element: string;
  /** Damage multiplier each member takes from it, in team order. */
  taken: number[];
  weak: number;
  resist: number;
};

/** For every attacking element: what each member takes (on its main element). */
export function defenseProfile(
  data: TeamBuilderData,
  members: TeamMember[],
): DefenseRow[] {
  return data.elements.map(({ id: atk }) => {
    const taken = members.map((m) =>
      multiplier(data, atk, data.species[m.id]?.main ?? ""),
    );
    return {
      element: atk,
      taken,
      weak: taken.filter((x) => x > 1).length,
      resist: taken.filter((x) => x < 1).length,
    };
  });
}

/** Elements that hit two or more members super-effectively. */
export function sharedWeaknesses(
  data: TeamBuilderData,
  members: TeamMember[],
): string[] {
  return defenseProfile(data, members)
    .filter((r) => r.weak >= 2)
    .map((r) => r.element);
}

export function roleCounts(
  data: TeamBuilderData,
  members: TeamMember[],
): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(
    data.roles.map((r) => [r.id, 0]),
  );
  for (const m of members) {
    const role = data.species[m.id]?.role;
    if (role && role in out) out[role]++;
  }
  return out;
}

export type TeamSummary = {
  superEffective: string[];
  notCovered: string[];
  shared: string[];
  missingRoles: string[];
  stats: number[];
};

export function summarizeTeam(
  data: TeamBuilderData,
  members: TeamMember[],
): TeamSummary {
  const cov = offenseCoverage(data, members);
  const roles = roleCounts(data, members);
  const stats = STAT_KEYS.map((_, i) =>
    members.reduce((a, m) => a + (data.species[m.id]?.stats[i] ?? 0), 0),
  );
  return {
    superEffective: cov.filter((c) => c.multiplier > 1).map((c) => c.element),
    notCovered: cov.filter((c) => c.multiplier <= 1).map((c) => c.element),
    shared: sharedWeaknesses(data, members),
    missingRoles: Object.entries(roles)
      .filter(([, n]) => n === 0)
      .map(([r]) => r),
    stats,
  };
}

export type Counter = {
  id: string;
  /** Best multiplier of its own skills against the enemy's element. */
  offense: number;
  /** Strongest skill reaching that multiplier. */
  skill?: TeamBuilderSkill;
  /** Damage it takes from attacks of the enemy's element. */
  taken: number;
};

/**
 * Every Aniimo ranked against an enemy element (a boss, a Sanctum, a rival):
 * super-effective skills first, then the least damage taken, then the stronger
 * skill and the higher attack stat.
 */
export function rankCounters(data: TeamBuilderData, enemy: string): Counter[] {
  const out: Counter[] = [];
  for (const [id, sp] of Object.entries(data.species)) {
    let offense = 0;
    let skill: TeamBuilderSkill | undefined;
    for (const s of damageSkills(data, id)) {
      const x = multiplier(data, s.element, enemy);
      if (
        x > offense ||
        (x === offense && (s.power ?? 0) > (skill?.power ?? 0))
      ) {
        offense = x;
        skill = s;
      }
    }
    out.push({
      id,
      offense: offense || 1,
      skill,
      taken: multiplier(data, enemy, sp.main),
    });
  }
  const atk = (id: string) => {
    const st = data.species[id]?.stats ?? [];
    return Math.max(st[1] ?? 0, st[2] ?? 0);
  };
  return out.sort(
    (a, b) =>
      b.offense - a.offense ||
      a.taken - b.taken ||
      (b.skill?.power ?? 0) - (a.skill?.power ?? 0) ||
      atk(b.id) - atk(a.id) ||
      a.id.localeCompare(b.id),
  );
}

export type Suggestion = {
  id: string;
  score: number;
  /** Elements this pick newly hits super-effectively. */
  covers: string[];
  /** Missing role it fills, if any. */
  fillsRole?: string;
  /** Shared weaknesses it does NOT add to (it resists or is neutral to them). */
  steadies: string[];
};

/**
 * Best picks for the next free slot: new super-effective coverage counts most,
 * then filling a role the team lacks, then not stacking another weakness on an
 * element the team is already weak to. Members already in the team are skipped.
 */
export function suggestNext(
  data: TeamBuilderData,
  members: TeamMember[],
  limit = 6,
): Suggestion[] {
  if (members.length >= TEAM_SIZE) return [];
  const taken = new Set(members.map((m) => m.id));
  const before = summarizeTeam(data, members);
  const covered = new Set(before.superEffective);
  const missing = new Set(before.missingRoles);
  const weakTo = defenseProfile(data, members)
    .filter((r) => r.weak >= 1)
    .map((r) => r.element);
  const out: Suggestion[] = [];
  for (const [id, sp] of Object.entries(data.species)) {
    if (taken.has(id)) continue;
    const skills = damageSkills(data, id);
    const covers = data.elements
      .map((e) => e.id)
      .filter(
        (def) =>
          !covered.has(def) &&
          skills.some((s) => multiplier(data, s.element, def) > 1),
      );
    const fillsRole = sp.role && missing.has(sp.role) ? sp.role : undefined;
    const steadies = weakTo.filter((atk) => multiplier(data, atk, sp.main) < 1);
    const stacks = weakTo.filter((atk) => multiplier(data, atk, sp.main) > 1);
    const score =
      covers.length * 3 +
      (fillsRole ? 4 : 0) +
      steadies.length * 2 -
      stacks.length * 2;
    out.push({ id, score, covers, fillsRole, steadies });
  }
  const statSum = (id: string) =>
    (data.species[id]?.stats ?? []).reduce((a, b) => a + b, 0);
  return out
    .sort(
      (a, b) =>
        b.score - a.score ||
        statSum(b.id) - statSum(a.id) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limit);
}

/** Teammates for a species that cover the elements it is weak to (matchup pages). */
export function partnersFor(
  data: TeamBuilderData,
  speciesId: string,
  limit = 6,
): { id: string; resists: string[] }[] {
  const sp = data.species[speciesId];
  if (!sp) return [];
  const weakTo = data.elements
    .map((e) => e.id)
    .filter((atk) => multiplier(data, atk, sp.main) > 1);
  return Object.entries(data.species)
    .filter(([id]) => id !== speciesId)
    .map(([id, other]) => ({
      id,
      resists: weakTo.filter((atk) => multiplier(data, atk, other.main) < 1),
      stat: other.stats.reduce((a, b) => a + b, 0),
    }))
    .filter((p) => p.resists.length > 0)
    .sort(
      (a, b) =>
        b.resists.length - a.resists.length ||
        b.stat - a.stat ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limit)
    .map(({ id, resists }) => ({ id, resists }));
}

/** `?t=` value: slots joined by ",", each `id` or `id!skillA.skillB` (skills switched off). */
export function encodeTeam(members: TeamMember[]): string {
  return members
    .map((m) => (m.off?.length ? `${m.id}!${m.off.join(".")}` : m.id))
    .join(",");
}

export function decodeTeam(
  data: TeamBuilderData,
  value: string | null | undefined,
): TeamMember[] {
  if (!value) return [];
  const out: TeamMember[] = [];
  for (const part of value.split(",")) {
    const [id, offRaw] = part.split("!");
    if (!id || !data.species[id] || out.some((m) => m.id === id)) continue;
    const valid = new Set(data.species[id].skills.map((s) => s.id));
    const off = (offRaw ?? "").split(".").filter((s) => valid.has(s));
    out.push(off.length ? { id, off } : { id });
    if (out.length === TEAM_SIZE) break;
  }
  return out;
}

/** The game's recommended picks for an element as a ready team (one per role, in role order). */
export function recommendedTeam(
  data: TeamBuilderData,
  element: string,
): TeamMember[] {
  const rec = data.recommended.find((r) => r.element === element);
  if (!rec) return [];
  const picks: TeamMember[] = [];
  for (const role of data.roles.map((r) => r.id)) {
    const id = rec.roles[role]?.[0];
    if (id && !picks.some((p) => p.id === id)) picks.push({ id });
    if (picks.length === TEAM_SIZE) break;
  }
  return picks;
}
