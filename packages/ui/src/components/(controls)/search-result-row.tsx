"use client";
import { getIconsUrl } from "@repo/lib";
import { MapPin } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { useMap } from "../(interactive-map)/store";
import { useT, useUserStore, type Icons } from "../(providers)";

type IconEntry = NonNullable<ReturnType<Icons["get"]>>;

type SpawnPosition = [number, number] | [number, number, number];

/**
 * Click behavior shared by the historical and live search result rows:
 * enable the clicked type's filter (the map only renders active filters —
 * search doesn't override it), then switch map or fit the result bounds.
 */
export function useSearchResultJump(): (
  type: string,
  targetMapName: string,
  positions: SpawnPosition[],
) => void {
  const map = useMap();
  const t = useT();
  const mapName = useUserStore((state) => state.mapName);
  const setMapName = useUserStore((state) => state.setMapName);
  const enableFilter = useUserStore((state) => state.enableFilter);
  return (type, targetMapName, positions) => {
    enableFilter(type);
    if (targetMapName !== mapName) {
      setMapName(targetMapName);
      if (location.pathname.includes("/maps/")) {
        window.history.pushState({}, "", `/maps/${t(targetMapName)}`);
      }
    } else {
      map?.fitBounds(positions, {
        duration: 1,
        maxZoom: 4,
        padding: [50, 50],
      });
    }
  };
}

export function SearchResultRow({
  appName,
  iconsPath,
  icon,
  label,
  count,
  subtitle,
  title,
  onClick,
}: {
  appName: string;
  iconsPath: string;
  icon?: IconEntry;
  label: ReactNode;
  /** Optional count badge next to the label (e.g. "12 times", "3×"). */
  count?: string;
  subtitle: ReactNode;
  title: string;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      className="flex gap-2 items-center hover:text-primary p-2 truncate w-full"
      onClick={onClick}
      title={title}
      type="button"
    >
      {icon ? (
        typeof icon.icon === "string" ? (
          <img
            alt=""
            className="h-5 w-5 shrink-0"
            height={20}
            src={getIconsUrl(appName, icon.icon, iconsPath)}
            width={20}
          />
        ) : (
          <img
            alt=""
            role="presentation"
            className="shrink-0 object-none"
            src={getIconsUrl(appName, icon.icon.url, iconsPath)}
            width={icon.icon.width}
            height={icon.icon.height}
            style={{
              // width/height in CSS so the `img { height: auto }` preflight
              // can't reclip the wrong cell; adaptive zoom so small-source
              // icons render at the same ~22px box as 64px ones (cells are
              // packed at native size now, not a fixed 64px).
              width: icon.icon.width,
              height: icon.icon.height,
              objectPosition: `-${icon.icon.x}px -${icon.icon.y}px`,
              zoom: 22 / (icon.icon.width || 64),
            }}
          />
        )
      ) : (
        <MapPin className="h-5 w-5 shrink-0" />
      )}
      <div className="text-left">
        <div className="truncate">
          {label}
          {count && <span className="ml-1 text-gray-400 text-xs">{count}</span>}
        </div>
        <div className="text-gray-400 text-xs">{subtitle}</div>
      </div>
    </button>
  );
}
