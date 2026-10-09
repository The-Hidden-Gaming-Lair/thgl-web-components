import { useEffect, useState } from "react";
import { DEFAULT_LOCALE, Dict, fetchDict, useSettingsStore } from "@repo/lib";
import { globalDictionaries } from "../../dicts/global";

/**
 * The Overwolf apps have no locale in the URL (the web does): the language is
 * the persisted `overwolfLocale` setting, limited to the app's
 * `supportedLocales`. Returns the English dict until the chosen locale's dicts
 * are loaded; English stays underneath so a missing term never shows a key.
 */
export function useOverwolfDict(
  appName: string,
  supportedLocales: string[] | undefined,
  enDict: Dict,
): { dict: Dict; locale: string } {
  const setting = useSettingsStore((state) => state.overwolfLocale);
  const locale =
    setting && supportedLocales?.includes(setting) ? setting : DEFAULT_LOCALE;
  const [loaded, setLoaded] = useState<{ locale: string; dict: Dict } | null>(
    null,
  );

  useEffect(() => {
    if (locale === DEFAULT_LOCALE) return;
    let cancelled = false;
    const loadGlobal =
      globalDictionaries[locale as keyof typeof globalDictionaries];
    Promise.all([loadGlobal ? loadGlobal() : {}, fetchDict(appName, locale)])
      .then(([globalDict, gameDict]) => {
        if (cancelled) return;
        setLoaded({
          locale,
          dict: { ...enDict, ...globalDict, ...gameDict } as Dict,
        });
      })
      .catch((error) => {
        console.warn(`[i18n] Failed to load ${locale} for ${appName}`, error);
      });
    return () => {
      cancelled = true;
    };
  }, [appName, locale, enDict]);

  if (locale === DEFAULT_LOCALE || loaded?.locale !== locale) {
    return { dict: enDict, locale: DEFAULT_LOCALE };
  }
  return loaded;
}
