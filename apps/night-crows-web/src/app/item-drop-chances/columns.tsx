"use client";

import { ArrowUpDown, Button } from "@repo/ui/controls";
import { type ColumnDef } from "@repo/ui/data";
import Image from "next/image";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export interface Item {
  name: string;
  zone: string;
  icon: string;
  count: number;
  total: number;
  averageRate: number;
}

export const columns: ColumnDef<Item>[] = [
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
          Item
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "averageRate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc");
          }}
        >
          Average Rate
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const averageRate = row.getValue<number>("averageRate");
      return <div>1 in {averageRate.toFixed(0)}</div>;
    },
  },
  {
    accessorKey: "zone",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc");
          }}
        >
          Zone
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "count",
    header: "Count",
  },
  {
    accessorKey: "total",
    header: "Samples",
  },
];
