import { cn } from "@repo/lib";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useEffect, useState } from "react";
import { ChevronsUpDown } from "lucide-react";

export { CollapsibleTrigger };
export function Sidebar({
  className,
  activeCategory,
  activeItem,
  menu,
}: {
  className?: string;
  activeCategory?: string;
  activeItem?: string;
  menu: {
    category: {
      key: string;
      value: JSX.Element | string;
    };
    items: {
      key: string;
      text: string;
      value: JSX.Element;
    }[];
  }[];
}): JSX.Element {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setOpen(false);
    }
  }, [activeCategory, activeItem]);

  const entry = menu.find((item) => item.category.key === activeCategory);
  const item = entry?.items.find((i) => i.key === activeItem);

  const content = (
    <>
      {menu.map((entry) => (
        <Collapsible
          key={entry.category.key}
          className="py-1 lg:w-[260px]"
          defaultOpen={entry.category.key === activeCategory}
        >
          <div className="mb-2 flex items-center justify-between pr-6">
            {typeof entry.category.value === "string" ? (
              <CollapsibleTrigger asChild>
                <Button
                  variant="link"
                  className={cn(
                    "block text-lg font-semibold tracking-tight text-secondary-foreground truncate",
                  )}
                  title={entry.category.value}
                >
                  {entry.category.value}
                </Button>
              </CollapsibleTrigger>
            ) : (
              <Button
                variant="link"
                className={cn(
                  "block text-lg font-semibold tracking-tight text-secondary-foreground truncate",
                )}
              >
                {entry.category.value}
              </Button>
            )}

            <CollapsibleTrigger asChild>
              <button className="transition-colors hover:text-primary p-2 shrink-0">
                <CaretSortIcon className="h-4 w-4" />
              </button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            {entry.items.map((item) => (
              <Button
                key={item.key}
                variant="link"
                className={cn(
                  "w-[calc(100%-2.5rem)] h-auto justify-start inline-block text-left truncate",
                  {
                    "text-muted-foreground": item.key !== activeItem,
                  },
                )}
                asChild
              >
                {item.value}
              </Button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </>
  );

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild className={cn("xl:hidden")}>
          <Button variant="secondary" size="sm">
            {entry?.category.value ?? ""}
            {" - "}
            {item?.text ?? ""}
            <ChevronsUpDown className="ml-2 w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <ScrollArea className="h-96">{content}</ScrollArea>
        </PopoverContent>
      </Popover>
      <aside
        className={cn(
          "hidden xl:ml-[-260px] xl:block xl:fixed xl:top-14 xl:z-30 xl:h-[calc(100vh-3.5rem)] ",
          className,
        )}
      >
        <ScrollArea className="h-full">{content}</ScrollArea>
      </aside>
    </>
  );
}
