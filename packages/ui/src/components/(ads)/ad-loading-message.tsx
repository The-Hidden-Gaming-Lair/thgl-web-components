"use client";

import { useT } from "../(providers)";

export function AdLoadingMessage() {
  const t = useT();

  return (
    <p className="text-center text-sm text-gray-500 p-2">{t("ad.loading")}</p>
  );
}
