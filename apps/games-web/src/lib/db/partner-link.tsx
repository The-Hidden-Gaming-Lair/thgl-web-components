import { ExternalLink } from "lucide-react";
import type { PartnerLink } from "@/lib/db/partner-links";

/**
 * A visible outbound link to a partner site's counterpart page.
 *
 * Deliberately a plain server-rendered anchor: it must be in the initial HTML so
 * crawlers see it, which is the whole point of the placement. `rel="noopener"`
 * without `noreferrer` so the partner's own analytics can attribute the referral.
 */
export function PartnerLinkRow({
  link,
  label,
}: {
  link: PartnerLink;
  /** Full sentence-case text, e.g. "Build guide on Prydwen". */
  label: string;
}) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-xs text-amber-300 hover:border-amber-700/70 hover:bg-slate-900 transition-colors"
    >
      {label}
      <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
    </a>
  );
}
