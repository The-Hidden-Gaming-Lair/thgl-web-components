"use client";
import {
  cn,
  LIVE_MODE_VALUES,
  type LiveMode,
  isPreviewFeatureEnabled,
  PREVIEW_LIVE_MODES,
  useAccountStore,
  useEffectiveLiveMode,
  useSettingsStore,
} from "@repo/lib";
import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useT } from "../(providers)";
import { PreviewBadge, showPreviewUpsell } from "./preview-badge";

const MODE_FALLBACK_LABEL: Record<LiveMode, string> = {
  static: "Predicted",
  combined: "Combined",
  live: "Live",
};

const ELITE_LOCK_TEXT = "Elite supporter feature";

const MODE_FALLBACK_DESC: Record<LiveMode, string> = {
  static: "Show predicted spawn locations only.",
  combined: "Show predicted spawns faded, plus live spawns in full color.",
  live: "Show only live spawns.",
};

export function LiveModeControl({
  disabled,
  size = "default",
  className,
}: {
  disabled?: boolean;
  size?: "default" | "sm";
  className?: string;
}) {
  // Effective mode powers the active highlight so a stored 'combined' on a
  // non-Elite account shows 'Live' selected — matching what the renderer
  // is actually doing via the same downgrade.
  const effectiveLiveMode = useEffectiveLiveMode();
  const setLiveMode = useSettingsStore((state) => state.setLiveMode);
  const hasPreviewAccess = useAccountStore(
    (state) => state.perks.previewReleaseAccess,
  );
  const t = useT();

  const buttonPadding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-0.5";

  return (
    <div
      className={cn(
        "flex rounded-md overflow-hidden border border-gray-600",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
      role="radiogroup"
      aria-label={t("liveMode.label") || "Live mode"}
    >
      {LIVE_MODE_VALUES.map((mode, idx) => {
        const isPreview = PREVIEW_LIVE_MODES.has(mode);
        const locked = !isPreviewFeatureEnabled(
          `live-mode:${mode}`,
          hasPreviewAccess,
        );
        const active = !locked && effectiveLiveMode === mode;
        const label = t(`liveMode.${mode}`) || MODE_FALLBACK_LABEL[mode];
        const isMiddle = idx > 0 && idx < LIVE_MODE_VALUES.length - 1;
        return (
          <Tooltip key={mode} delayDuration={300} disableHoverableContent>
            <TooltipTrigger asChild>
              <button
                type="button"
                role="radio"
                aria-checked={active}
                aria-disabled={locked}
                onClick={() => {
                  if (locked) {
                    showPreviewUpsell(`live-mode:${mode}`);
                    return;
                  }
                  setLiveMode(mode);
                }}
                disabled={disabled}
                onMouseDown={(e) => e.stopPropagation()}
                className={cn(
                  "text-xs transition-colors flex items-center gap-1",
                  buttonPadding,
                  isMiddle && "border-x border-gray-600",
                  locked
                    ? "bg-gray-900 text-gray-500 cursor-not-allowed"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300",
                )}
              >
                {locked && (
                  <Lock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                )}
                {label}
                {isPreview && !locked && <PreviewBadge className="ml-0.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px]">
              <div className="font-semibold text-xs flex items-center gap-1.5">
                {locked && <Lock className="h-3 w-3" aria-hidden="true" />}
                {label}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {t(`liveMode.${mode}.desc`) || MODE_FALLBACK_DESC[mode]}
              </div>
              {locked && (
                <div className="text-[11px] text-primary mt-1">
                  {t("liveMode.eliteOnly") || ELITE_LOCK_TEXT}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
