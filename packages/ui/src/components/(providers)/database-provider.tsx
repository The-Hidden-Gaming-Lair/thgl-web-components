"use client";

import { createContext, useContext } from "react";

export type Database<T = Record<string, any>> = {
  type: string;
  items: {
    id: string;
    icon?: string;
    props: T;
  }[];
}[];

type ContextValue = {
  database: Database;
};

const Context = createContext<ContextValue | null>(null);

export function DatabaseProvider({
  children,
  database,
}: {
  children: React.ReactNode;
  database: Database;
}) {
  return (
    <Context.Provider
      value={{
        database,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useDatabase = (): ContextValue => {
  const value = useContext(Context);

  if (value === null) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }

  return value;
};
