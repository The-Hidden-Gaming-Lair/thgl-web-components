import { Separator } from "../ui/separator";
import { useGameState } from "@repo/lib";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { useMemo } from "react";
import { MarkerDetails, TooltipItem } from "./marker-details";
import { AdditionalTooltipType } from "../(content)";

export type TooltipItems = TooltipItem[];

export function MarkerTooltip({
  appName,
  latLng,
  items,
  onClick,
  onClose,
  hideDiscovered,
  hideComments,
  additionalTooltip,
}: {
  appName: string;
  latLng: [number, number] | [number, number, number];
  items: TooltipItems;
  onClose: () => void;
  onClick?: (id: string) => void;
  hideDiscovered?: boolean;
  hideComments?: boolean;
  additionalTooltip?: AdditionalTooltipType;
}) {
  const player = useGameState((state) => state.player);
  const distance = useMemo(
    () =>
      player
        ? Math.sqrt(
            Math.pow(player.x - latLng[0], 2) +
              Math.pow(player.y - latLng[1], 2) +
              Math.pow(
                player.z - (latLng.length === 3 ? latLng[2] : player.z),
                2,
              ),
          )
        : undefined,
    [player, latLng],
  );

  return (
    <Carousel>
      <CarouselContent>
        {items.map((item) => (
          <CarouselItem key={item.id}>
            <MarkerDetails
              appName={appName}
              item={item}
              latLng={latLng}
              onClose={onClose}
              hideDiscovered={hideDiscovered}
              hideComments={hideComments || item.isPrivate}
              onClick={() => {
                if (item.isLive) {
                  return;
                }
                onClick?.(
                  item.id?.includes("@")
                    ? item.id
                    : `${item.id || item.type}@${latLng[0]}:${latLng[1]}`,
                );
              }}
              distance={distance}
              additionalTooltip={additionalTooltip}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      {items.length > 1 ? (
        <>
          <Separator className="my-4" />
          <div className="flex items-center space-x-2">
            <span className="grow italic">
              This is a cluster of {items.length} items
            </span>
            <CarouselPrevious className="static transform-none" />
            <CarouselNext className="static transform-none" />
          </div>
        </>
      ) : null}
    </Carousel>
  );
}
