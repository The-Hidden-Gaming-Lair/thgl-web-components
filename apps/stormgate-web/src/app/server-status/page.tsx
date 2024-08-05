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

async function fetchServers(): Promise<Servers> {
  try {
    const response = await fetch("https://api.hathora.dev/discovery/v1/ping", {
      next: {
        revalidate: 60 * 60,
      },
    });
    return (await response.json()) as Servers;
  } catch (error) {
    console.error("Failed to fetch servers", error);
    return [];
  }
}

export default async function ServerStatus() {
  const servers = (await fetchServers())
    .sort((a, b) => a.region.localeCompare(b.region))
    .map((server) => ({
      region: server.region,
      url: `http://${server.host}:${server.port}`,
    }));
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
      />
    </HeaderOffset>
  );
}
