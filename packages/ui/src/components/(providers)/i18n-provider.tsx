"use client";

import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  type ReactNode,
} from "react";
import { DEFAULT_LOCALE, type Dict, translate } from "@repo/lib";

type TranslateFn = {
  (
    term: string,
    options?: {
      fallback?: string;
      isDesc?: boolean;
      vars?: Record<string, string>;
    },
  ): string;
  rich: (
    term: string,
    options?: {
      fallback?: string;
      isDesc?: boolean;
      components?: Record<string, React.ReactNode>;
    },
  ) => ReactNode;
};

interface I18nContextValue {
  dict: Dict;
  locale: string;
  t: TranslateFn;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18NProviderProps {
  children: ReactNode;
  dict: Dict;
  locale?: string;
}

export function I18NProvider({
  children,
  dict,
  locale = DEFAULT_LOCALE,
}: I18NProviderProps): JSX.Element {
  const t = useCallback<TranslateFn>(
    Object.assign(
      (
        term: string,
        options?: {
          fallback?: string;
          isDesc?: boolean;
          vars?: Record<string, string>;
        },
      ) => translate(dict, term, options),
      {
        rich: (
          term: string,
          options?: {
            fallback?: string;
            isDesc?: boolean;
            components?: Record<string, React.ReactNode>;
          },
        ): ReactNode => {
          const key = options?.isDesc ? `${term}_desc` : term;
          let template = dict[key];

          if (!template && options?.fallback) {
            return t.rich(options.fallback, options);
          }

          template = template ?? "";

          const parts = template.split(/({{.*?}})/g);
          return parts.map((part, i) => {
            const match = part.match(/{{(.*?)}}/);
            if (match) {
              const varName = match[1].trim();
              return (
                <Fragment key={i}>
                  {options?.components?.[varName] ?? null}
                </Fragment>
              );
            }
            return <Fragment key={i}>{part}</Fragment>;
          });
        },
      },
    ),
    [dict],
  );

  return (
    <I18nContext.Provider value={{ dict, locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook to access i18n context
export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18NProvider");
  }
  return context;
};

// Hook to access translation function
export const useT = (): TranslateFn => useI18n().t;

// Hook to access locale
export const useLocale = (): string => useI18n().locale;
