import { Dict, fetchDbDict, fetchDbNamesDict, fetchDict } from "@repo/lib";
import "server-only";

// Global dictionary files per locale.
// Note: `pt`, `zh-Hans`, `zh-Hant` are IETF-style aliases for `pt-BR`, `zh-CN`,
// `zh-TW` respectively. Apps that declare these locales in supportedLocales
// (e.g. conan-exiles) need the alias here so isValidLocale() accepts them and
// the [locale] route doesn't 404.
const globalDictionaries = {
  en: () => import("./en.json").then((mod) => mod.default),
  cs: () => import("./cs.json").then((mod) => mod.default),
  de: () => import("./de.json").then((mod) => mod.default),
  es: () => import("./es.json").then((mod) => mod.default),
  "es-MX": () => import("./es-MX.json").then((mod) => mod.default),
  fr: () => import("./fr.json").then((mod) => mod.default),
  hu: () => import("./hu.json").then((mod) => mod.default),
  id: () => import("./id.json").then((mod) => mod.default),
  it: () => import("./it.json").then((mod) => mod.default),
  ja: () => import("./ja.json").then((mod) => mod.default),
  ko: () => import("./ko.json").then((mod) => mod.default),
  pl: () => import("./pl.json").then((mod) => mod.default),
  pt: () => import("./pt-BR.json").then((mod) => mod.default),
  "pt-BR": () => import("./pt-BR.json").then((mod) => mod.default),
  ru: () => import("./ru.json").then((mod) => mod.default),
  th: () => import("./th.json").then((mod) => mod.default),
  tr: () => import("./tr.json").then((mod) => mod.default),
  uk: () => import("./uk.json").then((mod) => mod.default),
  vi: () => import("./vi.json").then((mod) => mod.default),
  "zh-CN": () => import("./zh-CN.json").then((mod) => mod.default),
  "zh-Hans": () => import("./zh-CN.json").then((mod) => mod.default),
  "zh-TW": () => import("./zh-TW.json").then((mod) => mod.default),
  "zh-Hant": () => import("./zh-TW.json").then((mod) => mod.default),
};

// App-specific dictionaries per locale
const appDictionaries = {
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
