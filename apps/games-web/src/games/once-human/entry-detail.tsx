import { fetchTiles, type TilesConfig } from "@repo/lib";
import { getStaticDictionary } from "@repo/ui/dicts";
import {
  WikiEntryDetail,
  type WikiItem,
  type WikiSection,
} from "@/lib/db/wiki";
import type { OnceHumanItemProps } from "./data";
import { EntryMap } from "./entry-map";

/**
 * Type guard for the [x, y] coordinate pair upstream entries ship as
 * `props.location`. Some entries omit it, others occasionally ship
 * `null` or a malformed value — defensive checks here keep the map
 * render path safe.
 */
function hasLocation(
  props: OnceHumanItemProps,
): props is OnceHumanItemProps & { location: [number, number] } {
  return (
    Array.isArray(props.location) &&
    props.location.length === 2 &&
    typeof props.location[0] === "number" &&
    typeof props.location[1] === "number"
  );
}

let tilesPromise: Promise<TilesConfig> | null = null;
function getTiles(): Promise<TilesConfig> {
  // Cached at the module level — the tiles config doesn't change at
  // runtime, and once-human entry pages routinely hit it.
  if (!tilesPromise) tilesPromise = fetchTiles("once-human");
  return tilesPromise;
}

/**
 * Once-Human entry-detail wrapper.
 *
 * Surfaces two pieces of game-specific metadata on top of the generic
 * WikiEntryDetail:
 *   - the author/location/date triple (`title1`/`title2`/`title3`) as
 *     a definition list above the body — letters and field notes read
 *     correctly with this preamble.
 *   - a single-pin map at the bottom for entries that ship in-world
 *     coordinates (`props.location`). Restores parity with the
 *     old once-human-web echoes-of-stardust detail page.
 */
export async function OnceHumanEntryDetail({
  section,
  item,
  neighbors,
  siblings,
  locale = "en",
}: {
  section: WikiSection;
  item: WikiItem;
  neighbors: { prev?: WikiItem; next?: WikiItem };
  siblings: WikiItem[];
  locale?: string;
}) {
  const p = item.props as OnceHumanItemProps;
  const dict = await getStaticDictionary("once-human", locale);
  const metaRows: Array<{ label: string; value: string }> = [];
  if (p.title1)
    metaRows.push({
      label: dict["oh.entry.author"] ?? "Author",
      value: p.title1,
    });
  if (p.title2)
    metaRows.push({
      label: dict["oh.entry.location"] ?? "Location",
      value: p.title2,
    });
  if (p.title3)
    metaRows.push({ label: dict["oh.entry.date"] ?? "Date", value: p.title3 });

  let footer: React.ReactNode = null;
  if (hasLocation(p)) {
    const tiles = await getTiles();
    footer = (
      <EntryMap
        id={item.id}
        name={p.title}
        location={p.location}
        tiles={tiles}
      />
    );
  }

  return (
    <WikiEntryDetail
      section={section}
      item={item}
      neighbors={neighbors}
      siblings={siblings}
      locale={locale}
      metaRows={metaRows.length > 0 ? metaRows : undefined}
      footer={footer}
    />
  );
}
