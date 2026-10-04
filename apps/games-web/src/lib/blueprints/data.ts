import {
  DATA_FORGE_CDN_URL,
  fetchDatabaseIndex,
  resolveForgeUrl,
  type OnceHumanBlueprintData,
} from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";

/**
 * Blueprint star calculator data — for tenants that ship `config/blueprints.json`
 * (Once Human, data-forge `once-human/blueprints.ts`). Pages 404 elsewhere.
 */
export async function fetchBlueprintData(
  appName: string,
): Promise<OnceHumanBlueprintData | null> {
  const res = await fetch(
    await resolveForgeUrl(
      `${DATA_FORGE_CDN_URL}/${appName}/config/blueprints.json`,
    ),
    { next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  return res.json();
}

export type BlueprintIcon = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type BlueprintOption = {
  id: string;
  name: string;
  icon?: BlueprintIcon;
  kind: "weapon" | "armor";
  rarity: number;
  maxStar: number;
};

/** Localized name + codex icon per blueprint; weapons first, then by rarity and name. */
export async function getBlueprintOptions(
  appName: string,
  data: OnceHumanBlueprintData,
  dict: Record<string, string>,
): Promise<BlueprintOption[]> {
  const index = await fetchDatabaseIndex(appName).catch(() => []);
  const icons = new Map(
    index
      .filter((cat) => cat.type === "blueprints")
      .flatMap((cat) => cat.items)
      .filter((i) => i.icon && typeof i.icon === "object")
      .map((i) => [i.id, i.icon as unknown as BlueprintIcon] as const),
  );
  return Object.entries(data.blueprints)
    .map(([id, bp]) => ({
      id,
      name: resolveDict(dict, id),
      icon: icons.get(id),
      kind: bp.kind,
      rarity: bp.rarity,
      maxStar: bp.costs.length,
    }))
    .sort(
      (a, b) =>
        (a.kind === b.kind ? 0 : a.kind === "weapon" ? -1 : 1) ||
        b.rarity - a.rarity ||
        a.name.localeCompare(b.name),
    );
}

/** The `blueprints.*` UI strings (sent to the client). */
export function blueprintLabels(dict: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(dict).filter(([k]) => k.startsWith("blueprints.")),
  );
}
