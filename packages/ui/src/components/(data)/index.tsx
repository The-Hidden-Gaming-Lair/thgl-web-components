// Named exports for better tree-shaking
export { Activities } from "./activities";
export { ActivityProgress } from "./activity-progress";
export { ActivityReset } from "./activity-reset";
export { SingleComment, type Comment, type CommentImage } from "./comment";
export { Comments } from "./comments";
export { CustomActivities } from "./custom-activities";
export { DataTable, type ColumnDef } from "./data-table";
export { DuneAltitude } from "./dune-altitude";
export { DuneDeepDesertGrid } from "./dune-deep-desert-grid";
export { DuneHeatmaps } from "./dune-heatmaps";
export { CrimsonDesertZones } from "./crimson-desert-zones";
export { SatisfactorySeed } from "./satisfactory-seed/satisfactory-seed";
export { CrimsonDesertSaveImport } from "./crimson-desert-save-import";
export {
  MapOverlays,
  ZoneDetailsPanel,
  type MapOverlaysProps,
} from "./map-overlays";
export { NodeDetails } from "./node-details";
export { MarkerPanel } from "./marker-panel";
export { PaliaGridToggle } from "./palia-grid-toggle";
export { PaliaGrid } from "./palia-grid";
export { PaliaWebGrid } from "./palia-web-grid";
export { PaliaTime } from "./palia-time";
export {
  PaliaWeeklyWants,
  VillagersWeeklyWants,
  villagers,
  itemIcons,
  type WEEKLY_WANTS,
  type API_WEEKLY_WANTS,
  type REWARD_LEVEL,
} from "./palia-weekly-wants";
export { PalworldCoordinates } from "./palworld-coordinates";
export { Ping } from "./ping";
export { PremiumAlert } from "./premium-alert";
export { Sidebar, CollapsibleTrigger } from "./sidebar";
export { default as SimpleMapDynamic } from "./simple-map-dynamic";
export { SpawnsList } from "./spawns-list";
export { Troops, type Troops as TroopsType } from "./troops";
export { AuthAlert } from "./auth-alert";

// Re-export UI components
export { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "../ui/breadcrumb";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "../ui/dropdown-menu";
export { Skeleton } from "../ui/skeleton";
export { ChevronDownIcon } from "@radix-ui/react-icons";
