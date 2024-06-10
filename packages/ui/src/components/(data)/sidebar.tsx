import { cn } from "@repo/lib";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { CaretSortIcon } from "@radix-ui/react-icons";

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
      value: JSX.Element;
    };
    items: {
      key: string;
      value: JSX.Element;
    }[];
  }[];
}): JSX.Element {
  return (
    <aside
      className={cn(
        "fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block",
        className,
      )}
    >
      <ScrollArea className="h-full py-6 pr-6">
        {menu.map((entry) => (
          <Collapsible
            key={entry.category.key}
            className="px-3 py-2"
            defaultOpen={entry.category.key === activeCategory}
          >
            <div className="mb-2 px-4 flex items-center justify-between pr-6">
              <Button
                variant="link"
                className={cn(
                  "text-lg font-semibold tracking-tight text-secondary-foreground",
                )}
              >
                {entry.category.value}
              </Button>

              <CollapsibleTrigger asChild>
                <button className="transition-colors hover:text-primary p-2">
                  <CaretSortIcon className="h-4 w-4" />
                </button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-1">
              {entry.items.map((item) => (
                <Button
                  key={item.key}
                  variant="link"
                  className={cn("w-[calc(100%-2.5rem)] justify-start", {
                    "text-muted-foreground": item.key !== activeItem,
                  })}
                  asChild
                >
                  {item.value}
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </ScrollArea>
    </aside>
  );
}
