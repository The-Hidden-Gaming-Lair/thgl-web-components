const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const full = new Intl.NumberFormat("en-US");

/** 12.3K style for tables/tiles; exact below 10,000. */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  return value < 10_000 ? full.format(value) : compact.format(value);
}

export function formatExact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  return full.format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatDate(unixSeconds: number | null | undefined): string {
  if (!unixSeconds) return "–";
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

/** "3 days ago" — rendered server-side, so it is relative to the render time. */
export function formatAgo(unixSeconds: number | null | undefined): string {
  if (!unixSeconds) return "–";
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  const days = Math.floor(diff / 86400);
  if (days < 60) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(unixSeconds);
}

/** Positive-review share, e.g. 94.6. */
export function reviewScore(
  reviews: number | null,
  positive: number | null,
): number | null {
  if (!reviews || positive === null) return null;
  return Math.round((positive / reviews) * 1000) / 10;
}
