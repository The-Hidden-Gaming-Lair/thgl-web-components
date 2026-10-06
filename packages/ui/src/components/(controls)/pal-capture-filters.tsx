"use client";
import { useMemo } from "react";
import {
  normalizePalCaptureCounts,
  PAL_CAPTURE_BONUS_MAX,
  useSettingsStore,
} from "@repo/lib";
import { useShallow } from "zustand/react/shallow";
import { useT } from "../(providers)";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

/**
 * Palworld catch bonus (inbox #112): the game pays bonus EXP for the first 5
 * catches of every species. With the counts the Companion App reads, Pal markers
 * get an "x/5" badge, and this filter hides the species already caught 5 times.
 */
export function PalCaptureFilters() {
  const t = useT();
  const {
    palCaptureBadges,
    palCaptureOnlyIncomplete,
    palCaptureCounts,
    setPalCaptureBadges,
    setPalCaptureOnlyIncomplete,
  } = useSettingsStore(
    useShallow((state) => ({
      palCaptureBadges: state.palCaptureBadges,
      palCaptureOnlyIncomplete: state.palCaptureOnlyIncomplete,
      palCaptureCounts: state.palCaptureCounts,
      setPalCaptureBadges: state.setPalCaptureBadges,
      setPalCaptureOnlyIncomplete: state.setPalCaptureOnlyIncomplete,
    })),
  );
  const completed = useMemo(() => {
    const counts = normalizePalCaptureCounts(palCaptureCounts);
    if (!counts) return null;
    let done = 0;
    for (const count of counts.values()) {
      if (count >= PAL_CAPTURE_BONUS_MAX) done++;
    }
    return done;
  }, [palCaptureCounts]);

  return (
    <div className="flex flex-col gap-1 px-2 py-1.5 border-b border-border/40">
      <span className="font-semibold">
        {t("catchBonus.title", { fallback: "Catch bonus" })}
      </span>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="pal-capture-only-incomplete" className="text-xs">
          {t("catchBonus.onlyIncomplete", {
            fallback: "Only Pals caught fewer than 5 times",
          })}
        </Label>
        <Switch
          id="pal-capture-only-incomplete"
          checked={palCaptureOnlyIncomplete}
          onCheckedChange={setPalCaptureOnlyIncomplete}
          disabled={completed === null}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="pal-capture-badges" className="text-xs">
          {t("catchBonus.badges", {
            fallback: "Show catches on Pal icons (x/5)",
          })}
        </Label>
        <Switch
          id="pal-capture-badges"
          checked={palCaptureBadges}
          onCheckedChange={setPalCaptureBadges}
          disabled={completed === null}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {completed === null
          ? t("catchBonus.needsApp", {
              fallback:
                "Play Palworld with the Companion App running once, and it reads how often you caught each Pal.",
            })
          : t("catchBonus.summary", {
              fallback:
                "Pals caught 5 times or more (last game session): {{count}}",
              vars: { count: String(completed) },
            })}
      </p>
    </div>
  );
}
