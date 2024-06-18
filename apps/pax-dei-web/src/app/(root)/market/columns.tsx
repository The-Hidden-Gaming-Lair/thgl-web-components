"use client";

import { ArrowUpDown, Button } from "@repo/ui/controls";
import { type ColumnDef } from "@repo/ui/data";
import { ExternalAnchor } from "@repo/ui/header";
import Markdown from "markdown-to-jsx";
import { ExternalLink } from "lucide-react";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export interface Item {
  name: string;
  description: string;
  channel: string;
  timestamp: string;
}

export const columns: ColumnDef<Item>[] = [
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
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue<string>("description");
      return <Markdown options={{ forceBlock: false }}>{description}</Markdown>;
    },
  },
  {
    accessorKey: "channel",
    header: "Channel",
    cell: ({ row }) => {
      const channel = row.getValue<string>("channel");
      return (
        <ExternalAnchor
          href={channel}
          className="underline flex gap-1 hover:text-primary transition-colors"
        >
          Market Channel <ExternalLink className="w-3 h-3" />
        </ExternalAnchor>
      );
    },
  },
  {
    accessorKey: "timestamp",
    header: "Last Trade",
    cell: ({ row }) => {
      const timestamp = row.getValue<string>("timestamp");
      return <span>{new Date(timestamp).toLocaleDateString()}</span>;
    },
  },
];
