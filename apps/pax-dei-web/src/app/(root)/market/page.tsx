import { ContentLayout } from "@repo/ui/ads";
import { HeaderOffset } from "@repo/ui/header";
import dynamic from "next/dynamic";
import { type SimpleSpawn } from "@repo/ui/interactive-map";
import { DataTable } from "@repo/ui/data";
import tiles from "../../../coordinates/tiles.json" assert { type: "json" };
import { columns } from "./columns";
import MarketSelect from "@/components/market-select";

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
}[];

async function fetchMarketData(shard: string): Promise<MarketData> {
  const response = await fetch(`https://paxdei.trade/api/location/${shard}`);
  const data = (await response.json()) as MarketData;
  return data;
}

export default async function Market({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const mapName = (searchParams.mapName as string) || Object.keys(tiles)[0];
  const shard = searchParams.shard as string;

  const marketData = shard ? await fetchMarketData(shard) : [];
  const mapMarketData = marketData.filter(
    (market) => market.mapName === mapName,
  );
  const spawns = mapMarketData.map<SimpleSpawn>((market) => ({
    id: market.id,
    name: market.name,
    description: market.description,
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
            <p className="text-sm">TBA</p>
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
