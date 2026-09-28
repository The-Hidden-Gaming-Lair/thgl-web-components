import { Badge } from "@repo/ui/controls";
import type { ComponentProps } from "react";
import { STATUS_LABELS, type StatsStatus } from "@/lib/stats-types";

const VARIANT: Record<StatsStatus, ComponentProps<typeof Badge>["variant"]> = {
  supported: "default",
  in_progress: "secondary",
  watching: "outline",
  requested: "outline",
  pending: "outline",
  declined: "outline",
};

export function StatusBadge({ status }: { status: StatsStatus }) {
  return (
    <Badge variant={VARIANT[status]} className="whitespace-nowrap">
      {STATUS_LABELS[status]}
    </Badge>
  );
}
