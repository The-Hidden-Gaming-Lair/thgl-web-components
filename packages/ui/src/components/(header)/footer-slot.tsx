"use client";

import { createContext, useContext, type ReactNode, type JSX } from "react";

/**
 * Pages scroll inside `HeaderOffset full` (an `h-dscreen` scroll area), not
 * the document — a footer rendered after `<main>` would sit below that box
 * behind a second scrollbar. The root layout hands its footer down through
 * this slot and `HeaderOffset` renders it after the page content. No provider
 * (Overwolf/desktop app shells) → no footer.
 */
const FooterSlotContext = createContext<ReactNode>(null);

export function FooterSlotProvider({
  footer,
  children,
}: {
  footer: ReactNode;
  children: ReactNode;
}): JSX.Element {
  return (
    <FooterSlotContext.Provider value={footer}>
      {children}
    </FooterSlotContext.Provider>
  );
}

export function FooterSlot(): ReactNode {
  return useContext(FooterSlotContext);
}
