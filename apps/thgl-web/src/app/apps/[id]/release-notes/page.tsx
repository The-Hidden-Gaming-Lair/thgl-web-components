import { games } from "@repo/lib";
import { redirect } from "next/navigation";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const decodedId = decodeURIComponent(id);
  const gameByTitle = games.find(
    (g) =>
      g.id === decodedId ||
      g.title === decodedId ||
      g.overwolf?.title === decodedId ||
      g.partnerApps?.some((app) => app.title === decodedId),
  );
  if (gameByTitle) {
    redirect(`/apps/${gameByTitle.id}`);
  }
  redirect(`/apps`);
}
