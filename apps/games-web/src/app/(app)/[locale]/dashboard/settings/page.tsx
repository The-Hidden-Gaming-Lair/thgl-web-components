"use client";

import {
  Settings,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Shield,
  Globe,
} from "lucide-react";
import {
  ScrollArea,
  Label,
  Switch,
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/controls";
import {
  addScheduledTask,
  removeScheduledTask,
  openDevToolsForUrl,
  useLiveState,
  useTHGLAppState,
  setGpuFlag,
  setAlwaysRunAsAdmin as setAlwaysRunAsAdminApi,
  relaunchAsAdmin,
  relaunchNormal,
  setCloseAction as setCloseActionApi,
  getIsTaskInstalled,
  GpuFlag,
  CloseAction,
} from "@repo/lib/thgl-app";
import { localizePath } from "@repo/lib";
import { useLocale, useT } from "@repo/ui/providers";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const LOCALE_OPTIONS: { value: string; label: string }[] = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
  { value: "es-MX", label: "Español (México)" },
  { value: "fr", label: "Français" },
  { value: "it", label: "Italiano" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "pl", label: "Polski" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "ru", label: "Русский" },
  { value: "th", label: "ไทย" },
  { value: "tr", label: "Türkçe" },
  { value: "uk", label: "Українська" },
  { value: "zh-CN", label: "简体中文" },
  { value: "zh-TW", label: "繁體中文" },
];

const GPU_FLAG_KEYS: Record<GpuFlag, { label: string; desc: string }> = {
  none: { label: "settings.gpu.default", desc: "settings.gpu.defaultDesc" },
  "disable-direct-composition-video": {
    label: "settings.gpu.disableVideo",
    desc: "settings.gpu.disableVideoDesc",
  },
  "disable-gpu-compositing": {
    label: "settings.gpu.disableCompositing",
    desc: "settings.gpu.disableCompositingDesc",
  },
  "disable-gpu": {
    label: "settings.gpu.software",
    desc: "settings.gpu.softwareDesc",
  },
};

const CLOSE_ACTION_KEYS: Record<CloseAction, { label: string; desc: string }> =
  {
    ask: {
      label: "settings.closeAction.ask",
      desc: "settings.closeAction.askDesc",
    },
    closeWindow: {
      label: "settings.closeAction.closeWindow",
      desc: "settings.closeAction.closeWindowDesc",
    },
    exit: {
      label: "settings.closeAction.exit",
      desc: "settings.closeAction.exitDesc",
    },
  };

const GPU_FLAGS: GpuFlag[] = [
  "none",
  "disable-direct-composition-video",
  "disable-gpu-compositing",
  "disable-gpu",
];
const CLOSE_ACTIONS: CloseAction[] = ["ask", "closeWindow", "exit"];

