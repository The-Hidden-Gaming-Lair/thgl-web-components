"use client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/controls";
import { useT } from "@repo/ui/providers";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import tiles from "../coordinates/tiles.json" assert { type: "json" };

const shards: string[] = [
  "Prometheus",
  "Freyja",
  "Selene",
  "Cernunnos",
  "Danu",
  "Tyr",
  "Hecate",
  "Fenrir",
  "Dagda",
  "Demeter",
  "Morana",
].sort();

export default function MarketSelect({
  mapName,
  shard,
}: {
  mapName: string;
  shard: string;
}) {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  return (
    <div className="flex gap-2 justify-center">
      <Select
        value={shard}
        onValueChange={(value) => {
          router.push(`${pathname}?${createQueryString("shard", value)}`);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select your shard" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Shards</SelectLabel>
            {shards.map((newShard) => (
              <SelectItem key={newShard} value={newShard}>
                {newShard}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={mapName}
        onValueChange={(value) => {
          router.push(`${pathname}?${createQueryString("mapName", value)}`);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select your map" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Maps</SelectLabel>
            {Object.keys(tiles)
              .filter((mapName) => mapName !== "gallia_pve_01")
              .map((tileMapName) => (
                <SelectItem key={tileMapName} value={tileMapName}>
                  {t(tileMapName)}
                </SelectItem>
              ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
