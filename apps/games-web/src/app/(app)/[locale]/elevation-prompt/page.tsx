"use client";

import { useSearchParams } from "next/navigation";
import { Shield, Monitor, X, ShieldCheck } from "lucide-react";
import { Button } from "@repo/ui/controls";
import { postWebviewMessage } from "@repo/lib/thgl-app";
import { useT } from "@repo/ui/providers";
import { Suspense } from "react";
import Image from "next/image";

function ElevationPromptContent() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("gameId") || "unknown";
  const gameName = searchParams.get("gameName") || "this game";
  const t = useT();

  const handleRelaunch = () => {
    postWebviewMessage({ action: "relaunchAsAdmin", payload: {} });
  };

  const handleAlwaysRelaunch = async () => {
    // Save the setting to C++ (persistent) then relaunch
    await postWebviewMessage({
      action: "setAlwaysRunAsAdmin",
      payload: { always: true },
    });
    postWebviewMessage({ action: "relaunchAsAdmin", payload: {} });
  };

  const handleOpenDesktop = () => {
    postWebviewMessage({
      action: "closeElevationPrompt",
      payload: { gameId, openDesktop: true },
    });
  };

  const handleClose = () => {
    postWebviewMessage({
      action: "closeElevationPrompt",
      payload: { gameId, openDesktop: false },
    });
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header bar with branding */}
      <header
        className="px-3 h-[32px] shrink-0 border-b bg-linear-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 flex items-center"
        onMouseDown={() => {
          window.chrome?.webview?.postMessage("drag");
        }}
      >
        <div className="flex items-center gap-2 text-sm font-extrabold tracking-tight">
          <Image
            src="/games/thgl-app/cave128.png"
            alt="Logo"
            width={20}
            height={20}
            className="shrink-0"
          />
          TH.GL
        </div>
        <div className="flex-1" />
        <button
          className="h-full w-[32px] inline-flex items-center justify-center hover:bg-red-600 -mr-3"
          onClick={handleClose}
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Content. Scrolls when the window is shorter than the text - a long
          translation or a small display must never push the buttons out of
          view, so the actions below stay pinned. */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-3">
        {/* Icon and title */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-zinc-100 leading-tight">
              {t("elevation.title")}
            </h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {t("elevation.subtitle", { vars: { gameName } })}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 space-y-2 text-sm text-zinc-400 leading-relaxed">
          <p>{t("elevation.description")}</p>
          <p className="text-zinc-500 text-xs">{t("elevation.hint")}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="shrink-0 px-5 pb-5 pt-1 space-y-2">
        <Button
          onClick={handleRelaunch}
          className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
        >
          <ShieldCheck className="w-4 h-4 mr-2" />
          {t("elevation.relaunch")}
        </Button>

        <Button
          onClick={handleAlwaysRelaunch}
          variant="outline"
          className="w-full h-9 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 text-zinc-300"
        >
          <Shield className="w-4 h-4 mr-2 text-zinc-500" />
          {t("elevation.alwaysRelaunch")}
        </Button>

        <div className="flex gap-2 pt-1">
          <Button
            onClick={handleOpenDesktop}
            variant="ghost"
            className="flex-1 h-8 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 text-xs"
          >
            <Monitor className="w-3.5 h-3.5 mr-1.5" />
            {t("elevation.desktopMode")}
          </Button>

          <Button
            onClick={handleClose}
            variant="ghost"
            className="flex-1 h-8 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 text-xs"
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            {t("elevation.closeOverlay")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ElevationPromptPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-zinc-950">
          <div className="animate-pulse text-zinc-500">Loading...</div>
        </div>
      }
    >
      <ElevationPromptContent />
    </Suspense>
  );
}
