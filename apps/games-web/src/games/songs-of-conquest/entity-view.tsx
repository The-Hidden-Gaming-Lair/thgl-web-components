import { type TilesConfig } from "@repo/lib";
import { GenericEntityView } from "@/lib/db/generic-view";
import { resolveDict } from "@/lib/db/resolve-dict";
import { SectionsRenderer } from "@/lib/db/sections-renderer";
import { TownPlanner } from "@/games/songs-of-conquest/town-planner";
import {
  ResearchList,
  type ResearchItem,
} from "@/games/songs-of-conquest/research-list";
import {
  SkillPoolPlanner,
  type SkillPool,
} from "@/games/songs-of-conquest/skill-planner";
import {
  UnitView,
  type UnitVariant,
} from "@/games/songs-of-conquest/unit-view";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** A cross-link to another SoC DB entry, produced by the data-mining transform.
 *  Carries only the target id; the display name resolves per-locale from `dict`. */
type SocLink = { section: string; id: string; name?: string; sub?: string };

/** A non-clickable icon + value pill (resource / essence costs, …). */
type SocChip = { iconId?: string; label: string; title?: string };

/** A structured extra section the generic view can't express (tables / link grids / lists). */
type SocSection =
  | { title: string; kind: "links"; links: SocLink[] }
  | { title: string; kind: "rows"; rows: { label: string; value: string }[] }
  | { title: string; kind: "list"; items: string[] }
  | { title: string; kind: "chips"; chips: SocChip[] };

/** Stat-label → in-game icon id (the data-mining `_stat_icons` stable ids).
 *  Shared by the wielder stat cards (generic view) and the unit stat table. */
export const SOC_STAT_ICONS: Record<string, string> = {
  Offense: "_ic_offence",
  Defense: "_ic_defense",
  Movement: "_ic_movement",
  "View Radius": "_ic_view",
  // Unit-table labels (British spelling + split melee/ranged).
  "Melee Offence": "_ic_offence",
  "Ranged Offence": "_ic_offence",
  Defence: "_ic_defense",
};

/**
 * Songs of Conquest detail view. Renders the shared GenericEntityView (hero +
 * stat cards + effect rows) and then any `_sections` the transform attached —
 * the tabular / cross-link content that doesn't fit the generic card model
 * (wielder skill pools, faction unit/building/wielder indexes, etc.).
 */
export function SocEntityView(props: {
  id: string;
  name: string;
  desc?: string;
  groupLabel?: string;
  icon?: IconSprite;
  props?: Record<string, unknown>;
  iconsHash?: string;
  appName: string;
  locale?: string;
  icons?: Record<string, IconSprite>;
  tiles?: TilesConfig;
  dict?: Record<string, string>;
}) {
  const { appName, iconsHash, locale = "en", icons, dict } = props;
  const linkName = (l: SocLink) =>
    (dict && resolveDict(dict, l.id)) || l.name || l.id;
  const sections = (props.props?._sections as SocSection[] | undefined) ?? [];
  const townGraph = props.props?._townGraph as
    | { buildings: Parameters<typeof TownPlanner>[0]["buildings"] }
    | undefined;
  const unit = props.props?._unit as { variants: UnitVariant[] } | undefined;
  const skillPool = props.props?._skillPool as
    | { pools: SkillPool[] }
    | undefined;
  const research = props.props?._research as ResearchItem[] | undefined;
  const dlc = props.props?._dlc as string | undefined;

  return (
    <>
      <GenericEntityView
        {...props}
        statIcons={SOC_STAT_ICONS}
        monoDetails={false}
        badges={dlc ? [{ label: "DLC", title: dlc }] : undefined}
      />
      {unit && unit.variants.length > 0 && (
        <UnitView
          variants={unit.variants}
          icons={icons}
          appName={appName}
          iconsHash={iconsHash}
          dict={dict}
          statIcons={SOC_STAT_ICONS}
        />
      )}
      <SectionsRenderer
        sections={sections}
        icons={icons}
        dict={dict}
        appName={appName}
        locale={locale}
        iconsHash={iconsHash}
        resolveLinkName={linkName}
      />
      {research?.length ? (
        <ResearchList
          research={research}
          icons={icons}
          appName={appName}
          iconsHash={iconsHash}
          locale={locale}
        />
      ) : null}
      {skillPool?.pools?.length ? (
        <SkillPoolPlanner
          pools={skillPool.pools}
          icons={icons}
          appName={appName}
          iconsHash={iconsHash}
          dict={dict}
        />
      ) : null}
      {townGraph && townGraph.buildings.length > 0 && (
        <TownPlanner
          buildings={townGraph.buildings}
          appName={appName}
          iconsHash={iconsHash}
          icons={icons}
          factionLabel={props.name}
        />
      )}
    </>
  );
}
