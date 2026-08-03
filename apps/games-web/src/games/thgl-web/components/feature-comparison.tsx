import Link from "next/link";
import { Check } from "lucide-react";

// Where a feature first becomes available. "free" = no account; "account" =
// free but needs sign-in; the rest are paid tiers. Tiers are cumulative, so a
// row also shows a check for every higher column.
type RowTier = "free" | "account" | "enthusiast" | "pro" | "elite";

const RANK: Record<RowTier, number> = {
  free: 0,
  account: 0,
  enthusiast: 1,
  pro: 2,
  elite: 3,
};

const COLUMNS: {
  key: RowTier;
  label: string;
  price: string;
  highlight?: boolean;
}[] = [
  { key: "free", label: "Free", price: "$0" },
  { key: "enthusiast", label: "Enthusiast", price: "$2/mo" },
  { key: "pro", label: "Pro", price: "$5/mo" },
  { key: "elite", label: "Elite", price: "$10/mo", highlight: true },
];

const ROWS: { feature: string; from: RowTier; note?: string }[] = [
  { feature: "Interactive maps, all filters & live tracking", from: "free" },
  {
    feature: "Peer Link — mirror the map to a phone or second screen",
    from: "free",
  },
  {
    feature: "Cloud-synced & shareable filters",
    from: "account",
    note: "Free — requires a sign-in",
  },
  {
    feature: "Comments on map markers",
    from: "account",
    note: "Free — requires a sign-in",
  },
  { feature: "Discord supporter role", from: "enthusiast" },
  { feature: "Ad-free across every TH.GL app", from: "pro" },
  {
    feature: "Early access to preview features",
    from: "elite",
    note: "New features land here first",
  },
];

export function FeatureComparison() {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">What You Get</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Feature
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-3 text-center align-bottom ${
                    col.highlight ? "bg-primary/5" : ""
                  }`}
                >
                  <div
                    className={`font-semibold ${col.highlight ? "text-primary" : ""}`}
                  >
                    {col.label}
                  </div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {col.price}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr
                key={row.feature}
                className="border-b border-border/50 last:border-0"
              >
                <td className="px-4 py-3 text-foreground">
                  {row.feature}
                  {row.note && (
                    <span className="block text-xs text-muted-foreground">
                      {row.note}
                    </span>
                  )}
                </td>
                {COLUMNS.map((col) => {
                  const included = RANK[col.key] >= RANK[row.from];
                  return (
                    <td
                      key={col.key}
                      className={`px-3 py-3 text-center ${
                        col.highlight ? "bg-primary/5" : ""
                      }`}
                    >
                      {included ? (
                        <Check
                          className="inline h-4 w-4 text-primary"
                          aria-label="Included"
                        />
                      ) : (
                        <span
                          className="text-muted-foreground/40"
                          aria-hidden="true"
                        >
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-muted-foreground">
        Each tier includes everything in the tiers before it. A few older apps
        (e.g. New World) also bundle game-specific premium options. The Discord
        supporter role needs a one-time link —{" "}
        <Link
          href="/faq/discord-supporter-role"
          className="text-primary underline"
        >
          how to activate it
        </Link>
        .
      </p>
    </div>
  );
}
