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
        className={`text-brand text-2xl font-semibold text-shadow text-center`}
      >
        {children}
      </h2>
    );
  }
  if (order === 3) {
    return (
      <h3
        className={`text-brand text-xl font-semibold text-shadow text-center`}
      >
        {children}
      </h3>
    );
  }
  return <></>;
}
