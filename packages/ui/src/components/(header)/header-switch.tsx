import type { ReactNode } from "react";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { cn } from "@repo/lib";

export function HeaderSwitch({
  label,
  checked,
  onChange,
  disabled,
  className,
  labelClassName,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <Label
      className={cn(
        "flex items-center gap-2 hover:text-primary transition-colors cursor-pointer",
        disabled ? "cursor-not-allowed opacity-50" : "",
        className,
      )}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        onMouseDown={(e) => e.stopPropagation()}
      />
      <span className={labelClassName}>{label}</span>
    </Label>
  );
}
