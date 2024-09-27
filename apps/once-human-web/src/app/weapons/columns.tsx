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

const enDict = _enDict as Dict;
const props = Object.keys(database[0].items[0].props).filter(
  (prop) => prop !== "weapons" && prop !== "abilities",
);

export interface Item {
  icon: string;
  [key: string]: string | number | any;
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
    accessorKey: "icon",
    header: "",
    cell: ({ row }) => {
      const icon = row.getValue<string>("icon");
      return (
        <Image
          src={`/icons/${icon}`}
          width="169"
          height="50"
          alt=""
          className="h-[50px] w-[169px] max-w-fit"
        />
      );
    },
  },
  ...propsColumns,
];
