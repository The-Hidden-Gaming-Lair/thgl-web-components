"use client";

import dynamic from "next/dynamic";

const InteractiveMapDynamic = dynamic(
  () => import("./interactive-map-dynamic"),
  {
    ssr: false,
  },
);

export default function InteractiveMapClient({
  mobalytics,
}: {
  mobalytics?: boolean;
}): JSX.Element {
  return <InteractiveMapDynamic mobalytics={mobalytics} />;
}
