import { Dict, fetchDict } from "@repo/lib";
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
  drakantos: {
    en: () => import("./drakantos.en.json").then((mod) => mod.default),
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
    return {};
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
    return (await app.en?.()) || {};
  }
}

export async function getStaticDictionary(
  appName: string,
  locale: string,
): Promise<Dict> {
  const [appDict, globalDict] = await Promise.all([
    getAppDictionary(appName, locale),
    getGlobalDictionary(locale),
  ]);
  return {
    ...appDict,
    ...globalDict,
  };
}

export async function getFullDictionary(
  appName: string,
  locale: string,
): Promise<Dict> {
  const [staticDict, dict] = await Promise.all([
    getStaticDictionary(appName, locale),
    fetchDict(appName, locale),
  ]);
  return {
    ...staticDict,
    ...dict,
  };
}
