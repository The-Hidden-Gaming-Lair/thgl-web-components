import { create } from "zustand";
import { persist } from "zustand/middleware";
import { withStorageDOMEvents } from "./dom";

export const useAccountStore = create(
  persist<{
    userId: string | null;
    adRemoval: boolean;
    previewReleaseAccess: boolean;
    setAccount: (
      userId: string | null,
      adRemoval: boolean,
      previewReleaseAccess: boolean
    ) => void;
  }>(
    (set) => ({
      userId: null,
      adRemoval: false,
      previewReleaseAccess: false,
      setAccount: (userId, adRemoval, previewReleaseAccess) => {
        set({
          userId,
          adRemoval,
          previewReleaseAccess,
        });
      },
    }),
    {
      name: "account-storage",
    }
  )
);

withStorageDOMEvents(useAccountStore);
