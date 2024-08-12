"use client";
import {
  ArrowUpDown,
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/controls";
import Image from "next/image";
import { type ColumnDef } from "@repo/ui/data";
import { type Dict } from "@repo/ui/providers";
import _enDict from "../../dicts/en.json" assert { type: "json" };
import database from "../../data/database.json" assert { type: "json" };
import groups from "../../data/groups.json" assert { type: "json" };

const enDict = _enDict as Dict;
const props = Object.keys(database[0].items[0].props).filter(
  (k) => k !== "speed" && k !== "weapons" && k !== "abilities",
);

export interface Item {
  icon: string;
  [key: string]: string | number;
}

const propsColumns: ColumnDef<Item>[] = props.map((prop) => ({
  accessorKey: prop,
  header: ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => {
          column.toggleSorting(column.getIsSorted() === "asc");
        }}
      >
        {enDict[prop]}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    );
  },
}));

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: "groupId",
    header: "",
    cell: ({ row }) => {
      const groupId = row.getValue<string>("groupId");
      const group = groups.find((group) => group.id === groupId)!;

      return (
        <Image
          src={`/icons/${group.icon}`}
          width="50"
          height="50"
          alt=""
          className="h-[50px] w-[50px] max-w-fit"
        />
      );
    },
  },
  {
    accessorKey: "icon",
    header: "",
    cell: ({ row }) => {
      const icon = row.getValue<string>("icon");
      return (
        <Image
          src={`/icons/${icon}`}
          width="50"
          height="50"
          alt=""
          className="h-[50px] w-[50px] max-w-fit"
        />
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc");
          }}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "abilities",
    header: "Abilities",
    cell: ({ row }) => {
      const abilities =
        row.getValue<(typeof database)[0]["items"][0]["props"]["abilities"]>(
          "abilities",
        );
      return (
        <div className="grid gap-1 w-max">
          {abilities.map((ability) => (
            <Tooltip
              key={ability.id}
              delayDuration={20}
              disableHoverableContent
            >
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className=""
                  style={{
                    gridColumn: ability.slot,
                    gridRow: ability.row,
                  }}
                >
                  <Image
                    src={`/icons/${ability.icon}`}
                    width="50"
                    height="50"
                    alt={enDict[ability.id]}
                    className="h-5 w-5"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-sm max-w-72">
                <h3 className="font-bold">{enDict[ability.id]}</h3>
                <p
                  dangerouslySetInnerHTML={{
                    __html: enDict[`${ability.id}_desc`],
                  }}
                />
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      );
    },
  },
  ...propsColumns,
];
