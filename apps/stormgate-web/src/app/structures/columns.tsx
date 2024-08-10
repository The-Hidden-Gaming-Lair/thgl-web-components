"use client";
import { ArrowUpDown, Button } from "@repo/ui/controls";
import Image from "next/image";
import { type ColumnDef } from "@repo/ui/data";
import { type Dict } from "@repo/ui/providers";
import _enDict from "../../dicts/en.json" assert { type: "json" };
import database from "../../data/database.json" assert { type: "json" };
import groups from "../../data/groups.json" assert { type: "json" };

const enDict = _enDict as Dict;
const props = Object.keys(database[0].items[0].props).filter(
  (k) => k !== "speed",
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
  ...propsColumns,
];
