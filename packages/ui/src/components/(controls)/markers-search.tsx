"use client";

import { TileOptions, cn } from "@repo/lib";
import { ReactNode, useEffect, useState } from "react";
import { Input } from "../ui/input";
import { useUserStore } from "../(providers)";
import { MarkersSearchResults } from "./markers-search-results";
import { MarkersFilters } from "./markers-filters";
import { ScrollArea } from "../ui/scroll-area";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { Search, TriangleAlert } from "lucide-react";

export function MarkersSearch({
  children,
  tileOptions,
  additionalFilters,
  embed,
}: {
  children?: ReactNode;
  tileOptions?: TileOptions;
  additionalFilters?: ReactNode;
  embed?: boolean;
}): JSX.Element {
  const { _hasHydrated, search, setSearch, searchIsLoading } = useUserStore();
  const [showFilters, setShowFilters] = useState(true);
  const mapNames = Object.keys(tileOptions ?? {});
  const [internalSearch, setInternalSearch] = useState(search);

  useEffect(() => {
    if (_hasHydrated) {
      setInternalSearch(search);
    }
  }, [_hasHydrated]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearch(internalSearch);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [internalSearch]);
  const isLoading = searchIsLoading || search !== internalSearch;

  return (
    <div
      className={cn(
        `fixed w-[175px] md:w-[300px] top-[64px] left-2 bottom-2 z-[500] md:ml-[77px] pointer-events-none flex flex-col`,
        { "top-2 md:ml-0 ": embed },
      )}
    >
      <div className="relative flex w-full pointer-events-auto bg-card border rounded-md">
        <Input
          autoComplete="off"
          autoCorrect="off"
          className=" placeholder:text-gray-400"
          onChange={(event) => {
            setInternalSearch(event.target.value);
          }}
          placeholder="Search..."
          type="text"
          value={internalSearch}
        />
        {internalSearch ? (
          <button
            className="flex absolute inset-y-0 right-6 items-center pr-2 text-gray-400 hover:text-gray-200"
            onClick={() => {
              setInternalSearch("");
            }}
            type="button"
          >
            <svg
              className="block w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0h24v24H0z" fill="none" stroke="none" />
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
            <div className="h-3/6 w-px bg-gray-600 mx-1.5" />
          </button>
        ) : (
          <div className="flex absolute inset-y-0 right-6 items-center pr-2 text-gray-400">
            <svg
              className="block w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <div className="h-3/6 w-px bg-gray-600 mx-1.5" />
          </div>
        )}
        <button
          aria-expanded={showFilters}
          aria-haspopup="menu"
          aria-label="Open filters"
          className={cn(
            `flex absolute inset-y-0 right-1 items-center pr-2 text-gray-400 hover:text-gray-200 md:text-white`,
          )}
          onClick={() => {
            setShowFilters(!showFilters);
          }}
          type="button"
        >
          <CaretSortIcon />
        </button>
      </div>
      <div
        className={cn(
          `w-full text-sm mt-1 h-[calc(100vh-116px)] flex flex-col md:gap-2 justify-between`,
          { "h-[100vh]": embed },
        )}
      >
        <ScrollArea
          className={cn(
            "pointer-events-auto border rounded-md bg-card text-card-foreground shadow max-h-[300px] md:max-h-[500px]",
            {
              collapse: !showFilters,
            },
          )}
          type="auto"
        >
          {internalSearch ? (
            <>
              {isLoading && internalSearch.length >= 3 && (
                <div className="p-2 text-center">
                  <Search className="w-4 h-4 mx-auto" />
                  Searching...
                </div>
              )}
              {internalSearch.length < 3 && (
                <div className="p-2 text-center">
                  <TriangleAlert className="w-4 h-4 mx-auto" />
                  Please enter at least 3 characters
                </div>
              )}
              {!isLoading && internalSearch.length >= 3 && (
                <MarkersSearchResults mapNames={mapNames} />
              )}
            </>
          ) : (
            <MarkersFilters mapNames={mapNames}>
              {additionalFilters}
            </MarkersFilters>
          )}
        </ScrollArea>
        {children}
      </div>
    </div>
  );
}
