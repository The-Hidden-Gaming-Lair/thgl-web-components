import { cn } from "@repo/lib";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ArrowLeft, Circle } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { ScrollArea } from "../ui/scroll-area";
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
import { gameIcons } from ".";

export function IconPicker({
  value,
  onChange,
  className,
}: {
  value: {
    name: string;
    url: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } | null;
  onChange: (
    value: {
      name: string;
      url: string;
      x: number;
      y: number;
      width: number;
      height: number;
    } | null,
  ) => void;
  className?: string;
}) {
  const [selection, setSelection] = useState<{
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
      icons: filters.flatMap((filter) => {
        return filter.values.map((value) => ({
          name: t(value.id),
          url: `/icons/${value.icon}`,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        }));
      }),
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
                  src={value.url}
                  alt={value.name}
                  className="object-none"
                  width={value.width}
                  height={value.height}
                  style={{
                    objectPosition: `-${value.x}px -${value.y}px`,
                    zoom: 0.3,
                  }}
                />
              ) : (
                <img
                  src={value.url}
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
      <PopoverContent className="space-y-4">
        {icons === null ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        ) : selection ? (
          <div className="space-y-2">
            <button
              className="flex gap-1 items-center text-sm text-primary underline-offset-4 hover:underline"
              onClick={() => setSelection(null)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to categories</span>
            </button>
            <div className="text-sm font-medium">{selection.tag}</div>
            <div className="flex flex-wrap gap-1">
              <ScrollArea className="max-h-96">
                {selection.icons.map((icon) => (
                  <button
                    key={`${icon.name}-${icon.author}`}
                    onClick={() => onChange(icon)}
                    title={`${icon.name}${icon.author ? `made by ${icon.author}` : ""}`}
                  >
                    {icon.width !== 0 ? (
                      <img
                        src={icon.url}
                        alt={icon.name}
                        className="object-none"
                        width={icon.width}
                        height={icon.height}
                        style={{
                          objectPosition: `-${icon.x}px -${icon.y}px`,
                          zoom: 0.5,
                        }}
                      />
                    ) : (
                      <img
                        src={icon.url}
                        alt={icon.name}
                        loading="lazy"
                        className="h-6 w-6 active:scale-105"
                      />
                    )}
                  </button>
                ))}
              </ScrollArea>
            </div>
          </div>
        ) : (
          <Command>
            <CommandInput placeholder="Search category..." />
            <CommandEmpty className="w-full">No category found.</CommandEmpty>
            <CommandList>
              <CommandGroup className="p-0 flex">
                <ScrollArea className="h-full max-h-96">
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
                          {/* <img
                            src={icons[0].url}
                            alt=""
                            className="mr-2 h-4 w-4"
                          /> */}
                          <span>
                            {tag} ({icons.length})
                          </span>
                        </CommandItem>
                      ))}
                      {index !== icons.length - 1 && <CommandSeparator />}
                    </Fragment>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        )}

        <Button
          size="sm"
          onClick={() => onChange(null)}
          className="block mx-auto"
          variant="outline"
        >
          Clear icon
        </Button>
      </PopoverContent>
    </Popover>
  );
}
