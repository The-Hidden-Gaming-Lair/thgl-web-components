import { useSettingsStore } from "./settings";

/**
 * Palworld catch bonus: the game pays bonus EXP for the first catches of every
 * species, up to BP_PalGameSetting.CaptureExpBonusMaxCount (5). The Companion App
 * reads the player's own per-species counts (RecordData.PalCaptureCount) and
 * sends them as characterData `palCaptureCounts` ({palId: count}) (inbox #112).
 */
export const PAL_CAPTURE_BONUS_MAX = 5;

/** Filter groups whose values are catchable Pal species (data-forge palworld). */
const PAL_GROUPS = new Set(["pal_common", "pal_alpha", "pal_predator"]);

/** Species key of a marker type / capture-count key: "BOSS_SheepBall" → "sheepball". */
export function palSpeciesKey(id: string): string {
  return id.toLowerCase().replace(/^(boss|predator)_/, "");
}

let lastCounts: Record<string, number> | null = null;
let lastBySpecies: Map<string, number> | null = null;

/**
 * Capture counts keyed by species (alpha / predator catches count for their
 * species). Memoized on the input object: the live marker pass calls it ~10x/s.
 */
export function normalizePalCaptureCounts(
  counts: Record<string, number> | null | undefined,
): Map<string, number> | null {
  if (!counts) return null;
  if (counts === lastCounts) return lastBySpecies;
  const bySpecies = new Map<string, number>();
  for (const [key, value] of Object.entries(counts)) {
    if (typeof value !== "number") continue;
    const species = palSpeciesKey(key);
    bySpecies.set(species, (bySpecies.get(species) ?? 0) + value);
  }
  lastCounts = counts;
  lastBySpecies = bySpecies;
  return bySpecies;
}

/**
 * How often the player caught this marker's species, or null when the marker is
 * not a catchable Pal (or no counts are known). Absent species = never caught.
 */
export function palCaughtCount(
  type: string,
  group: string | undefined,
  counts: Map<string, number> | null,
): number | null {
  if (!counts || !group || !PAL_GROUPS.has(group)) return null;
  return counts.get(palSpeciesKey(type)) ?? 0;
}

/**
 * Keep the latest counts from a characterData payload, so the filter and badges
 * still work after the game closes. Skips identical payloads (sent every 5 s).
 */
export function rememberPalCaptureCounts(
  payload: Record<string, any> | null | undefined,
): void {
  const counts = payload?.palCaptureCounts;
  if (!counts || typeof counts !== "object") return;
  const settings = useSettingsStore.getState();
  if (JSON.stringify(settings.palCaptureCounts) === JSON.stringify(counts)) {
    return;
  }
  settings.setPalCaptureCounts(counts);
}
