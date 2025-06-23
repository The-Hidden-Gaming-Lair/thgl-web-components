import type { Mutate, StoreApi } from "zustand";

type StoreWithPersist<State = any> = Mutate<
  StoreApi<State>,
  [["zustand/persist", State]]
>;

export const withStorageDOMEvents = (store: StoreWithPersist) => {
  if (typeof window === "undefined") {
    return;
  }
  const storageEventCallback = (e: StorageEvent) => {
    try {
      if (e.key && e.key === store.persist.getOptions().name && e.newValue) {
        store.persist.rehydrate();
      }
    } catch (error) {
      console.error(error);
    }
  };

  window.addEventListener("storage", storageEventCallback);

  return () => {
    window.removeEventListener("storage", storageEventCallback);
  };
};
