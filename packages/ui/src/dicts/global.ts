// Global dictionary files per locale. Shared by the server-only loaders in
// ./index.ts and the Overwolf apps (client bundles), so no "server-only" here.
// Note: `pt`, `zh-Hans`, `zh-Hant` are IETF-style aliases for `pt-BR`, `zh-CN`,
// `zh-TW` respectively. Apps that declare these locales in supportedLocales
// (e.g. conan-exiles) need the alias here so isValidLocale() accepts them and
// the [locale] route doesn't 404.
export const globalDictionaries = {
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
