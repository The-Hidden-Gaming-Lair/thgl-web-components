"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { ChangeEvent } from "react";
import { faqEntries, allLabels, type FAQLabel } from "@/lib/faq-entries";
import { FaqLabelBadge } from "@/components/faq-label-badge";

export function FAQList() {
  const [selectedLabels, setSelectedLabels] = useState<FAQLabel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return faqEntries.filter((entry) => {
      const matchesLabels =
        selectedLabels.length === 0 ||
        entry.labels.some((label) => selectedLabels.includes(label));

      if (!matchesLabels) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        entry.headline.toLowerCase().includes(normalizedQuery) ||
        entry.question.toLowerCase().includes(normalizedQuery) ||
        entry.answer.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [searchQuery, selectedLabels]);

  const toggleLabel = (label: FAQLabel) => {
    setSelectedLabels((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label],
    );
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const clearFilters = () => {
    setSelectedLabels([]);
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedLabels.length > 0 || searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by headline or question"
            aria-label="Search frequent questions"
            className="w-full rounded-md border border-muted-foreground/30 bg-background px-3 py-2 text-sm shadow-sm outline-none ring-brand/20 focus:border-brand focus:ring-2"
          />
        </div>

        {allLabels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allLabels.map((label) => {
              const isSelected = selectedLabels.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleLabel(label)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-brand/60 bg-brand/10 text-brand"
                      : "border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                  }`}
                >
                  <FaqLabelBadge
                    label={label}
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
              Showing {filteredEntries.length} of {faqEntries.length} questions
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
          <p>No questions match the current filters yet.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 text-brand hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEntries.map((faq) => (
            <div
              key={faq.id}
              className="rounded-lg border border-muted-foreground/20 bg-background/60 p-4 shadow-sm transition-colors hover:border-muted-foreground/40"
            >
              <div className="space-y-3">
                <Link
                  href={`/faq/${faq.id}`}
                  className="block transition-colors hover:text-foreground"
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    {faq.headline}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {faq.question}
                  </p>
                </Link>

                <div className="flex flex-wrap gap-2">
                  {faq.labels.map((label) => (
                    <FaqLabelBadge key={label} label={label} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
