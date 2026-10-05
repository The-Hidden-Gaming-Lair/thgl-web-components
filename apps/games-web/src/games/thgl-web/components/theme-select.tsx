"use client";

import { Palette } from "lucide-react";
import { setTheme, useTheme, type Theme } from "@repo/lib";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@repo/ui/controls";

/**
 * Theme picker for www, which has no Settings dialog. Same options and the
 * same shared .th.gl cookie as Settings > Accessibility > Theme on the game
 * sites, so a choice made here follows the visitor everywhere.
 */
export function ThemeSelect() {
  const theme = useTheme();

  return (
    <Select value={theme} onValueChange={(value) => setTheme(value as Theme)}>
      <SelectTrigger
        id="theme"
        aria-label="Theme"
        title="Theme"
        className="h-9 w-9 shrink-0 justify-center p-0 [&>svg:last-child]:hidden"
      >
        <Palette className="h-4 w-4" />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="black">Black (OLED)</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
  );
}
