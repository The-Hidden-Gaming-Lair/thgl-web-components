import { Controller } from "@repo/ui/thgl-app";
import { games } from "@repo/lib";
import { notFound } from "next/navigation";

export default async function AppControllerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const game = games.find((game) => game.id === id);
  if (!game) {
    notFound();
  }
  const companion = game.companion;
  if (!companion) {
    notFound();
  }

  return (
    <Controller
      title={game.title}
      controllerURL={companion.controllerURL}
      desktopURL={companion.desktopURL}
      overlayURL={companion.overlayURL}
      gameProcessNames={companion.games[0].processNames}
      defaultHotkeys={companion.defaultHotkeys}
    />
  );
}
