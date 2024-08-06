import { url } from "node:inspector";
import { ContentLayout } from "@repo/ui/ads";
import { DataTable } from "@repo/ui/data";
import { HeaderOffset } from "@repo/ui/header";
import { type Metadata } from "next";
import { columns } from "./columns";

export const metadata: Metadata = {
  alternates: {
    canonical: "/server-status",
  },
  title: "Stormgate Server Status – The Hidden Gaming Lair",
  description: "Check the Stormgate server status and ping times.",
};

type Servers = {
  host: string;
  port: number;
  region: string;
}[];

interface GameInfo {
  name: string;
  platformVersion: string;
  backendMode: string;
  authenticateBackend: {
    host: string;
    port: number;
    protocol: string;
    scheme: string;
  };
  socialBackend: {
    host: string;
    port: number;
    protocol: string;
    webSocketProtocol: string;
  };
  gameBackend: {
    host: string;
    port: number;
    protocol: string;
    webSocketProtocol: string;
  };
  gameShardId: string;
}

async function fetchServers(): Promise<Servers> {
  try {
    const response = await fetch("https://api.hathora.dev/discovery/v1/ping", {
      next: {
        revalidate: 60 * 60,
      },
    });
    return (await response.json()) as Servers;
  } catch (error) {
    return [];
  }
}

async function fetchGameInfo(): Promise<GameInfo | null> {
  try {
    const response = await fetch(
      "https://game.ptr.pegasus.frostgiant.pragmaengine.com/v1/info",
      {
        next: {
          revalidate: 60 * 60,
        },
      },
    );
    return (await response.json()) as GameInfo;
  } catch (error) {
    return null;
  }
}

export default async function ServerStatus() {
  const servers = (await fetchServers())
    .sort((a, b) => a.region.localeCompare(b.region))
    .map((server) => ({
      region: server.region,
      url: `https://${server.host}:${server.port}`,
    }));
  const gameInfo = await fetchGameInfo();

  return (
    <HeaderOffset full>
      <ContentLayout
        id="stormgate"
        header={
          <>
            <h2 className="text-2xl">Server Status</h2>
            <p className="text-sm">
              Check the Stormgate server status and ping times. Press
              CTRL+ALT+SHIFT+F in-game to see the server status.
            </p>
          </>
        }
        content={
          <DataTable columns={columns} data={servers} filterColumn="region" />
        }
        more={
          <>
            <h2 className="text-2xl">Game Client Status</h2>
            <p className="text-sm">Check the Stormgate game client status.</p>
            <p className="text-sm">
              Platform Version: {gameInfo?.platformVersion ?? "Unknown"}
            </p>
            <iframe
              src="https://playstormgate.com/gameclient/status"
              title="Game Client Status"
              className="mx-auto"
            />
          </>
        }
      />
    </HeaderOffset>
  );
}
