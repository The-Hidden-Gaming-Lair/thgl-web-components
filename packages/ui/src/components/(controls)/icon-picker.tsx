"use client";

import { cn, getIconsUrl } from "@repo/lib";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ArrowLeft, Circle } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../ui/command";
import { useCoordinates, useT } from "../(providers)";
import gameIcons from "./icons.json";

type Icon = {
  name: string;
  url: string;
  author?: string;
  filterId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
export function IconPicker({
  appName,
  value,
  onChange,
  className,
  iconsPath,
}: {
  appName: string;
  value: {
    name: string;
    url: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } | null;
  onChange: (value: Icon | null) => void;
  className?: string;
  iconsPath: string;
}) {
  const [selection, setSelection] = useState<{
    tag: string;
    icons: Icon[];
  } | null>(null);
  const [icons, setIcons] = useState<
    | {
        tag: string;
        icons: {
          name: string;
          url: string;
          author?: string;
          x: number;
          y: number;
          width: number;
          height: number;
        }[];
      }[][]
    | null
  >(null);
  const t = useT();
  const { filters } = useCoordinates();

  useEffect(() => {
    const appIcons = {
      tag: "App Specific",
      icons: Object.values(
        filters.reduce(
          (acc, filter) => {
            filter.values.forEach((value) => {
              const name = t(value.id);
              if (acc[name]) {
                return;
              }

              if (typeof value.icon === "string") {
                acc[name] = {
                  name: name,
                  filterId: value.id,
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0,
                  url: `/icons/${value.icon}`,
                };
              } else {
                acc[name] = {
                  ...value.icon,
                  url: `/icons/${value.icon.url}`,
                  name: name,
                  filterId: value.id,
                };
              }
            });
            return acc;
          },
          {} as Record<string, Icon>,
        ),
      ),
    };
    setIcons([[appIcons], ...gameIcons]);
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <div className="w-full flex items-center gap-2">
            {value ? (
              value.width ? (
                <img
                  src={getIconsUrl(appName, value.url, iconsPath)}
                  alt={value.name}
                  className="object-none"
                  width={value.width}
                  height={value.height}
                  style={{
                    width: value.width,
                    height: value.height,
                    objectPosition: `-${value.x}px -${value.y}px`,
                    // adaptive: uniform ~19px box by the icon's own width (cells
                    // are packed at native size now, not a fixed 64px).
                    zoom: 19 / (value.width || 64),
                  }}
                />
              ) : (
                <img
                  src={getIconsUrl(appName, value.url, iconsPath)}
                  alt={value.name}
                  loading="lazy"
                  className="h-4 w-4"
                />
              )
            ) : (
              <Circle className="h-4 w-4" />
            )}
            <div className="truncate flex-1">
              {value ? value.name : "Pick an icon"}
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 max-h-(--radix-popover-content-available-height) overflow-hidden flex flex-col">
        {icons === null ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        ) : selection ? (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="px-4 pt-4 pb-2 space-y-2 shrink-0">
              <button
                className="flex gap-1 items-center text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => setSelection(null)}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to categories</span>
              </button>
              <div className="text-sm font-medium">{selection.tag}</div>
            </div>
            <div className="flex flex-wrap gap-1 flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ring/50 [&::-webkit-scrollbar-track]:bg-transparent">
              {selection.icons.map((icon) => (
                <button
                  key={`${icon.name}-${icon.author}`}
                  onClick={() => onChange(icon)}
                  title={`${icon.name}${icon.author ? `made by ${icon.author}` : ""}`}
                >
                  {icon.width !== 0 ? (
                    <img
                      src={
                        appName
                          ? getIconsUrl(appName, icon.url, iconsPath)
                          : icon.url
                      }
                      alt={icon.name}
                      className="object-none"
                      width={icon.width}
                      height={icon.height}
                      style={{
                        width: icon.width,
                        height: icon.height,
                        objectPosition: `-${icon.x}px -${icon.y}px`,
                        // adaptive: uniform ~32px box by the icon's own width
                        // (cells are packed at native size now, not a fixed 64px).
                        zoom: 32 / (icon.width || 64),
                      }}
                    />
                  ) : (
                    <img
                      src={
                        appName
                          ? getIconsUrl(appName, icon.url, iconsPath)
                          : icon.url
                      }
                      alt={icon.name}
                      loading="lazy"
                      className="h-6 w-6 active:scale-105"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Command className="flex-1 min-h-0">
            <CommandInput placeholder="Search category..." />
            <CommandEmpty className="w-full">No category found.</CommandEmpty>
            <CommandList className="[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ring/50 [&::-webkit-scrollbar-track]:bg-transparent">
              <CommandGroup className="p-0">
                {icons.map((subIcons, index) => (
                  <Fragment key={index}>
                    {subIcons.map(({ tag, icons, ...props }) => (
                      <CommandItem
                        key={tag}
                        value={tag}
                        onSelect={() => {
                          setSelection({ tag, icons, ...props });
                        }}
                      >
                        <span>
                          {tag} ({icons.length})
                        </span>
                      </CommandItem>
                    ))}
                    {index !== icons.length - 1 && <CommandSeparator />}
                  </Fragment>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}

        <Button
          size="sm"
          onClick={() => onChange(null)}
          className="block mx-auto shrink-0 my-3"
          variant="outline"
        >
          Clear icon
        </Button>
      </PopoverContent>
    </Popover>
  );
}
