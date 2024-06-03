import { orbitron } from "@/styles/fonts";
import { ReactNode } from "react";

export function Subtitle({
  children,
  order = 2,
}: {
  children: ReactNode;
  order?: number;
}) {
  if (order === 2) {
    return (
      <h2
        className={`${orbitron.className} text-brand text-2xl uppercase from text-shadow`}
      >
        {children}
      </h2>
    );
  }
  if (order === 3) {
    return (
      <h3
        className={`${orbitron.className} text-brand text-xl uppercase from text-shadow`}
      >
        {children}
      </h3>
    );
  }
  return <></>;
}
