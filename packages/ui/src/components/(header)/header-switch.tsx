import type { ReactNode } from "react";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

export function HeaderSwitch({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Label className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
      {label}
    </Label>
  );
}
