import { Card, CardContent } from "@repo/ui/controls";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PartnerApp } from "@repo/lib";

export function PartnerCard({ app }: { app: PartnerApp }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <h3 className="font-semibold">{app.title}</h3>
        <p className="text-sm text-muted-foreground">{app.description}</p>
        <Link
          className="inline-flex items-center gap-1 font-bold text-sm"
          href={app.web}
          target="_blank"
        >
          <span className="max-w-64 truncate">Visit Website</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
