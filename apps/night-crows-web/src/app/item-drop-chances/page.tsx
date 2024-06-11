import { type Dict } from "@repo/ui/providers";
import { HeaderOffset } from "@repo/ui/header";
import { DataTable } from "@repo/ui/data";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import zones from "the-hidden-gaming-lair/static/night-crows/coordinates/zones.json" assert { type: "json" };
import items from "the-hidden-gaming-lair/static/night-crows/coordinates/items.json" assert { type: "json" };
import _enDict from "the-hidden-gaming-lair/static/night-crows/dicts/en.json" assert { type: "json" };
import { columns } from "./columns";

const enDict = _enDict as Dict;

export const metadata: Metadata = {
  alternates: {
    canonical: "/item-drop-chances",
  },
  title: "Item Drop Chances – The Hidden Gaming Lair",
  description:
    "Discover the probabilities of item drops in Night Crows with this comprehensive data table. Explore average drop rates, item names, and corresponding zones for optimized gaming strategies. Uncover rare loot opportunities and conquer the realms with precision!",
};

type DropItems = {
  items: {
    average_rate: number;
    drops_count: number;
    grade: string;
    img: string;
    item_id: number;
    title: string;
  }[];
  total: number;
  zone: number;
}[];

async function fetchZoneDropItems(): Promise<DropItems> {
  try {
    const response = await fetch("http://168.119.74.85:8899/drop_items_jsx", {
      next: {
        revalidate: 60 * 60,
      },
    });
    return (await response.json()) as DropItems;
  } catch (error) {
    return [];
  }
}
export default async function Items(): Promise<JSX.Element> {
  const zoneDropItems = await fetchZoneDropItems();

  const dropItems = zoneDropItems
    .flatMap((zoneDrop) => {
      const zone = zones.find((zone) => zone.zoneId === zoneDrop.zone)!;
      return zoneDrop.items
        .map((dropItem) => {
          const item = items.find((item) => item.itemId === dropItem.item_id);
          if (!item) {
            console.error(`Item not found: ${dropItem.item_id}`);
            return null;
          }
          return {
            name: enDict[item.id],
            zone: enDict[zone.id],
            icon: item.icon,
            count: dropItem.drops_count,
            total: zoneDrop.total,
            averageRate: dropItem.average_rate,
          };
        })
        .filter(Boolean) as {
        name: string;
        zone: string;
        icon: string;
        count: number;
        total: number;
        averageRate: number;
      }[];
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <HeaderOffset full>
      <ContentLayout
        id="night-crows"
        header={
          <>
            <h2 className="text-2xl">Item Drop Chances</h2>
            <p className="text-sm">
              Explore detailed information including item names, average drop
              rates, and the corresponding zones where these items can be found.
            </p>
          </>
        }
        content={
          <DataTable columns={columns} data={dropItems} filterColumn="name" />
        }
      />
    </HeaderOffset>
  );
}
