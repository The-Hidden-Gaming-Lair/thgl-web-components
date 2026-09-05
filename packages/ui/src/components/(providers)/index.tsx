"use client";

// Named exports for better tree-shaking
export {
  ActivitiesProvider,
  useActivities,
  useActivitiesStore,
  type Activity,
} from "./activities-provider";

export {
  CoordinatesProvider,
  useCoordinates,
  useCoordinatesOptional,
  REGION_FILTERS,
  type NodesCoordinates,
  type Spawns,
  type Icons,
} from "./coordinates-provider";

export {
  DatabaseProvider,
  useDatabase,
  type Database,
} from "./database-provider";

export { I18NProvider, useI18n, useT, useLocale } from "./i18n-provider";

export {
  UserStoreContext,
  useUserStore,
  useUserStoreApi,
  useUserStoreApiOptional,
} from "./user-store";

export { useAppUpdateStore, type AppUpdateStatus } from "./app-update-store";

export { TooltipProvider } from "../ui/tooltip";
