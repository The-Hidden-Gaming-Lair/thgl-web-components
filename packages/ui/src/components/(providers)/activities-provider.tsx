import { createContext, useContext, useEffect, useMemo } from "react";
import type { StoreApi } from "zustand";
import { createStore, useStore } from "zustand";
import {
  persist,
  subscribeWithSelector,
  type PersistOptions,
} from "zustand/middleware";

export type Activity = {
  title: string;
  category: string;
  max: number;
  frequently: "daily" | "weekly";
};

type ActivitiesStoreState = {
  customActivities: Activity[];
  addCustomActivity: (activity: Activity) => void;
  removeCustomActivity: (title: string) => void;
  restoreDefaultActivities: () => void;
  progress: Record<string, number>;
  resetProgress: (frequently: Activity["frequently"]) => void;
  setProgress: (activity: string, progress: number) => void;
  openCategories: string[];
  setOpenCategories: (categories: string[]) => void;
  hiddenCategories: string[];
  toggleHiddenCategory: (category: string) => void;
};

type Write<T, U> = Omit<T, keyof U> & U;
interface StorePersist<S, Ps> {
  persist: {
    setOptions: (options: Partial<PersistOptions<S, Ps>>) => void;
    clearStorage: () => void;
    rehydrate: () => Promise<void> | void;
    hasHydrated: () => boolean;
    onHydrate: (fn: PersistListener<S>) => () => void;
    onFinishHydration: (fn: PersistListener<S>) => () => void;
    getOptions: () => Partial<PersistOptions<S, Ps>>;
  };
}
type PersistListener<S> = (state: S) => void;
type ActivitiesStore = Write<
  StoreApi<ActivitiesStoreState>,
  StorePersist<ActivitiesStoreState, ActivitiesStoreState>
>;

interface ContextValue {
  activitiesStore: ActivitiesStore;
}

const Context = createContext<ContextValue | null>(null);

export function ActivitiesProvider({
  children,
  activities,
}: {
  children: React.ReactNode;
  activities: Activity[];
}): JSX.Element {
  const activitiesStore = useMemo(
    () =>
      createStore(
        subscribeWithSelector(
          persist<ActivitiesStoreState>(
            (set, get) => ({
              customActivities: activities,
              addCustomActivity: (activity) =>
                set({
                  customActivities: [...get().customActivities, activity],
                }),
              removeCustomActivity: (title) =>
                set({
                  customActivities: get().customActivities.filter(
                    (a) => a.title !== title
                  ),
                }),
              restoreDefaultActivities: () =>
                set({
                  customActivities: activities,
                  openCategories: [
                    ...new Set(activities.map((activity) => activity.category)),
                  ],
                }),
              progress: {},
              resetProgress: (frequently) =>
                set({
                  progress: Object.fromEntries(
                    Object.entries(get().progress).map(
                      ([activity, progress]) => [
                        activity,
                        [...activities, ...get().customActivities].find(
                          (a) => a.title === activity
                        )?.frequently === frequently
                          ? 0
                          : progress,
                      ]
                    )
                  ),
                }),
              setProgress: (activity, progress) =>
                set({
                  progress: {
                    ...get().progress,
                    [activity]: progress,
                  },
                }),
              openCategories: [
                ...new Set(activities.map((activity) => activity.category)),
              ],
              setOpenCategories: (categories) =>
                set({
                  openCategories: categories,
                }),
              hiddenCategories: [],
              toggleHiddenCategory: (category) =>
                set({
                  hiddenCategories: get().hiddenCategories.includes(category)
                    ? get().hiddenCategories.filter((c) => c !== category)
                    : [...get().hiddenCategories, category],
                }),
            }),
            {
              name: "activities",
              skipHydration: true,
            }
          )
        )
      ),
    []
  );

  useEffect(() => {
    activitiesStore.persist.rehydrate();
  }, []);

  return (
    <Context.Provider
      value={{
        activitiesStore,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useActivities = (): ContextValue => {
  const value = useContext(Context);

  if (value === null) {
    throw new Error("useActivities must be used within a ActivitiesProvider");
  }

  return value;
};

export function useActivitiesStore(): ActivitiesStoreState;
export function useActivitiesStore<T>(
  selector: (state: ActivitiesStoreState) => T
): T;
export function useActivitiesStore<T>(
  selector?: (state: ActivitiesStoreState) => T
) {
  const { activitiesStore } = useActivities();
  return useStore(activitiesStore, selector!);
}
