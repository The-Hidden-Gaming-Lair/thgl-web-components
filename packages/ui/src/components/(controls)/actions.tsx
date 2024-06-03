import { ReactNode } from "react";

export function Actions({ children }: { children: ReactNode }) {
  return (
    <div className="fixed top-[64px] right-2 mt-[1px] z-[500] flex gap-2">
      {children}
    </div>
  );
}
