"use client";
import {
  requestFromMain,
  useLiveState,
  usePersistentState,
} from "@repo/lib/thgl-app";
import { Separator } from "../ui/separator";
import {
  Button,
  Label,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../(controls)";
import { useAccountStore } from "@repo/lib";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle } from "lucide-react";

export function Status() {
  const openDashboardOnStart = usePersistentState(
    (state) => state.openDashboardOnStart,
  );
  const setOpenDashboardOnStart = usePersistentState(
    (state) => state.setOpenDashboardOnStart,
  );

  const account = useAccountStore();
  const runningGames = useLiveState((state) => state.runningGames);
  const version = useLiveState((state) => state.version);
  const isRunningAsAdmin = useLiveState((state) => state.isRunningAsAdmin);
  const isTaskInstalled = useLiveState((state) => state.isTaskInstalled);
  const setIsTaskInstalled = useLiveState((state) => state.setIsTaskInstalled);
  const connectedClients = useLiveState((state) => state.connectedClients);
  const controllerClient = connectedClients?.find(
    (client) => client.role === "controller",
  );
  const dashboardClient = connectedClients?.find(
    (client) => client.role === "dashboard",
  );

  return (
    <>
      {isRunningAsAdmin === false && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Running as standard user. Some features may not work.
          </AlertDescription>
        </Alert>
      )}
      <section className="rounded-lg border px-4 py-3">
        <div className="space-y-2">
          <h4 className="text-sm font-medium leading-none">Running Games</h4>
          <p className="text-sm text-muted-foreground">
            {runningGames?.map((game) => game.processName).join(", ") || "None"}
          </p>
          <h4 className="text-sm font-medium leading-none">Config</h4>
          <div className="text-sm text-muted-foreground flex items-center space-x-2">
            <Switch
              id="open-dashboard-on-start"
              checked={openDashboardOnStart}
              onCheckedChange={setOpenDashboardOnStart}
            />
            <Label htmlFor="open-dashboard-on-start">
              Open this window on start
            </Label>
          </div>
          <div className="text-sm text-muted-foreground flex items-center space-x-2">
            <Switch
              id="open-app-on-start"
              checked={!!isTaskInstalled}
              onCheckedChange={(checked) => {
                requestFromMain({
                  action: checked ? "addScheduledTask" : "removeScheduledTask",
                  payload: null,
                });
                setIsTaskInstalled(checked);
              }}
            />
            <Label htmlFor="open-app-on-start">
              Open the app on Windows startup
            </Label>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="flex h-5 items-center space-x-4 text-sm">
          <div className="text-sm truncate">
            Inspect:{" "}
            <Button
              className="px-0"
              variant="link"
              onClick={() =>
                requestFromMain({
                  action: "openDevTools",
                  payload: {
                    url: controllerClient?.href || "/controller",
                  },
                })
              }
            >
              controller
            </Button>
            {", "}
            <Button
              className="px-0"
              variant="link"
              onClick={() =>
                requestFromMain({
                  action: "openDevTools",
                  payload: {
                    url: dashboardClient?.href || "/dashboard",
                  },
                })
              }
            >
              dashboard
            </Button>
          </div>
          <Separator orientation="vertical" />
          <Tooltip>
            <TooltipTrigger className="truncate">
              Version: {version?.buildVersion ?? "Unknown"}
            </TooltipTrigger>
            <TooltipContent>
              <p>Version: {version?.buildVersion ?? "Unknown"}</p>
              <p>Date: {version?.buildDate}</p>
              <p>Time: {version?.buildTime}</p>
            </TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" />
          <div className="text-sm truncate">
            Account:{" "}
            <Button
              className="px-0"
              variant="link"
              onClick={() => account.setShowUserDialog(true)}
            >
              {account?.decryptedUserId ?? "Not signed in"}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
