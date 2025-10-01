import type { FAQLabel } from "@/lib/faq-entries";
import { cn } from "@/lib/utils";

const DEFAULT_BADGE_COLORS = [
  "bg-gray-500",
  "bg-purple-500",
  "bg-blue-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-teal-500",
  "bg-pink-500",
  "bg-indigo-500",
];

function getFallbackColor(text: string) {
  const normalized = text.toLowerCase();
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(index);
    hash |= 0; // Keep hash in 32-bit range
  }

  const paletteIndex = Math.abs(hash) % DEFAULT_BADGE_COLORS.length;
  return DEFAULT_BADGE_COLORS[paletteIndex];
}

export type LabelBadgeProps = {
  text: string;
  variant?: "default" | "minimal";
  className?: string;
  dotClassName?: string;
  dotColorClass?: string;
};

export function LabelBadge({
  text,
  variant = "default",
  className,
  dotClassName,
  dotColorClass,
}: LabelBadgeProps) {
  const variantClasses =
    variant === "default"
      ? "inline-flex items-center gap-2 rounded-full border border-muted-foreground/20 px-2 py-1 text-xs font-medium text-muted-foreground"
      : "inline-flex items-center gap-2 text-xs font-medium text-muted-foreground";

  return (
    <span className={cn(variantClasses, className)}>
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          dotColorClass ?? getFallbackColor(text),
          dotClassName,
        )}
      />
      <span>{text}</span>
    </span>
  );
}

export const FAQ_LABEL_COLORS: Record<FAQLabel, string> = {
  General: "bg-gray-500",
  Overwolf: "bg-purple-500",
  "Companion App": "bg-blue-500",
  "Dune: Awakening": "bg-orange-500",
  "Once Human": "bg-red-500",
  Palia: "bg-green-500",
  "New World": "bg-yellow-500",
  Linux: "bg-teal-500",
  Subscription: "bg-pink-500",
  Technical: "bg-indigo-500",
};

export type FaqLabelBadgeProps = {
  label: FAQLabel;
  variant?: "default" | "minimal";
  className?: string;
  dotClassName?: string;
};

export function FaqLabelBadge(props: FaqLabelBadgeProps) {
  const { label, variant, className, dotClassName } = props;

  return (
    <LabelBadge
      text={label}
      variant={variant}
      className={className}
      dotClassName={dotClassName}
      dotColorClass={FAQ_LABEL_COLORS[label]}
    />
  );
}

export function getLabelBadgeColorForText(text: string) {
  return getFallbackColor(text);
}
