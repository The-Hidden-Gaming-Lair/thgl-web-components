import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { withStorageDOMEvents } from "./dom";

export type Perks = {
  adRemoval: boolean;
  previewReleaseAccess: boolean;
  comments: boolean;
  premiumFeatures: boolean;
};

export type THGLAccount = {
  userId: string | null;
  decryptedUserId: string | null;
  perks: Perks;
};

export const defaultPerks: Perks = {
  adRemoval: false,
  comments: false,
  premiumFeatures: false,
  previewReleaseAccess: false,
};

export const useAccountStore = create(
  subscribeWithSelector(
    persist<{
      _hasHydrated: boolean;
      setHasHydrated: (state: boolean) => void;
      userId: string | null;
      decryptedUserId: string | null;
      perks: Perks;
      setAccount: (
        userId: string | null,
        decryptedUserId: string | null,
        perks: Perks,
      ) => void;
      showUserDialog: boolean;
      setShowUserDialog: (showUserDialog: boolean) => void;
    }>(
      (set) => ({
        _hasHydrated: false,
        setHasHydrated: (state) => {
          set({ _hasHydrated: state });
        },
        userId: null,
        decryptedUserId: null,
        perks: defaultPerks,
        setAccount: (userId, decryptedUserId, perks) => {
          set({
            userId,
            decryptedUserId,
            perks,
          });
        },
        showUserDialog: false,
        setShowUserDialog: (showUserDialog) => {
          set({ showUserDialog });
        },
      }),
      {
        name: "account-storage",
        onRehydrateStorage: () => (state) => {
          if (!state?._hasHydrated) {
            state?.setHasHydrated(true);
          }
        },
        version: 1,
        migrate: (persistedState: any, version) => {
          if (version === 0) {
            persistedState.perks = {
              adRemoval: persistedState.adRemoval ?? false,
              comments: persistedState.adRemoval ?? false,
              premiumFeatures: persistedState.adRemoval ?? false,
              previewReleaseAccess:
                persistedState.previewReleaseAccess ?? false,
            };
            delete persistedState.adRemoval;
            delete persistedState.previewReleaseAccess;
          }
          return persistedState;
        },
      },
    ),
  ),
);

withStorageDOMEvents(useAccountStore);
