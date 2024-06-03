"use client";

import { ArrowUpDown, Button } from "@repo/ui/controls";
import { type ColumnDef } from "@repo/ui/data";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export interface Item {
  modList: string[];
  itemTypes: string[];
  dropLocation: string;
  enemyType: string;
  mapRegion: string;
}

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: "modList",
    header: "Mod List",
    cell: ({ row }) => {
      const modList = row.getValue<string[]>("modList");
      return (
        <div>
          {modList.map((mod) => (
            <p key={mod}>{mod}</p>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "itemTypes",
    header: "Item Types",
    cell: ({ row }) => {
      const itemTypes = row.getValue<string[]>("itemTypes");
      return (
        <div>
          {itemTypes.map((itemType) => (
            <p key={itemType}>{itemType}</p>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "dropLocation",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc");
          }}
        >
          Drop Location
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "enemyType",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc");
          }}
        >
          Enemy Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "mapRegion",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc");
          }}
        >
          Map Region
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
];
