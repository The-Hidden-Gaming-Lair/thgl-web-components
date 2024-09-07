"use client";

import dynamic from "next/dynamic";

const InteractiveMapDynamic = dynamic(
  () => import("./interactive-map-dynamic"),
  {
    ssr: false,
  },
);

export default function InteractiveMapClient(): JSX.Element {
  return <InteractiveMapDynamic />;
}
