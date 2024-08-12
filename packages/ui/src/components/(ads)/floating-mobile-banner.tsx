"use client";
import { useMediaQuery } from "@uidotdev/usehooks";
import { MobileBanner } from "./mobile-banner";

const smallMediaQuery = "(min-width: 768px)";
export function FloatingMobileBanner({ id }: { id: string }): JSX.Element {
  const matched = useMediaQuery(smallMediaQuery);
  if (matched) {
    return <></>;
  }
  return (
    <MobileBanner
      id={id}
      className="fixed bottom-0 left-0 right-0"
      mediaQuery="(max-width: 767px)"
    />
  );
}
