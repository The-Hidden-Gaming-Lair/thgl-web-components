import {
  DATA_FORGE_CDN_URL,
  fetchDatabaseIndex,
  resolveForgeUrl,
  type IconSprite,
  type TeamBuilderData,
} from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";

/**
 * Team Builder data — for tenants that ship `config/team-builder.json`
 * (Aniimo, data-forge `aniimo/components.ts` → `teamBuilder`). Pages 404 elsewhere.
 */
export async function fetchTeamBuilderData(
  appName: string,
): Promise<TeamBuilderData | null> {
  const res = await fetch(
    await resolveForgeUrl(
      `${DATA_FORGE_CDN_URL}/${appName}/config/team-builder.json`,
    ),
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  return res.json();
}

export type TeamSpeciesInfo = {
  id: string;
  name: string;
  icon?: IconSprite;
};

/** Everything localized the builder shows: species, skills, elements, roles, UI strings. */
export type TeamBuilderNames = {
  species: TeamSpeciesInfo[];
  skills: Record<string, string>;
  elements: Record<string, string>;
  elementIcons: Record<string, IconSprite>;
  roles: Record<string, string>;
  roleIcons: Record<string, IconSprite>;
  labels: Record<string, string>;
};

/** Codex section whose entries share the team-builder species ids. */
const SPECIES_SECTION = "aniimo";

export async function getTeamBuilderNames(
  appName: string,
  data: TeamBuilderData,
  dict: Record<string, string>,
): Promise<TeamBuilderNames> {
  const index = await fetchDatabaseIndex(appName).catch(() => []);
  // Icons come from the codex index: species portraits, the element badges on the
  // type_chart entries and the role badges on the roles entries.
  const icons = new Map(
    index.flatMap((cat) =>
      cat.items.map((i) => [`${cat.type}/${i.id}`, i.icon] as const),
    ),
  );
  const iconOf = (section: string, id?: string) =>
    id ? (icons.get(`${section}/${id}`) as IconSprite | undefined) : undefined;
  const species = Object.keys(data.species)
    .map((id) => ({
      id,
      name: resolveDict(dict, id),
      icon: iconOf(SPECIES_SECTION, id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const skills: Record<string, string> = {};
  for (const sp of Object.values(data.species))
    for (const s of sp.skills) skills[s.id] ??= resolveDict(dict, s.id);
  const defined = <T>(entries: [string, T | undefined][]) =>
    Object.fromEntries(entries.filter((e): e is [string, T] => !!e[1]));
  return {
    species,
    skills,
    elements: Object.fromEntries(
      data.elements.map((e) => [
        e.id,
        resolveDict(dict, `teambuilder.element.${e.id}`),
      ]),
    ),
    elementIcons: defined(
      data.elements.map((e) => [e.id, iconOf("type_chart", e.typeChartId)]),
    ),
    roles: Object.fromEntries(
      data.roles.map((r) => [
        r.id,
        r.codexId ? resolveDict(dict, r.codexId) : r.id,
      ]),
    ),
    roleIcons: defined(
      data.roles.map((r) => [r.id, iconOf("roles", r.codexId)]),
    ),
    labels: Object.fromEntries(
      Object.entries(dict).filter(([k]) => k.startsWith("tb.")),
    ),
  };
}
