"use client";
import { games } from "@repo/lib";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  ScrollArea,
} from "@repo/ui/controls";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export function GlobalSearch({
  blogMeta,
  faqMeta,
}: {
  blogMeta: { id: string; headline: string }[];
  faqMeta: { id: string; headline: string }[];
}) {
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setShowSearch(true)}
        aria-label="Search"
        className="p-2 hover:bg-muted rounded-md transition"
      >
        <Search className="h-5 w-5 text-muted-foreground" />
      </button>
      <Dialog open={showSearch} onOpenChange={() => setShowSearch(false)}>
        <DialogContent className="p-0 overflow-hidden max-w-xl">
          <DialogTitle className="hidden">Search</DialogTitle>
          <DialogDescription className="hidden">
            Search for games, maps, or tools
          </DialogDescription>
          <Command>
            <CommandInput placeholder="Search games, maps, or tools..." />
            <ScrollArea>
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Games">
                  {games
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((game) => (
                      <CommandItem key={game.id}>
                        <a href={`/apps/${game.id}`} className="w-full block">
                          {game.title}
                        </a>
                      </CommandItem>
                    ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="FAQ">
                  {faqMeta.map((entry) => (
                    <CommandItem key={entry.id}>
                      <a href={`/faq/${entry.id}`} className="w-full block">
                        {entry.headline}
                      </a>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Blog">
                  {blogMeta.map((entry) => (
                    <CommandItem key={entry.id}>
                      <a href={`/blog/${entry.id}`} className="w-full block">
                        {entry.headline}
                      </a>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </ScrollArea>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
