"use client";
import { createContext, useCallback, useContext } from "react";

export type Dict = Record<string, string>;
interface ContextValue {
  dict: Dict;
  t: (term?: string, isDesc?: boolean) => string;
}

const Context = createContext<ContextValue | null>(null);

export function I18NProvider({
  children,
  dict,
}: {
  children: React.ReactNode;
  dict: Dict;
}): JSX.Element {
  const t = useCallback(
    (term?: string, isDesc?: boolean, fallback?: string) => {
      if (!term) {
        return "";
      }
      const targetTerm = isDesc ? `${term}_desc` : term;
      const value = dict[targetTerm];
      if (value) {
        return value;
      }
      if (fallback) {
        return t(fallback, isDesc);
      }
      return "";
    },
    [dict]
  );

  return <Context.Provider value={{ dict, t }}>{children}</Context.Provider>;
}

export const useI18n = (): ContextValue => {
  const value = useContext(Context);

  if (value === null) {
    throw new Error("useI18n must be used within a I18NProvider");
  }

  return value;
};

export const useT = (): ((
  term?: string,
  isDesc?: boolean,
  fallback?: string
) => string) => {
  const { t } = useI18n();
  return t;
};
