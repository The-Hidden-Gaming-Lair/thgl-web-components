/**
 * Outbound partner links on codex pages.
 *
 * Partner placements are a business arrangement with their own lifecycle — deals
 * get added, renegotiated and ended — so they live in frontend config rather than
 * in the per-game database JSON. Baking them into `public/{game}/config/*` would
 * freeze a revocable link into CDN data cached for 31 days, and removing one
 * would mean a full re-extract plus a CDN sync instead of a deploy. This mirrors
 * how the game-switcher partner chips work: declared in config, compiled into the
 * frontend, never shipped as game data.
 *
 * Entries are keyed by the codex entry id rather than by display name. Ids are
 * stable across localisation and renames, and they disambiguate the cases where
 * several of our entries share one partner page (the four Rover elements each
 * exist twice in our data but have one Prydwen guide apiece).
 */

type PartnerSite = {
  /** Shown to the reader, e.g. "Prydwen". */
  name: string;
  /** Link for the section's listing page. */
  directoryUrl: string;
  /** Codex entry id -> that entry's page on the partner site. */
  entryUrls: Record<string, string>;
};

const PRYDWEN_WUWA_CHARACTER = (slug: string) =>
  `https://www.prydwen.gg/wuthering-waves/characters/${slug}?utm_source=wuthering.th.gl&utm_medium=referral`;

/**
 * Slugs are Prydwen's own, read off their character directory and each one
 * confirmed to return 200 — not derived from our names. Several would not
 * survive naive slugification: "Shorekeeper" is `the-shorekeeper` there,
 * "Rover: Spectro" is `rover-spectro`, "Yangyang: Xuanling" is
 * `yangyang-xuanling`. Any resonator missing from this table simply renders no
 * link, which is the right failure mode — a guessed slug would 404 our readers
 * into the partner's error page.
 */
const PRYDWEN_WUWA_RESONATOR_SLUGS: Record<string, string> = {
  char_1402: "yangyang", // Yangyang
  char_1202: "chixia", // Chixia
  char_1503: "verina", // Verina
  char_1501: "rover-spectro", // Rover: Spectro
  char_1102: "sanhua", // Sanhua
  char_1601: "taoqi", // Taoqi
  char_1502: "rover-spectro", // Rover: Spectro
  char_1103: "baizhi", // Baizhi
  char_1203: "encore", // Encore
  char_1602: "danjin", // Danjin
  char_1403: "aalto", // Aalto
  char_1404: "jiyan", // Jiyan
  char_1204: "mortefi", // Mortefi
  char_1603: "camellya", // Camellya
  char_1301: "calcharo", // Calcharo
  char_1302: "yinlin", // Yinlin
  char_1104: "lingyang", // Lingyang
  char_1303: "yuanwu", // Yuanwu
  char_1604: "rover-havoc", // Rover: Havoc
  char_1605: "rover-havoc", // Rover: Havoc
  char_1405: "jianxin", // Jianxin
  char_1304: "jinhsi", // Jinhsi
  char_1305: "xiangli-yao", // Xiangli Yao
  char_1205: "changli", // Changli
  char_1105: "zhezhi", // Zhezhi
  char_1504: "lumi", // Lumi
  char_1106: "youhu", // Youhu
  char_1505: "the-shorekeeper", // Shorekeeper
  char_1606: "roccia", // Roccia
  char_1107: "carlotta", // Carlotta
  char_1206: "brant", // Brant
  char_1506: "phoebe", // Phoebe
  char_1406: "rover-aero", // Rover: Aero
  char_1607: "cantarella", // Cantarella
  char_1407: "ciaccona", // Ciaccona
  char_1507: "zani", // Zani
  char_1408: "rover-aero", // Rover: Aero
  char_1207: "lupa", // Lupa
  char_1608: "phrolova", // Phrolova
  char_1409: "cartethyia", // Cartethyia
  char_1306: "augusta", // Augusta
  char_1410: "iuno", // Iuno
  char_1307: "buling", // Buling
  char_1208: "galbrena", // Galbrena
  char_1508: "chisa", // Chisa
  char_1411: "qiuyuan", // Qiuyuan
  char_1509: "lynae", // Lynae
  char_1209: "mornye", // Mornye
  char_1510: "luuk-herssen", // Luuk Herssen
  char_1210: "aemeath", // Aemeath
  char_1412: "sigrika", // Sigrika
  char_1211: "denia", // Denia
  char_1308: "rebecca", // Rebecca
  char_1109: "lucilla", // Lucilla
  char_1511: "lucy", // Lucy
  char_1108: "hiyuki", // Hiyuki
  char_1309: "rover-electro", // Rover: Electro
  char_1310: "rover-electro", // Rover: Electro
  char_1610: "yangyang-xuanling", // Yangyang: Xuanling
  char_1110: "suisui", // Suisui
  char_1413: "qingxiao", // Qingxiao
  char_1212: "jingran", // Jingran
};

/** appName (AppConfig.name) -> codex section -> partner site. */
const PARTNER_LINKS: Record<string, Record<string, PartnerSite>> = {
  "wuthering-waves": {
    resonators: {
      name: "Prydwen",
      directoryUrl:
        "https://www.prydwen.gg/wuthering-waves/characters?utm_source=wuthering.th.gl&utm_medium=referral",
      entryUrls: Object.fromEntries(
        Object.entries(PRYDWEN_WUWA_RESONATOR_SLUGS).map(([id, slug]) => [
          id,
          PRYDWEN_WUWA_CHARACTER(slug),
        ]),
      ),
    },
  },
};

export type PartnerLink = { name: string; url: string };

/** The partner link for a section's listing page, if that section has a partner. */
export function getPartnerSectionLink(
  appName: string,
  section: string,
): PartnerLink | null {
  const site = PARTNER_LINKS[appName]?.[section];
  return site ? { name: site.name, url: site.directoryUrl } : null;
}

/** The partner link for one codex entry, if that entry has a counterpart. */
export function getPartnerEntryLink(
  appName: string,
  section: string,
  entryId: string,
): PartnerLink | null {
  const site = PARTNER_LINKS[appName]?.[section];
  const url = site?.entryUrls[entryId];
  return site && url ? { name: site.name, url } : null;
}
