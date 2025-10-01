import { DEFAULT_LOCALE, Dict, fetchDict, fetchVersion } from "@repo/lib";
import "server-only";

// Global dictionary files per locale
const globalDictionaries = {
  en: () => import("./en.json").then((mod) => mod.default),
  de: () => import("./de.json").then((mod) => mod.default),
  es: () => import("./es.json").then((mod) => mod.default),
  "es-MX": () => import("./es-MX.json").then((mod) => mod.default),
  fr: () => import("./fr.json").then((mod) => mod.default),
  it: () => import("./it.json").then((mod) => mod.default),
  ja: () => import("./ja.json").then((mod) => mod.default),
  ko: () => import("./ko.json").then((mod) => mod.default),
  pl: () => import("./pl.json").then((mod) => mod.default),
  "pt-BR": () => import("./pt-BR.json").then((mod) => mod.default),
  ru: () => import("./ru.json").then((mod) => mod.default),
  tr: () => import("./tr.json").then((mod) => mod.default),
  uk: () => import("./uk.json").then((mod) => mod.default),
  "zh-CN": () => import("./zh-CN.json").then((mod) => mod.default),
  "zh-TW": () => import("./zh-TW.json").then((mod) => mod.default),
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
    locale !== DEFAULT_LOCALE
      ? fetchDict(appName, locale)
      : fetchVersion(appName).then((res) => res.data.enDict),
  ]);
  return {
    ...staticDict,
    ...dict,
  };
}
