"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";

import {
  blogEntries,
  allBlogContentReferences,
  type BlogContentReference,
} from "@/lib/blog-entries";
import { LabelBadge } from "@/components/faq-label-badge";

export function BlogList() {
  const [selectedReferences, setSelectedReferences] = useState<
    BlogContentReference[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  const sortedEntries = useMemo(
    () =>
      [...blogEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [],
  );

  const filteredEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sortedEntries.filter((entry) => {
      const matchesReferences =
        selectedReferences.length === 0 ||
        entry.contentReference.some((reference) =>
          selectedReferences.includes(reference),
        );

      if (!matchesReferences) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        entry.headline,
        entry.title,
        entry.description,
        entry.content,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [searchQuery, selectedReferences, sortedEntries]);

  const toggleReference = (reference: BlogContentReference) => {
    setSelectedReferences((previous) =>
      previous.includes(reference)
        ? previous.filter((label) => label !== reference)
        : [...previous, reference],
    );
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const clearFilters = () => {
    setSelectedReferences([]);
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedReferences.length > 0 || searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by title, headline, or description"
            aria-label="Search blog posts"
            className="w-full rounded-md border border-muted-foreground/30 bg-background px-3 py-2 text-sm shadow-sm outline-none ring-brand/20 focus:border-brand focus:ring-2"
          />
        </div>

        {allBlogContentReferences.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allBlogContentReferences.map((reference) => {
              const isSelected = selectedReferences.includes(reference);
              return (
                <button
                  key={reference}
                  type="button"
                  onClick={() => toggleReference(reference)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-brand/60 bg-brand/10 text-brand"
                      : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                  }`}
                >
                  <LabelBadge
                    text={reference}
                    variant="minimal"
                    dotClassName="h-2.5 w-2.5"
                  />
                </button>
              );
            })}
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Showing {filteredEntries.length} of {sortedEntries.length} posts
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="font-medium text-brand hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {filteredEntries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 py-12 text-center text-sm text-muted-foreground">
          <p>No posts match the current filters yet.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 text-brand hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-lg border border-muted-foreground/20 bg-background/60 p-4 shadow-sm transition-colors hover:border-muted-foreground/40"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{new Date(entry.date).toLocaleDateString()}</span>
                  {entry.contentReference.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.contentReference.map((reference) => (
                        <LabelBadge key={reference} text={reference} />
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  href={`/blog/${entry.id}`}
                  className="block transition-colors hover:text-foreground"
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    {entry.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.description}
                  </p>
                </Link>

                <div className="text-xs text-muted-foreground">
                  <span>{entry.headline}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