export default function SettingsPage() {
  const [showDevTools, setShowDevTools] = useState(false);
  const [initialGpuFlag, setInitialGpuFlag] = useState<GpuFlag | null>(null);
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const openDashboardOnStart = useTHGLAppState(
    (state) => state.openDashboardOnStart,
  );
  const setOpenDashboardOnStart = useTHGLAppState(
    (state) => state.setOpenDashboardOnStart,
  );
  const isTaskInstalled = useLiveState((state) => state.isTaskInstalled);
  const setIsTaskInstalled = useLiveState((state) => state.setIsTaskInstalled);
  const version = useLiveState((state) => state.version);
  const connectedClients = useLiveState((state) => state.connectedClients);
  const gpuFlag = useLiveState((state) => state.gpuFlag);
  const setGpuFlagState = useLiveState((state) => state.setGpuFlag);
  const isRunningAsAdmin = useLiveState((state) => state.isRunningAsAdmin);
  const alwaysRunAsAdmin = useLiveState((state) => state.alwaysRunAsAdmin);
  const compatRunAsAdminFlag = useLiveState(
    (state) => state.compatRunAsAdminFlag,
  );
  // Set while a relaunch request is in flight; the app closes this window on
  // success, and an error response (refused relaunch) re-enables the button.
  const [relaunching, setRelaunching] = useState(false);
  const requestRelaunch = (relaunch: () => Promise<unknown>) => {
    setRelaunching(true);
    relaunch().catch((error) => {
      console.error(error);
      setRelaunching(false);
    });
  };
  const setAlwaysRunAsAdmin = useLiveState(
    (state) => state.setAlwaysRunAsAdmin,
  );
  const closeAction = useLiveState((state) => state.closeAction);
  const setCloseActionState = useLiveState((state) => state.setCloseAction);

  // Fetch isTaskInstalled when settings page mounts (not in initial state to avoid blocking)
  useEffect(() => {
    if (isTaskInstalled === null) {
      getIsTaskInstalled()
        .then((res) => setIsTaskInstalled(res.data))
        .catch(console.error);
    }
  }, []);

  // Track the initial GPU flag value when component mounts
  if (initialGpuFlag === null && gpuFlag) {
    setInitialGpuFlag(gpuFlag);
  }

  const gpuFlagChanged = initialGpuFlag !== null && gpuFlag !== initialGpuFlag;

  const handleCloseActionChange = (value: CloseAction) => {
    setCloseActionApi(value)
      .then(() => {
        setCloseActionState(value);
      })
      .catch(console.error);
  };

  const handleGpuFlagChange = (value: GpuFlag) => {
    setGpuFlag(value)
      .then(() => {
        setGpuFlagState(value);
      })
      .catch(console.error);
  };

  const controllerClient = connectedClients?.find(
    (client) => client.role === "controller",
  );
  const dashboardClient = connectedClients?.find(
    (client) => client.role === "dashboard",
  );

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6 pb-20 space-y-6 max-w-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t("settings.title")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("settings.description")}
          </p>
        </div>

        {/* Startup Preferences */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold">{t("settings.startup")}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="open-app-on-start"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("settings.launchOnStartup")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings.launchOnStartupDesc")}
                </p>
              </div>
              <Switch
                id="open-app-on-start"
                checked={!!isTaskInstalled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    addScheduledTask();
                  } else {
                    removeScheduledTask();
                  }
                  setIsTaskInstalled(checked);
                }}
              />
            </div>
            <div className="border-t" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="open-dashboard-on-start"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("settings.openDashboard")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings.openDashboardDesc")}
                </p>
              </div>
              <Switch
                id="open-dashboard-on-start"
                checked={openDashboardOnStart}
                onCheckedChange={setOpenDashboardOnStart}
              />
            </div>
            <div className="border-t" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="always-run-as-admin"
                    className="text-sm font-normal cursor-pointer"
                  >
                    {t("settings.alwaysAdmin")}
                  </Label>
                  {isRunningAsAdmin && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-500 border border-amber-500/20">
                      <Shield className="w-3 h-3" />
                      {t("settings.alwaysAdminActive")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("settings.alwaysAdminDesc")}
                </p>
              </div>
              <Switch
                id="always-run-as-admin"
                checked={alwaysRunAsAdmin}
                onCheckedChange={(checked) => {
                  // Update C++ setting (persistent)
                  setAlwaysRunAsAdminApi(checked)
                    .then(() => setAlwaysRunAsAdmin(checked))
                    .catch(console.error);
                }}
              />
            </div>
            {compatRunAsAdminFlag !== "none" && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {t(
                    compatRunAsAdminFlag === "removed"
                      ? "settings.compatFlagRemoved"
                      : "settings.compatFlagPresent",
                  )}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {t("settings.relaunchDesc")}
              </p>
              {isRunningAsAdmin ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* span keeps the tooltip working while the button is disabled */}
                    <span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={alwaysRunAsAdmin || relaunching}
                        onClick={() => requestRelaunch(relaunchNormal)}
                      >
                        {t("settings.relaunchNormal")}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {alwaysRunAsAdmin && (
                    <TooltipContent>
                      {t("settings.relaunchNormalBlocked")}
                    </TooltipContent>
                  )}
                </Tooltip>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={relaunching}
                  onClick={() => requestRelaunch(relaunchAsAdmin)}
                >
                  <Shield className="w-3.5 h-3.5 mr-1.5" />
                  {t("settings.relaunchAsAdmin")}
                </Button>
              )}
            </div>
            <div className="border-t" />
            <div className="space-y-2">
              <Label htmlFor="close-action" className="text-sm font-normal">
                {t("settings.closeAction")}
              </Label>
              <Select
                value={closeAction}
                onValueChange={(value) =>
                  handleCloseActionChange(value as CloseAction)
                }
              >
                <SelectTrigger id="close-action" className="w-full">
                  <SelectValue
                    placeholder={t("settings.closeActionPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {CLOSE_ACTIONS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(CLOSE_ACTION_KEYS[value].label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {closeAction && t(CLOSE_ACTION_KEYS[closeAction]?.desc)}
              </p>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold">{t("settings.language")}</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="language" className="text-sm font-normal">
                {t("settings.displayLanguage")}
              </Label>
            </div>
            <Select
              value={locale}
              onValueChange={(value) => {
                // Strip current locale prefix from pathname, then localize with new locale
                const segments = pathname.split("/").filter(Boolean);
                const currentIsLocale = LOCALE_OPTIONS.some(
                  (o) => o.value === segments[0],
                );
                const basePath = currentIsLocale
                  ? "/" + segments.slice(1).join("/")
                  : pathname;
                const newPath = localizePath(basePath, value);
                router.push(newPath);
              }}
            >
              <SelectTrigger id="language" className="w-full">
                <SelectValue placeholder={t("settings.languagePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {LOCALE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("settings.languageDesc")}
            </p>
          </div>
        </div>

        {/* Info Note */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            {t("settings.infoNote")}
          </p>
        </div>

        {/* GPU / Display Settings */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold">{t("settings.display")}</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="gpu-flag" className="text-sm font-normal">
                {t("settings.gpuAcceleration")}
              </Label>
              <Select
                value={gpuFlag}
                onValueChange={(value) => handleGpuFlagChange(value as GpuFlag)}
              >
                <SelectTrigger id="gpu-flag" className="w-full">
                  <SelectValue placeholder={t("settings.gpuPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {GPU_FLAGS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(GPU_FLAG_KEYS[value].label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {gpuFlag && t(GPU_FLAG_KEYS[gpuFlag]?.desc)}
              </p>
            </div>
            {gpuFlagChanged && (
              <div className="flex items-center justify-between gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-500">
                    {t("settings.restartRequired")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500"
                  onClick={() =>
                    window.chrome.webview.postMessage("restartApp")
                  }
                >
                  {t("settings.restart")}
                </Button>
              </div>
            )}
            {gpuFlag !== "none" && (
              <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-500">
                  {t("settings.gpuWarning")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Developer Tools (Collapsible) */}
        <div className="rounded-lg border bg-card">
          <Button
            variant="ghost"
            className="w-full justify-between p-4 h-auto"
            onClick={() => setShowDevTools(!showDevTools)}
          >
            <span className="text-sm font-semibold">
              {t("settings.devTools")}
            </span>
            {showDevTools ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {showDevTools && (
            <div className="px-4 pb-4 space-y-3 text-sm">
              <div className="border-t" />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("settings.version")}
                </span>
                <Tooltip>
                  <TooltipTrigger className="hover:text-foreground">
                    {version?.buildVersion ?? t("settings.versionUnknown")}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Version:{" "}
                      {version?.buildVersion ?? t("settings.versionUnknown")}
                    </p>
                    <p>Date: {version?.buildDate}</p>
                    <p>Time: {version?.buildTime}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("settings.inspect")}
                  </span>
                  <div className="space-x-2">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() =>
                        openDevToolsForUrl(
                          controllerClient?.href || "/controller",
                        )
                      }
                    >
                      {t("settings.inspectController")}
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() =>
                        openDevToolsForUrl(
                          dashboardClient?.href || "/dashboard",
                        )
                      }
                    >
                      {t("settings.inspectDashboard")}
                    </Button>
                  </div>
                </div>
                {/* Game windows (overlays, desktop) */}
                {connectedClients?.filter((c) => c.role === "client").length ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t("settings.gameWindows")}
                    </span>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 justify-end">
                      {connectedClients
                        ?.filter((c) => c.role === "client")
                        .map((client) => {
                          // Extract a friendly name from the URL
                          // e.g., /apps/palia → "palia", /apps/palia/overlay → "palia (overlay)"
                          let name = "window";
                          try {
                            const url = new URL(client.href);
                            const appsIdx = url.pathname.indexOf("/apps/");
                            if (appsIdx !== -1) {
                              const appParts = url.pathname
                                .substring(appsIdx + 6)
                                .split("/")
                                .filter(Boolean);
                              name = appParts[0] || "window";
                              if (appParts[1]) {
                                name += ` (${appParts[1]})`;
                              }
                            }
                          } catch {
                            // Invalid URL, keep default name
                          }
                          return (
                            <Button
                              key={client.id}
                              variant="link"
                              size="sm"
                              className="h-auto p-0"
                              onClick={() => openDevToolsForUrl(client.href)}
                            >
                              {name}
                            </Button>
                          );
                        })}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
