"use client";
import {
  describeDriverHealth,
  isDriverHealthProblem,
  openInBrowser,
  repairDriverFromWebview,
  useLiveState,
} from "@repo/lib/thgl-app";
import { Loader2, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "../(providers)";
import { Button } from "../(controls)";

const FAQ_URL = "https://www.th.gl/faq/companion-driver-unavailable";

// Shown while the THGLApp -> BridgeHost -> kernel driver chain is broken. Without it the
// dashboard only says "Start the game to enable the overlay" even though the game is running,
// because game detection itself goes through the driver. State comes from the native
// `driverHealth` broadcast (Source/GameIntegration/driver_health.cpp); repairs run in the app.
export function DriverHealthWarning() {
  const t = useT();
  const health = useLiveState((state) => state.driverHealth);
  // Optimistic "repairing" until the app's next driverHealth broadcast (it flips `repairing`
  // true -> false and fills `lastRepair`), bounded so a lost message can't spin forever.
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setPending(false), 30000);
    return () => clearTimeout(timer);
  }, [pending]);
  useEffect(() => {
    if (health && !health.repairing) setPending(false);
  }, [health?.repairing, health?.updatedAt]);

  if (!health || !isDriverHealthProblem(health)) {
    return null;
  }

  const advice = describeDriverHealth(health);
  const repairing = pending || health.repairing;
  const blocked = health.blockedProcesses.join(", ");
  const lastFailed =
    !repairing && health.lastRepair && !health.lastRepair.includes(":ok");

  const runRepair = () => {
    if (!advice.repair || repairing) return;
    setPending(true);
    repairDriverFromWebview(advice.repair).catch(() => setPending(false));
  };

  return (
    <div className="flex flex-col gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-amber-200">
            {t(advice.titleKey)}
            {blocked && (
              <span className="ml-2 font-normal text-amber-100/80">
                {t("driver.banner.blocked", { vars: { game: blocked } })}
              </span>
            )}
          </p>
          <p className="text-amber-100/90">
            {t(advice.descriptionKey, {
              vars: {
                code: `0x${(health.code >>> 0).toString(16).toUpperCase()}`,
              },
            })}
          </p>
          {lastFailed && (
            <p className="text-xs text-amber-100/70">
              {t("driver.repair.lastResult", {
                vars: { result: health.lastRepair },
              })}
            </p>
          )}
          <p className="text-xs text-amber-100/70">
            {t("driver.sendSnapshot")}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-6">
        {advice.repair && advice.repairLabelKey && (
          <Button
            size="sm"
            variant="secondary"
            disabled={repairing}
            onClick={runRepair}
          >
            {repairing ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                {t("driver.repair.running")}
              </>
            ) : (
              t(advice.repairLabelKey)
            )}
          </Button>
        )}
        {advice.needsElevation && !repairing && (
          <span className="text-xs text-amber-100/70">
            {t("driver.repair.needsAdmin")}
          </span>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => openInBrowser(FAQ_URL)}
        >
          {t("driver.faq")}
        </Button>
      </div>
    </div>
  );
}
