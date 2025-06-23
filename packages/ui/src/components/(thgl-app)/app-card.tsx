"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button, Switch } from "../(controls)";
import {
  requestFromMain,
  useLiveState,
  usePersistentState,
} from "@repo/lib/thgl-app";
import { Game } from "@repo/lib";

export function AppCard({ game }: { game: Game }) {
  const disabledApps = usePersistentState((state) => state.disabledApps);
  const toggleDisabledApp = usePersistentState(
    (state) => state.toggleDisabledApp,
  );
  const connectedClients = useLiveState((state) => state.connectedClients);
  const isDisabled = disabledApps.includes(game.id);
  const companion = game.companion;
  if (!companion) {
    return null;
  }

  const appsOpenURLs = connectedClients
    ?.filter(
      (connectedClient) =>
        connectedClient.role === "client" &&
        connectedClient.href.startsWith(
          companion.baseURL.startsWith("http")
            ? companion.baseURL
            : location.origin + companion.baseURL,
        ),
    )
    .map((connectedClient) => connectedClient.href);

  return (
    <Card>
      <CardHeader className="flex-row space-x-2 items-center p-4">
        <Image src={game.logo} alt="" width={36} height={36} />
        <div className="flex-1 ">
          <CardTitle className="leading-normal">{game.title}</CardTitle>
          <CardDescription>
            {companion.games.map((game) => game.title).join(", ")}
          </CardDescription>
        </div>
        <Switch
          checked={!isDisabled}
          onCheckedChange={(checked) => {
            toggleDisabledApp(game.id);
            if (!checked && appsOpenURLs?.length) {
              requestFromMain({
                action: "closeWebViews",
                payload: {
                  urls: appsOpenURLs,
                },
              });
            }
          }}
        />
      </CardHeader>
      <CardContent className="flex justify-between p-4">
        <div className="text-sm">
          Inspect:{" "}
          {appsOpenURLs?.length === 0 && (
            <span className="text-muted-foreground">Not launched</span>
          )}
          {appsOpenURLs?.map((url, index) => (
            <span key={url}>
              <Button
                className="h-auto p-0"
                variant="link"
                onClick={() =>
                  requestFromMain({
                    action: "openDevTools",
                    payload: {
                      url: url,
                    },
                  })
                }
              >
                {url.split("/").pop()?.toLowerCase()}
              </Button>
              {index < appsOpenURLs.length - 1 && ", "}
            </span>
          ))}
        </div>
        <Button
          disabled={isDisabled}
          size="xs"
          variant="secondary"
          onClick={() =>
            requestFromMain({
              action: "openController",
              payload: {
                url: companion.controllerURL,
              },
            })
          }
        >
          Launch
        </Button>
      </CardContent>
    </Card>
  );
}
