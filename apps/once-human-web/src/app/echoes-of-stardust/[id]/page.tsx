import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { type Database } from "@repo/ui/providers";
import { Button } from "@repo/ui/controls";
import { ExternalAnchor } from "@repo/ui/header";
import { SimpleMap } from "@repo/ui/interactive-map";
import SimpleMapClient from "@/components/simple-map-client";
import database from "../../../data/database.json" assert { type: "json" };

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = database.find((item) =>
    item.items.some((i) => i.id === params.id),
  ) as Database[number];
  if (!category) {
    return {};
  }
  const item = category.items.find((i) => i.id === params.id);
  if (!item) {
    return {};
  }

  return {
    title: `${item.props.title} – The Hidden Gaming Lair`,
    description: item.props.content,
  };
}

export default function Item({
  params,
}: {
  params: {
    id: string;
  };
}): JSX.Element {
  const category = database.find((item) =>
    item.items.some((i) => i.id === params.id),
  ) as Database[number];
  if (!category) {
    notFound();
  }
  const item = category.items.find((i) => i.id === params.id);
  if (!item) {
    notFound();
  }

  return (
    <div className="py-6 text-left space-y-2">
      <h3 className="uppercase text-4xl">{item.props.title}</h3>
      <p className="text-primary">{item.props.title1}</p>
      <p className="text-primary">{item.props.title2}</p>
      <p className="text-primary">{item.props.title3}</p>
      <p className="pt-4 text-muted-foreground whitespace-break-spaces">
        {item.props.content.trim()}
      </p>
      <h3 className="uppercase text-3xl">Location</h3>
      {item.props.location ? (
        <SimpleMapClient
          spawns={[
            {
              id: item.id,
              name: item.props.title,
              icon: null,
              p: [item.props.location[1], item.props.location[0]],
            },
          ]}
        />
      ) : (
        <>
          <p className="text-sm">
            Please join the Discord server, if you know the location.
          </p>
          <Button asChild variant="secondary">
            <ExternalAnchor href="https://th.gl/discord">
              Join Discord
            </ExternalAnchor>
          </Button>
        </>
      )}
    </div>
  );
}
