import { ExternalLink } from "lucide-react";
import { ExternalAnchor } from "./external-anchor";

export function ReleaseNotesLink({ href }: { href: string }): JSX.Element {
  return (
    <ExternalAnchor
      href={href}
      className="flex gap-1 hover:text-primary transition-colors"
    >
      <span>Release Notes</span>
      <ExternalLink className="w-3 h-3" />
    </ExternalAnchor>
  );
}
