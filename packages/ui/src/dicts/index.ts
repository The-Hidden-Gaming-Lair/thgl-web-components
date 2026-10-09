import { Dict, fetchDbDict, fetchDbNamesDict, fetchDict } from "@repo/lib";
import "server-only";
import { globalDictionaries } from "./global";

// App-specific dictionaries per locale
const appDictionaries = {
  "dragonsword-awakening": {
    en: () =>
      import("./dragonsword-awakening.en.json").then((mod) => mod.default),
    ja: () =>
      import("./dragonsword-awakening.ja.json").then((mod) => mod.default),
    ko: () =>
      import("./dragonsword-awakening.ko.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./dragonsword-awakening.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./dragonsword-awakening.zh-TW.json").then((mod) => mod.default),
    de: () =>
      import("./dragonsword-awakening.de.json").then((mod) => mod.default),
    fr: () =>
      import("./dragonsword-awakening.fr.json").then((mod) => mod.default),
    es: () =>
      import("./dragonsword-awakening.es.json").then((mod) => mod.default),
    pt: () =>
      import("./dragonsword-awakening.pt.json").then((mod) => mod.default),
    ru: () =>
      import("./dragonsword-awakening.ru.json").then((mod) => mod.default),
    th: () =>
      import("./dragonsword-awakening.th.json").then((mod) => mod.default),
  },
  "delta-force": {
    en: () => import("./delta-force.en.json").then((mod) => mod.default),
    de: () => import("./delta-force.de.json").then((mod) => mod.default),
    es: () => import("./delta-force.es.json").then((mod) => mod.default),
    fr: () => import("./delta-force.fr.json").then((mod) => mod.default),
    ja: () => import("./delta-force.ja.json").then((mod) => mod.default),
    ko: () => import("./delta-force.ko.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./delta-force.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./delta-force.ru.json").then((mod) => mod.default),
    th: () => import("./delta-force.th.json").then((mod) => mod.default),
    tr: () => import("./delta-force.tr.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./delta-force.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./delta-force.zh-TW.json").then((mod) => mod.default),
  },
  "crimson-desert": {
    en: () => import("./crimson-desert.en.json").then((mod) => mod.default),
    ko: () => import("./crimson-desert.ko.json").then((mod) => mod.default),
    ja: () => import("./crimson-desert.ja.json").then((mod) => mod.default),
    fr: () => import("./crimson-desert.fr.json").then((mod) => mod.default),
    de: () => import("./crimson-desert.de.json").then((mod) => mod.default),
    it: () => import("./crimson-desert.it.json").then((mod) => mod.default),
    pl: () => import("./crimson-desert.pl.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./crimson-desert.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./crimson-desert.ru.json").then((mod) => mod.default),
    es: () => import("./crimson-desert.es.json").then((mod) => mod.default),
    tr: () => import("./crimson-desert.tr.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./crimson-desert.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./crimson-desert.zh-TW.json").then((mod) => mod.default),
  },
  diablo4: {
    en: () => import("./diablo4.en.json").then((mod) => mod.default),
    de: () => import("./diablo4.de.json").then((mod) => mod.default),
    es: () => import("./diablo4.es.json").then((mod) => mod.default),
    "es-MX": () => import("./diablo4.es-MX.json").then((mod) => mod.default),
    fr: () => import("./diablo4.fr.json").then((mod) => mod.default),
    it: () => import("./diablo4.it.json").then((mod) => mod.default),
    ja: () => import("./diablo4.ja.json").then((mod) => mod.default),
    ko: () => import("./diablo4.ko.json").then((mod) => mod.default),
    pl: () => import("./diablo4.pl.json").then((mod) => mod.default),
    "pt-BR": () => import("./diablo4.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./diablo4.ru.json").then((mod) => mod.default),
    tr: () => import("./diablo4.tr.json").then((mod) => mod.default),
    "zh-CN": () => import("./diablo4.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () => import("./diablo4.zh-TW.json").then((mod) => mod.default),
  },
  "chrono-odyssey": {
    en: () => import("./chrono-odyssey.en.json").then((mod) => mod.default),
    ja: () => import("./chrono-odyssey.ja.json").then((mod) => mod.default),
    ko: () => import("./chrono-odyssey.ko.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./chrono-odyssey.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./chrono-odyssey.zh-TW.json").then((mod) => mod.default),
  },
  "blue-protocol-star-resonance": {
    en: () =>
      import("./blue-protocol-star-resonance.en.json").then(
        (mod) => mod.default,
      ),
    ja: () =>
      import("./blue-protocol-star-resonance.ja.json").then(
        (mod) => mod.default,
      ),
    "zh-CN": () =>
      import("./blue-protocol-star-resonance.zh-CN.json").then(
        (mod) => mod.default,
      ),
    "zh-TW": () =>
      import("./blue-protocol-star-resonance.zh-TW.json").then(
        (mod) => mod.default,
      ),
    th: () =>
      import("./blue-protocol-star-resonance.th.json").then(
        (mod) => mod.default,
      ),
  },
  "graveyard-keeper-2": {
    en: () => import("./graveyard-keeper-2.en.json").then((mod) => mod.default),
    de: () => import("./graveyard-keeper-2.de.json").then((mod) => mod.default),
    es: () => import("./graveyard-keeper-2.es.json").then((mod) => mod.default),
    fr: () => import("./graveyard-keeper-2.fr.json").then((mod) => mod.default),
    ja: () => import("./graveyard-keeper-2.ja.json").then((mod) => mod.default),
    ko: () => import("./graveyard-keeper-2.ko.json").then((mod) => mod.default),
    pl: () => import("./graveyard-keeper-2.pl.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./graveyard-keeper-2.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./graveyard-keeper-2.ru.json").then((mod) => mod.default),
    tr: () => import("./graveyard-keeper-2.tr.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./graveyard-keeper-2.zh-CN.json").then((mod) => mod.default),
  },
  "gothic-1-remake": {
    en: () => import("./gothic-1-remake.en.json").then((mod) => mod.default),
    de: () => import("./gothic-1-remake.de.json").then((mod) => mod.default),
    fr: () => import("./gothic-1-remake.fr.json").then((mod) => mod.default),
    es: () => import("./gothic-1-remake.es.json").then((mod) => mod.default),
    it: () => import("./gothic-1-remake.it.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./gothic-1-remake.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./gothic-1-remake.ru.json").then((mod) => mod.default),
    pl: () => import("./gothic-1-remake.pl.json").then((mod) => mod.default),
    ja: () => import("./gothic-1-remake.ja.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./gothic-1-remake.zh-CN.json").then((mod) => mod.default),
  },
  enshrouded: {
    en: () => import("./enshrouded.en.json").then((mod) => mod.default),
    de: () => import("./enshrouded.de.json").then((mod) => mod.default),
    es: () => import("./enshrouded.es.json").then((mod) => mod.default),
    fr: () => import("./enshrouded.fr.json").then((mod) => mod.default),
    it: () => import("./enshrouded.it.json").then((mod) => mod.default),
    ja: () => import("./enshrouded.ja.json").then((mod) => mod.default),
    ko: () => import("./enshrouded.ko.json").then((mod) => mod.default),
    pl: () => import("./enshrouded.pl.json").then((mod) => mod.default),
    "pt-BR": () => import("./enshrouded.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./enshrouded.ru.json").then((mod) => mod.default),
    th: () => import("./enshrouded.th.json").then((mod) => mod.default),
    tr: () => import("./enshrouded.tr.json").then((mod) => mod.default),
    uk: () => import("./enshrouded.uk.json").then((mod) => mod.default),
    "zh-CN": () => import("./enshrouded.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () => import("./enshrouded.zh-TW.json").then((mod) => mod.default),
  },
  "duet-night-abyss": {
    en: () => import("./duet-night-abyss.en.json").then((mod) => mod.default),
    fr: () => import("./duet-night-abyss.fr.json").then((mod) => mod.default),
    ja: () => import("./duet-night-abyss.ja.json").then((mod) => mod.default),
    ko: () => import("./duet-night-abyss.ko.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./duet-night-abyss.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./duet-night-abyss.zh-TW.json").then((mod) => mod.default),
  },
  heartopia: {
    en: () => import("./heartopia.en.json").then((mod) => mod.default),
    "zh-CN": () => import("./heartopia.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () => import("./heartopia.zh-TW.json").then((mod) => mod.default),
    de: () => import("./heartopia.de.json").then((mod) => mod.default),
    fr: () => import("./heartopia.fr.json").then((mod) => mod.default),
    ja: () => import("./heartopia.ja.json").then((mod) => mod.default),
    ko: () => import("./heartopia.ko.json").then((mod) => mod.default),
    es: () => import("./heartopia.es.json").then((mod) => mod.default),
    pt: () => import("./heartopia.pt.json").then((mod) => mod.default),
    th: () => import("./heartopia.th.json").then((mod) => mod.default),
    ru: () => import("./heartopia.ru.json").then((mod) => mod.default),
    id: () => import("./heartopia.id.json").then((mod) => mod.default),
  },
  "infinity-nikki": {
    en: () => import("./infinity-nikki.en.json").then((mod) => mod.default),
    de: () => import("./infinity-nikki.de.json").then((mod) => mod.default),
    es: () => import("./infinity-nikki.es.json").then((mod) => mod.default),
    fr: () => import("./infinity-nikki.fr.json").then((mod) => mod.default),
    id: () => import("./infinity-nikki.id.json").then((mod) => mod.default),
    it: () => import("./infinity-nikki.it.json").then((mod) => mod.default),
    ja: () => import("./infinity-nikki.ja.json").then((mod) => mod.default),
    ko: () => import("./infinity-nikki.ko.json").then((mod) => mod.default),
    pt: () => import("./infinity-nikki.pt.json").then((mod) => mod.default),
    th: () => import("./infinity-nikki.th.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./infinity-nikki.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./infinity-nikki.zh-TW.json").then((mod) => mod.default),
  },
  grounded2: {
    en: () => import("./grounded2.en.json").then((mod) => mod.default),
    de: () => import("./grounded2.de.json").then((mod) => mod.default),
    es: () => import("./grounded2.es.json").then((mod) => mod.default),
    "es-MX": () => import("./grounded2.es-MX.json").then((mod) => mod.default),
    fr: () => import("./grounded2.fr.json").then((mod) => mod.default),
    it: () => import("./grounded2.it.json").then((mod) => mod.default),
    ja: () => import("./grounded2.ja.json").then((mod) => mod.default),
    ko: () => import("./grounded2.ko.json").then((mod) => mod.default),
    "pt-BR": () => import("./grounded2.pt-BR.json").then((mod) => mod.default),
    "zh-CN": () => import("./grounded2.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () => import("./grounded2.zh-TW.json").then((mod) => mod.default),
  },
  "hogwarts-legacy": {
    en: () => import("./hogwarts-legacy.en.json").then((mod) => mod.default),
    de: () => import("./hogwarts-legacy.de.json").then((mod) => mod.default),
    es: () => import("./hogwarts-legacy.es.json").then((mod) => mod.default),
    "es-MX": () =>
      import("./hogwarts-legacy.es-MX.json").then((mod) => mod.default),
    fr: () => import("./hogwarts-legacy.fr.json").then((mod) => mod.default),
    it: () => import("./hogwarts-legacy.it.json").then((mod) => mod.default),
    ja: () => import("./hogwarts-legacy.ja.json").then((mod) => mod.default),
    ko: () => import("./hogwarts-legacy.ko.json").then((mod) => mod.default),
    pl: () => import("./hogwarts-legacy.pl.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./hogwarts-legacy.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./hogwarts-legacy.ru.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./hogwarts-legacy.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./hogwarts-legacy.zh-TW.json").then((mod) => mod.default),
  },
  "legend-of-khiimori": {
    en: () => import("./legend-of-khiimori.en.json").then((mod) => mod.default),
    de: () => import("./legend-of-khiimori.de.json").then((mod) => mod.default),
    es: () => import("./legend-of-khiimori.es.json").then((mod) => mod.default),
    fr: () => import("./legend-of-khiimori.fr.json").then((mod) => mod.default),
    it: () => import("./legend-of-khiimori.it.json").then((mod) => mod.default),
    ja: () => import("./legend-of-khiimori.ja.json").then((mod) => mod.default),
    ko: () => import("./legend-of-khiimori.ko.json").then((mod) => mod.default),
    pl: () => import("./legend-of-khiimori.pl.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./legend-of-khiimori.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./legend-of-khiimori.ru.json").then((mod) => mod.default),
    tr: () => import("./legend-of-khiimori.tr.json").then((mod) => mod.default),
    uk: () => import("./legend-of-khiimori.uk.json").then((mod) => mod.default),
    "zh-Hans": () =>
      import("./legend-of-khiimori.zh-Hans.json").then((mod) => mod.default),
    "zh-Hant": () =>
      import("./legend-of-khiimori.zh-Hant.json").then((mod) => mod.default),
  },
  "neverness-to-everness": {
    en: () =>
      import("./neverness-to-everness.en.json").then((mod) => mod.default),
    de: () =>
      import("./neverness-to-everness.de.json").then((mod) => mod.default),
    es: () =>
      import("./neverness-to-everness.es.json").then((mod) => mod.default),
    fr: () =>
      import("./neverness-to-everness.fr.json").then((mod) => mod.default),
    ja: () =>
      import("./neverness-to-everness.ja.json").then((mod) => mod.default),
    ko: () =>
      import("./neverness-to-everness.ko.json").then((mod) => mod.default),
    ru: () =>
      import("./neverness-to-everness.ru.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./neverness-to-everness.zh-CN.json").then((mod) => mod.default),
  },
  "minecraft-dungeons-2": {
    en: () =>
      import("./minecraft-dungeons-2.en.json").then((mod) => mod.default),
    de: () =>
      import("./minecraft-dungeons-2.de.json").then((mod) => mod.default),
    es: () =>
      import("./minecraft-dungeons-2.es.json").then((mod) => mod.default),
    fr: () =>
      import("./minecraft-dungeons-2.fr.json").then((mod) => mod.default),
    it: () =>
      import("./minecraft-dungeons-2.it.json").then((mod) => mod.default),
    ja: () =>
      import("./minecraft-dungeons-2.ja.json").then((mod) => mod.default),
    ko: () =>
      import("./minecraft-dungeons-2.ko.json").then((mod) => mod.default),
    pl: () =>
      import("./minecraft-dungeons-2.pl.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./minecraft-dungeons-2.pt-BR.json").then((mod) => mod.default),
    ru: () =>
      import("./minecraft-dungeons-2.ru.json").then((mod) => mod.default),
    tr: () =>
      import("./minecraft-dungeons-2.tr.json").then((mod) => mod.default),
    uk: () =>
      import("./minecraft-dungeons-2.uk.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./minecraft-dungeons-2.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./minecraft-dungeons-2.zh-TW.json").then((mod) => mod.default),
  },
  soulframe: {
    en: () => import("./soulframe.en.json").then((mod) => mod.default),
    de: () => import("./soulframe.de.json").then((mod) => mod.default),
    es: () => import("./soulframe.es.json").then((mod) => mod.default),
    fr: () => import("./soulframe.fr.json").then((mod) => mod.default),
    it: () => import("./soulframe.it.json").then((mod) => mod.default),
    ja: () => import("./soulframe.ja.json").then((mod) => mod.default),
    ko: () => import("./soulframe.ko.json").then((mod) => mod.default),
    pl: () => import("./soulframe.pl.json").then((mod) => mod.default),
    "pt-BR": () => import("./soulframe.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./soulframe.ru.json").then((mod) => mod.default),
    th: () => import("./soulframe.th.json").then((mod) => mod.default),
    tr: () => import("./soulframe.tr.json").then((mod) => mod.default),
    uk: () => import("./soulframe.uk.json").then((mod) => mod.default),
    "zh-CN": () => import("./soulframe.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () => import("./soulframe.zh-TW.json").then((mod) => mod.default),
  },
  "songs-of-conquest": {
    en: () => import("./songs-of-conquest.en.json").then((mod) => mod.default),
    ru: () => import("./songs-of-conquest.ru.json").then((mod) => mod.default),
    cs: () => import("./songs-of-conquest.cs.json").then((mod) => mod.default),
    fr: () => import("./songs-of-conquest.fr.json").then((mod) => mod.default),
    de: () => import("./songs-of-conquest.de.json").then((mod) => mod.default),
    it: () => import("./songs-of-conquest.it.json").then((mod) => mod.default),
    pl: () => import("./songs-of-conquest.pl.json").then((mod) => mod.default),
    es: () => import("./songs-of-conquest.es.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./songs-of-conquest.zh-CN.json").then((mod) => mod.default),
    ja: () => import("./songs-of-conquest.ja.json").then((mod) => mod.default),
    ko: () => import("./songs-of-conquest.ko.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./songs-of-conquest.pt-BR.json").then((mod) => mod.default),
    uk: () => import("./songs-of-conquest.uk.json").then((mod) => mod.default),
  },
  "sinking-city-2": {
    en: () => import("./sinking-city-2.en.json").then((mod) => mod.default),
    de: () => import("./sinking-city-2.de.json").then((mod) => mod.default),
    fr: () => import("./sinking-city-2.fr.json").then((mod) => mod.default),
    es: () => import("./sinking-city-2.es.json").then((mod) => mod.default),
    it: () => import("./sinking-city-2.it.json").then((mod) => mod.default),
    ja: () => import("./sinking-city-2.ja.json").then((mod) => mod.default),
    ko: () => import("./sinking-city-2.ko.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./sinking-city-2.pt-BR.json").then((mod) => mod.default),
    pl: () => import("./sinking-city-2.pl.json").then((mod) => mod.default),
    tr: () => import("./sinking-city-2.tr.json").then((mod) => mod.default),
    uk: () => import("./sinking-city-2.uk.json").then((mod) => mod.default),
    cs: () => import("./sinking-city-2.cs.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./sinking-city-2.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./sinking-city-2.zh-TW.json").then((mod) => mod.default),
  },
  satisfactory: {
    en: () => import("./satisfactory.en.json").then((mod) => mod.default),
    cs: () => import("./satisfactory.cs.json").then((mod) => mod.default),
    de: () => import("./satisfactory.de.json").then((mod) => mod.default),
    es: () => import("./satisfactory.es.json").then((mod) => mod.default),
    "es-MX": () =>
      import("./satisfactory.es-MX.json").then((mod) => mod.default),
    fr: () => import("./satisfactory.fr.json").then((mod) => mod.default),
    hu: () => import("./satisfactory.hu.json").then((mod) => mod.default),
    id: () => import("./satisfactory.id.json").then((mod) => mod.default),
    it: () => import("./satisfactory.it.json").then((mod) => mod.default),
    ja: () => import("./satisfactory.ja.json").then((mod) => mod.default),
    ko: () => import("./satisfactory.ko.json").then((mod) => mod.default),
    pl: () => import("./satisfactory.pl.json").then((mod) => mod.default),
    pt: () => import("./satisfactory.pt.json").then((mod) => mod.default),
    ru: () => import("./satisfactory.ru.json").then((mod) => mod.default),
    th: () => import("./satisfactory.th.json").then((mod) => mod.default),
    tr: () => import("./satisfactory.tr.json").then((mod) => mod.default),
    uk: () => import("./satisfactory.uk.json").then((mod) => mod.default),
    vi: () => import("./satisfactory.vi.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./satisfactory.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./satisfactory.zh-TW.json").then((mod) => mod.default),
  },
  "planet-crafter": {
    en: () => import("./planet-crafter.en.json").then((mod) => mod.default),
    fr: () => import("./planet-crafter.fr.json").then((mod) => mod.default),
    es: () => import("./planet-crafter.es.json").then((mod) => mod.default),
    pt: () => import("./planet-crafter.pt.json").then((mod) => mod.default),
    de: () => import("./planet-crafter.de.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./planet-crafter.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./planet-crafter.zh-TW.json").then((mod) => mod.default),
    ja: () => import("./planet-crafter.ja.json").then((mod) => mod.default),
    ko: () => import("./planet-crafter.ko.json").then((mod) => mod.default),
    pl: () => import("./planet-crafter.pl.json").then((mod) => mod.default),
    ru: () => import("./planet-crafter.ru.json").then((mod) => mod.default),
    tr: () => import("./planet-crafter.tr.json").then((mod) => mod.default),
    it: () => import("./planet-crafter.it.json").then((mod) => mod.default),
  },
  "the-first-descendant": {
    en: () =>
      import("./the-first-descendant.en.json").then((mod) => mod.default),
    de: () =>
      import("./the-first-descendant.de.json").then((mod) => mod.default),
    fr: () =>
      import("./the-first-descendant.fr.json").then((mod) => mod.default),
    es: () =>
      import("./the-first-descendant.es.json").then((mod) => mod.default),
    it: () =>
      import("./the-first-descendant.it.json").then((mod) => mod.default),
    pl: () =>
      import("./the-first-descendant.pl.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./the-first-descendant.pt-BR.json").then((mod) => mod.default),
    ru: () =>
      import("./the-first-descendant.ru.json").then((mod) => mod.default),
    ja: () =>
      import("./the-first-descendant.ja.json").then((mod) => mod.default),
    ko: () =>
      import("./the-first-descendant.ko.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./the-first-descendant.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./the-first-descendant.zh-TW.json").then((mod) => mod.default),
  },
  "souls-remnant": {
    en: () => import("./souls-remnant.en.json").then((mod) => mod.default),
    de: () => import("./souls-remnant.de.json").then((mod) => mod.default),
    es: () => import("./souls-remnant.es.json").then((mod) => mod.default),
    "es-MX": () =>
      import("./souls-remnant.es-MX.json").then((mod) => mod.default),
    fr: () => import("./souls-remnant.fr.json").then((mod) => mod.default),
    id: () => import("./souls-remnant.id.json").then((mod) => mod.default),
    it: () => import("./souls-remnant.it.json").then((mod) => mod.default),
    pl: () => import("./souls-remnant.pl.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./souls-remnant.pt-BR.json").then((mod) => mod.default),
    tr: () => import("./souls-remnant.tr.json").then((mod) => mod.default),
    ja: () => import("./souls-remnant.ja.json").then((mod) => mod.default),
    ko: () => import("./souls-remnant.ko.json").then((mod) => mod.default),
    ru: () => import("./souls-remnant.ru.json").then((mod) => mod.default),
    th: () => import("./souls-remnant.th.json").then((mod) => mod.default),
    vi: () => import("./souls-remnant.vi.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./souls-remnant.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./souls-remnant.zh-TW.json").then((mod) => mod.default),
  },
  starrupture: {
    en: () => import("./starrupture.en.json").then((mod) => mod.default),
    de: () => import("./starrupture.de.json").then((mod) => mod.default),
    es: () => import("./starrupture.es.json").then((mod) => mod.default),
    fr: () => import("./starrupture.fr.json").then((mod) => mod.default),
    ja: () => import("./starrupture.ja.json").then((mod) => mod.default),
    ko: () => import("./starrupture.ko.json").then((mod) => mod.default),
    pl: () => import("./starrupture.pl.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./starrupture.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./starrupture.ru.json").then((mod) => mod.default),
    th: () => import("./starrupture.th.json").then((mod) => mod.default),
    "zh-Hans": () =>
      import("./starrupture.zh-Hans.json").then((mod) => mod.default),
    "zh-Hant": () =>
      import("./starrupture.zh-Hant.json").then((mod) => mod.default),
  },
  "subnautica-2": {
    en: () => import("./subnautica-2.en.json").then((mod) => mod.default),
    de: () => import("./subnautica-2.de.json").then((mod) => mod.default),
    es: () => import("./subnautica-2.es.json").then((mod) => mod.default),
    fr: () => import("./subnautica-2.fr.json").then((mod) => mod.default),
    it: () => import("./subnautica-2.it.json").then((mod) => mod.default),
    ja: () => import("./subnautica-2.ja.json").then((mod) => mod.default),
    ko: () => import("./subnautica-2.ko.json").then((mod) => mod.default),
    pt: () => import("./subnautica-2.pt.json").then((mod) => mod.default),
    ru: () => import("./subnautica-2.ru.json").then((mod) => mod.default),
    uk: () => import("./subnautica-2.uk.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./subnautica-2.zh-CN.json").then((mod) => mod.default),
  },
  "starsand-island": {
    en: () => import("./starsand-island.en.json").then((mod) => mod.default),
    ja: () => import("./starsand-island.ja.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./starsand-island.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./starsand-island.zh-TW.json").then((mod) => mod.default),
  },
  soulmask: {
    de: () => import("./soulmask.de.json").then((mod) => mod.default),
    en: () => import("./soulmask.en.json").then((mod) => mod.default),
    es: () => import("./soulmask.es.json").then((mod) => mod.default),
    fr: () => import("./soulmask.fr.json").then((mod) => mod.default),
    ja: () => import("./soulmask.ja.json").then((mod) => mod.default),
    ko: () => import("./soulmask.ko.json").then((mod) => mod.default),
    "pt-BR": () => import("./soulmask.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./soulmask.ru.json").then((mod) => mod.default),
    "zh-CN": () => import("./soulmask.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () => import("./soulmask.zh-TW.json").then((mod) => mod.default),
  },
  "wuthering-waves": {
    en: () => import("./wuthering-waves.en.json").then((mod) => mod.default),
    de: () => import("./wuthering-waves.de.json").then((mod) => mod.default),
    es: () => import("./wuthering-waves.es.json").then((mod) => mod.default),
    fr: () => import("./wuthering-waves.fr.json").then((mod) => mod.default),
    ja: () => import("./wuthering-waves.ja.json").then((mod) => mod.default),
    ko: () => import("./wuthering-waves.ko.json").then((mod) => mod.default),
    pt: () => import("./wuthering-waves.pt.json").then((mod) => mod.default),
    th: () => import("./wuthering-waves.th.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./wuthering-waves.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./wuthering-waves.zh-TW.json").then((mod) => mod.default),
  },
  "where-winds-meet": {
    en: () => import("./where-winds-meet.en.json").then((mod) => mod.default),
    de: () => import("./where-winds-meet.de.json").then((mod) => mod.default),
    fr: () => import("./where-winds-meet.fr.json").then((mod) => mod.default),
    es: () => import("./where-winds-meet.es.json").then((mod) => mod.default),
    ja: () => import("./where-winds-meet.ja.json").then((mod) => mod.default),
    ko: () => import("./where-winds-meet.ko.json").then((mod) => mod.default),
    ru: () => import("./where-winds-meet.ru.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./where-winds-meet.pt-BR.json").then((mod) => mod.default),
    th: () => import("./where-winds-meet.th.json").then((mod) => mod.default),
    vi: () => import("./where-winds-meet.vi.json").then((mod) => mod.default),
    "zh-Hans": () =>
      import("./where-winds-meet.zh-Hans.json").then((mod) => mod.default),
    "zh-Hant": () =>
      import("./where-winds-meet.zh-Hant.json").then((mod) => mod.default),
  },
  "welcome-to-elderfield": {
    en: () =>
      import("./welcome-to-elderfield.en.json").then((mod) => mod.default),
    de: () =>
      import("./welcome-to-elderfield.de.json").then((mod) => mod.default),
    es: () =>
      import("./welcome-to-elderfield.es.json").then((mod) => mod.default),
    fr: () =>
      import("./welcome-to-elderfield.fr.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./welcome-to-elderfield.pt-BR.json").then((mod) => mod.default),
    ru: () =>
      import("./welcome-to-elderfield.ru.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./welcome-to-elderfield.zh-CN.json").then((mod) => mod.default),
  },
  valheim: {
    en: () => import("./valheim.en.json").then((mod) => mod.default),
    cs: () => import("./valheim.cs.json").then((mod) => mod.default),
    de: () => import("./valheim.de.json").then((mod) => mod.default),
    es: () => import("./valheim.es.json").then((mod) => mod.default),
    fr: () => import("./valheim.fr.json").then((mod) => mod.default),
    hu: () => import("./valheim.hu.json").then((mod) => mod.default),
    it: () => import("./valheim.it.json").then((mod) => mod.default),
    ja: () => import("./valheim.ja.json").then((mod) => mod.default),
    ko: () => import("./valheim.ko.json").then((mod) => mod.default),
    pl: () => import("./valheim.pl.json").then((mod) => mod.default),
    "pt-BR": () => import("./valheim.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./valheim.ru.json").then((mod) => mod.default),
    th: () => import("./valheim.th.json").then((mod) => mod.default),
    tr: () => import("./valheim.tr.json").then((mod) => mod.default),
    uk: () => import("./valheim.uk.json").then((mod) => mod.default),
    "zh-CN": () => import("./valheim.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () => import("./valheim.zh-TW.json").then((mod) => mod.default),
  },
  witchspire: {
    en: () => import("./witchspire.en.json").then((mod) => mod.default),
  },
  "albion-online": {
    en: () => import("./albion-online.en.json").then((mod) => mod.default),
    de: () => import("./albion-online.de.json").then((mod) => mod.default),
    es: () => import("./albion-online.es.json").then((mod) => mod.default),
    fr: () => import("./albion-online.fr.json").then((mod) => mod.default),
    it: () => import("./albion-online.it.json").then((mod) => mod.default),
    pl: () => import("./albion-online.pl.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./albion-online.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./albion-online.ru.json").then((mod) => mod.default),
    tr: () => import("./albion-online.tr.json").then((mod) => mod.default),
    id: () => import("./albion-online.id.json").then((mod) => mod.default),
    ja: () => import("./albion-online.ja.json").then((mod) => mod.default),
    ko: () => import("./albion-online.ko.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./albion-online.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./albion-online.zh-TW.json").then((mod) => mod.default),
  },
  "baldurs-gate-ee": {
    en: () => import("./baldurs-gate-ee.en.json").then((mod) => mod.default),
    cs: () => import("./baldurs-gate-ee.cs.json").then((mod) => mod.default),
    de: () => import("./baldurs-gate-ee.de.json").then((mod) => mod.default),
    es: () => import("./baldurs-gate-ee.es.json").then((mod) => mod.default),
    fr: () => import("./baldurs-gate-ee.fr.json").then((mod) => mod.default),
    hu: () => import("./baldurs-gate-ee.hu.json").then((mod) => mod.default),
    it: () => import("./baldurs-gate-ee.it.json").then((mod) => mod.default),
    ja: () => import("./baldurs-gate-ee.ja.json").then((mod) => mod.default),
    ko: () => import("./baldurs-gate-ee.ko.json").then((mod) => mod.default),
    pl: () => import("./baldurs-gate-ee.pl.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./baldurs-gate-ee.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./baldurs-gate-ee.ru.json").then((mod) => mod.default),
    tr: () => import("./baldurs-gate-ee.tr.json").then((mod) => mod.default),
    uk: () => import("./baldurs-gate-ee.uk.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./baldurs-gate-ee.zh-CN.json").then((mod) => mod.default),
  },
  avowed: {
    en: () => import("./avowed.en.json").then((mod) => mod.default),
    de: () => import("./avowed.de.json").then((mod) => mod.default),
    es: () => import("./avowed.es.json").then((mod) => mod.default),
    fr: () => import("./avowed.fr.json").then((mod) => mod.default),
    it: () => import("./avowed.it.json").then((mod) => mod.default),
    ja: () => import("./avowed.ja.json").then((mod) => mod.default),
    ko: () => import("./avowed.ko.json").then((mod) => mod.default),
    pl: () => import("./avowed.pl.json").then((mod) => mod.default),
    pt: () => import("./avowed.pt.json").then((mod) => mod.default),
    ru: () => import("./avowed.ru.json").then((mod) => mod.default),
    "zh-CN": () => import("./avowed.zh-CN.json").then((mod) => mod.default),
  },
  aion2: {
    en: () => import("./aion2.en.json").then((mod) => mod.default),
    de: () => import("./aion2.de.json").then((mod) => mod.default),
    es: () => import("./aion2.es.json").then((mod) => mod.default),
    fr: () => import("./aion2.fr.json").then((mod) => mod.default),
    ja: () => import("./aion2.ja.json").then((mod) => mod.default),
    ko: () => import("./aion2.ko.json").then((mod) => mod.default),
    "pt-BR": () => import("./aion2.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./aion2.ru.json").then((mod) => mod.default),
  },
  "blood-of-dawnwalker": {
    en: () =>
      import("./blood-of-dawnwalker.en.json").then((mod) => mod.default),
  },
  "conan-exiles": {
    en: () => import("./conan-exiles.en.json").then((mod) => mod.default),
    de: () => import("./conan-exiles.de.json").then((mod) => mod.default),
    es: () => import("./conan-exiles.es.json").then((mod) => mod.default),
    fr: () => import("./conan-exiles.fr.json").then((mod) => mod.default),
    it: () => import("./conan-exiles.it.json").then((mod) => mod.default),
    ja: () => import("./conan-exiles.ja.json").then((mod) => mod.default),
    ko: () => import("./conan-exiles.ko.json").then((mod) => mod.default),
    pl: () => import("./conan-exiles.pl.json").then((mod) => mod.default),
    pt: () => import("./conan-exiles.pt.json").then((mod) => mod.default),
    ru: () => import("./conan-exiles.ru.json").then((mod) => mod.default),
    "zh-Hans": () =>
      import("./conan-exiles.zh-Hans.json").then((mod) => mod.default),
    "zh-Hant": () =>
      import("./conan-exiles.zh-Hant.json").then((mod) => mod.default),
  },
  "dune-awakening": {
    en: () => import("./dune-awakening.en.json").then((mod) => mod.default),
    de: () => import("./dune-awakening.de.json").then((mod) => mod.default),
    es: () => import("./dune-awakening.es.json").then((mod) => mod.default),
    fr: () => import("./dune-awakening.fr.json").then((mod) => mod.default),
    it: () => import("./dune-awakening.it.json").then((mod) => mod.default),
    ja: () => import("./dune-awakening.ja.json").then((mod) => mod.default),
    ko: () => import("./dune-awakening.ko.json").then((mod) => mod.default),
    pl: () => import("./dune-awakening.pl.json").then((mod) => mod.default),
    "pt-BR": () =>
      import("./dune-awakening.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./dune-awakening.ru.json").then((mod) => mod.default),
    tr: () => import("./dune-awakening.tr.json").then((mod) => mod.default),
    uk: () => import("./dune-awakening.uk.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./dune-awakening.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./dune-awakening.zh-TW.json").then((mod) => mod.default),
  },
  aniimo: {
    en: () => import("./aniimo.en.json").then((mod) => mod.default),
    de: () => import("./aniimo.de.json").then((mod) => mod.default),
    es: () => import("./aniimo.es.json").then((mod) => mod.default),
    fr: () => import("./aniimo.fr.json").then((mod) => mod.default),
    id: () => import("./aniimo.id.json").then((mod) => mod.default),
    ja: () => import("./aniimo.ja.json").then((mod) => mod.default),
    ko: () => import("./aniimo.ko.json").then((mod) => mod.default),
    pt: () => import("./aniimo.pt.json").then((mod) => mod.default),
    ru: () => import("./aniimo.ru.json").then((mod) => mod.default),
    th: () => import("./aniimo.th.json").then((mod) => mod.default),
    vi: () => import("./aniimo.vi.json").then((mod) => mod.default),
    "zh-CN": () => import("./aniimo.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () => import("./aniimo.zh-TW.json").then((mod) => mod.default),
  },
  drakantos: {
    en: () => import("./drakantos.en.json").then((mod) => mod.default),
  },
  "once-human": {
    en: () => import("./once-human.en.json").then((mod) => mod.default),
    de: () => import("./once-human.de.json").then((mod) => mod.default),
    es: () => import("./once-human.es.json").then((mod) => mod.default),
    fr: () => import("./once-human.fr.json").then((mod) => mod.default),
    ja: () => import("./once-human.ja.json").then((mod) => mod.default),
    ko: () => import("./once-human.ko.json").then((mod) => mod.default),
    pt: () => import("./once-human.pt.json").then((mod) => mod.default),
    ru: () => import("./once-human.ru.json").then((mod) => mod.default),
    "zh-CN": () => import("./once-human.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () => import("./once-human.zh-TW.json").then((mod) => mod.default),
  },
  palia: {
    en: () => import("./palia.en.json").then((mod) => mod.default),
    de: () => import("./palia.de.json").then((mod) => mod.default),
    es: () => import("./palia.es.json").then((mod) => mod.default),
    fr: () => import("./palia.fr.json").then((mod) => mod.default),
    it: () => import("./palia.it.json").then((mod) => mod.default),
    ja: () => import("./palia.ja.json").then((mod) => mod.default),
    ko: () => import("./palia.ko.json").then((mod) => mod.default),
    "pt-BR": () => import("./palia.pt-BR.json").then((mod) => mod.default),
    "zh-CN": () => import("./palia.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () => import("./palia.zh-TW.json").then((mod) => mod.default),
  },
  palworld: {
    en: () => import("./palworld.en.json").then((mod) => mod.default),
    de: () => import("./palworld.de.json").then((mod) => mod.default),
    es: () => import("./palworld.es.json").then((mod) => mod.default),
    "es-MX": () => import("./palworld.es-MX.json").then((mod) => mod.default),
    fr: () => import("./palworld.fr.json").then((mod) => mod.default),
    id: () => import("./palworld.id.json").then((mod) => mod.default),
    it: () => import("./palworld.it.json").then((mod) => mod.default),
    ko: () => import("./palworld.ko.json").then((mod) => mod.default),
    pl: () => import("./palworld.pl.json").then((mod) => mod.default),
    pt: () => import("./palworld.pt.json").then((mod) => mod.default),
    ru: () => import("./palworld.ru.json").then((mod) => mod.default),
    th: () => import("./palworld.th.json").then((mod) => mod.default),
    tr: () => import("./palworld.tr.json").then((mod) => mod.default),
    vi: () => import("./palworld.vi.json").then((mod) => mod.default),
    "zh-CN": () => import("./palworld.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () => import("./palworld.zh-TW.json").then((mod) => mod.default),
  },
  "homm-olden-era": {
    en: () => import("./homm-olden-era.en.json").then((mod) => mod.default),
    de: () => import("./homm-olden-era.de.json").then((mod) => mod.default),
    es: () => import("./homm-olden-era.es.json").then((mod) => mod.default),
    fr: () => import("./homm-olden-era.fr.json").then((mod) => mod.default),
    ja: () => import("./homm-olden-era.ja.json").then((mod) => mod.default),
    ko: () => import("./homm-olden-era.ko.json").then((mod) => mod.default),
    pl: () => import("./homm-olden-era.pl.json").then((mod) => mod.default),
    ru: () => import("./homm-olden-era.ru.json").then((mod) => mod.default),
    cs: () => import("./homm-olden-era.cs.json").then((mod) => mod.default),
    hu: () => import("./homm-olden-era.hu.json").then((mod) => mod.default),
    tr: () => import("./homm-olden-era.tr.json").then((mod) => mod.default),
    uk: () => import("./homm-olden-era.uk.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./homm-olden-era.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./homm-olden-era.zh-TW.json").then((mod) => mod.default),
  },
  rsdragonwilds: {
    en: () => import("./rsdragonwilds.en.json").then((mod) => mod.default),
    de: () => import("./rsdragonwilds.de.json").then((mod) => mod.default),
    es: () => import("./rsdragonwilds.es.json").then((mod) => mod.default),
    fr: () => import("./rsdragonwilds.fr.json").then((mod) => mod.default),
    it: () => import("./rsdragonwilds.it.json").then((mod) => mod.default),
    ja: () => import("./rsdragonwilds.ja.json").then((mod) => mod.default),
    ko: () => import("./rsdragonwilds.ko.json").then((mod) => mod.default),
    pt: () => import("./rsdragonwilds.pt.json").then((mod) => mod.default),
    "zh-CN": () =>
      import("./rsdragonwilds.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () =>
      import("./rsdragonwilds.zh-TW.json").then((mod) => mod.default),
  },
  "thgl-app": {
    en: () => import("./thgl-app.en.json").then((mod) => mod.default),
    de: () => import("./thgl-app.de.json").then((mod) => mod.default),
    es: () => import("./thgl-app.es.json").then((mod) => mod.default),
    "es-MX": () => import("./thgl-app.es-MX.json").then((mod) => mod.default),
    fr: () => import("./thgl-app.fr.json").then((mod) => mod.default),
    it: () => import("./thgl-app.it.json").then((mod) => mod.default),
    ja: () => import("./thgl-app.ja.json").then((mod) => mod.default),
    ko: () => import("./thgl-app.ko.json").then((mod) => mod.default),
    pl: () => import("./thgl-app.pl.json").then((mod) => mod.default),
    "pt-BR": () => import("./thgl-app.pt-BR.json").then((mod) => mod.default),
    ru: () => import("./thgl-app.ru.json").then((mod) => mod.default),
    th: () => import("./thgl-app.th.json").then((mod) => mod.default),
    tr: () => import("./thgl-app.tr.json").then((mod) => mod.default),
    uk: () => import("./thgl-app.uk.json").then((mod) => mod.default),
    "zh-CN": () => import("./thgl-app.zh-CN.json").then((mod) => mod.default),
    "zh-TW": () => import("./thgl-app.zh-TW.json").then((mod) => mod.default),
  },
} satisfies Record<
  string,
  Record<string, () => Promise<Record<string, string>>>
>;

export function isValidLocale(
  locale: string,
): locale is keyof typeof globalDictionaries {
  return locale in globalDictionaries;
}

export async function getGlobalDictionary(locale: string): Promise<Dict> {
  const dictLoader =
    globalDictionaries[locale as keyof typeof globalDictionaries] ??
    globalDictionaries.en;
  const fallbackLoader = globalDictionaries.en;
  try {
    return await dictLoader();
  } catch {
    return fallbackLoader();
  }
}

export async function getAppDictionary(
  appName: string,
  locale: string,
): Promise<Dict> {
  const app = appDictionaries[appName as keyof typeof appDictionaries];
  if (!app) {
    return EMPTY;
  }

  const dictLoader =
    app[
      locale as keyof (typeof appDictionaries)[keyof typeof appDictionaries]
    ] ?? app.en;
  try {
    return await dictLoader();
  } catch {
    console.warn(
      `[i18n] Failed to load ${locale} dictionary for ${appName}, falling back to English`,
    );
    return (await app.en?.()) || EMPTY;
  }
}

/**
 * `{ ...a, ...b }`, memoized on the identity of both inputs. Every render used to
 * spread the game dict (Infinity Nikki: ~50k keys with the codex terms) into a
 * fresh object: real CPU per request and a multi-MB allocation for the GC. The
 * inputs come from module imports and @repo/lib's memory cache, so they stay the
 * same object until the data changes; the WeakMaps let old merges go with them.
 * Callers must treat the result as read-only (they all copy before editing).
 */
const merges = new WeakMap<Dict, WeakMap<Dict, Dict>>();
const EMPTY: Dict = {};
function mergeDicts(a: Dict, b: Dict): Dict {
  let byB = merges.get(a);
  if (!byB) merges.set(a, (byB = new WeakMap()));
  let merged = byB.get(b);
  if (!merged) byB.set(b, (merged = { ...a, ...b }));
  return merged;
}

export async function getStaticDictionary(
  appName: string,
  locale: string,
): Promise<Dict> {
  const [appDict, globalDict] = await Promise.all([
    getAppDictionary(appName, locale),
    getGlobalDictionary(locale),
  ]);
  return mergeDicts(appDict, globalDict);
}

export async function getFullDictionary(
  appName: string,
  locale: string,
): Promise<Dict> {
  const [staticDict, dict] = await Promise.all([
    getStaticDictionary(appName, locale),
    fetchDict(appName, locale),
  ]);
  return mergeDicts(staticDict, dict);
}

/** getFullDictionary for /db pages — includes the game's split-out codex terms
 *  (`dicts/db/<locale>.json`, see `fetchDbDict`). */
export async function getFullDbDictionary(
  appName: string,
  locale: string,
): Promise<Dict> {
  const [staticDict, dict] = await Promise.all([
    getStaticDictionary(appName, locale),
    fetchDbDict(appName, locale),
  ]);
  return mergeDicts(staticDict, dict);
}

/** getFullDbDictionary without codex descriptions (see fetchDbNamesDict) — the
 *  /db layout and detail pages; a detail page reads its own text with
 *  fetchDbDescription. */
export async function getDbNamesDictionary(
  appName: string,
  locale: string,
): Promise<Dict> {
  const [staticDict, dict] = await Promise.all([
    getStaticDictionary(appName, locale),
    fetchDbNamesDict(appName, locale),
  ]);
  return mergeDicts(staticDict, dict);
}
