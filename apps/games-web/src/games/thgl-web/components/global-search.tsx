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
        className="flex items-center gap-2 h-8 rounded-md border border-neutral-700 bg-zinc-800/50 px-3 text-sm text-muted-foreground hover:text-foreground hover:border-neutral-600 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search</span>
        <kbd className="inline-flex h-5 items-center rounded border border-neutral-700 bg-zinc-900 px-1.5 font-mono text-[10px] text-muted-foreground">
          /
        </kbd>
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
                  {/* Copy first: an in-place sort reorders the shared registry
                      for every later render in this process (it made the
                      server render the app dashboard sidebar A-Z). */}
                  {[...games]
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
