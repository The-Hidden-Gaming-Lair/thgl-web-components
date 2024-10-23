import { ContentLayout } from "@repo/ui/ads";
import { ExternalAnchor, HeaderOffset } from "@repo/ui/header";
import dynamic from "next/dynamic";
import { type SimpleSpawn } from "@repo/ui/interactive-map";
import { DataTable } from "@repo/ui/data";
import { ExternalLink } from "lucide-react";
import { type Metadata } from "next";
import tiles from "../../../coordinates/tiles.json" assert { type: "json" };
import { columns } from "./columns";
import MarketSelect from "@/components/market-select";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: "Pax Dei Market Map – The Hidden Gaming Lair",
  description:
    "Explore Pax Dei' Market Places for Trading. Each market place on this map links directly to the Pax Dei Market Discord server.",
};

const MarketMapDynamic = dynamic(
  () => import("@/components/market-map-dynamic"),
  {
    ssr: false,
    loading: () => <p className="!h-[300px] md:!h-[450px]">Loading...</p>,
  },
);

export type MarketData = {
  id: string;
  filter: string;
  name: string;
  description: string;
  color: string;
  icon: {
    name: string;
    url: string;
  };
  radius: number;
  p: number[];
  mapName: string;
  channel: string;
  timestamp: string;
}[];

async function fetchMarketData(shard: string): Promise<MarketData> {
  const response = await fetch(`https://paxdei.trade/api/location/${shard}`, {
    cache: "force-cache",
    next: {
      revalidate: 3600,
    },
  });
  const data = (await response.json()) as MarketData;
  return data;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export default async function Market(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const mapName = (searchParams.mapName as string) || Object.keys(tiles)[0];
  const shard = (searchParams.shard as string) || "Cernunnos";

  const marketData = shard ? await fetchMarketData(shard) : [];
  const mapMarketData = marketData.filter(
    (market) => market.mapName === mapName,
  );
  const spawns = mapMarketData.map<SimpleSpawn>((market) => ({
    id: market.id,
    name: market.name,
    description: `<p>${market.description}</p><a href="${market.channel}" target="_blank">[Market Channel]</a><p class="italic">Last Trade: ${new Date(market.timestamp).toLocaleDateString()}</p>`,
    color: market.color,
    icon: market.icon.url,
    radius: market.radius,
    p: market.p as [number, number],
  }));
  return (
    <HeaderOffset full>
      <ContentLayout
        id="pax-dei"
        header={
          <>
            <h2 className="text-2xl">Pax Dei Market Place</h2>
            <p className="text-sm">
              Each market place on this map links directly to the Pax Dei Market
              Discord server. Join the community at{" "}
              <ExternalAnchor
                href="https://paxdei.trade/discord"
                className="underline inline-flex gap-1 hover:text-primary transition-colors"
              >
                paxdei.trade/discord <ExternalLink className="w-3 h-3" />
              </ExternalAnchor>{" "}
              to connect with fellow traders.
            </p>
          </>
        }
        content={
          <>
            <MarketSelect mapName={mapName} shard={shard} />
            <MarketMapDynamic mapName={mapName} spawns={spawns} />
          </>
        }
        more={
          <DataTable
            columns={columns}
            data={mapMarketData}
            filterColumn="name"
          />
        }
      />
    </HeaderOffset>
  );
}
