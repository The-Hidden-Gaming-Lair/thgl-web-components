"use client";

import { useT } from "../(providers)";

export function AdBlockMessage({ hideText }: { hideText?: boolean }) {
  const t = useT();

  return (
    <>
      <p className="text-center font-semibold p-2">
        {t("adblocker.shortTitle")}
      </p>
      {!hideText && (
        <p className="text-center text-sm text-gray-500 p-2">
          {t("adblocker.shortDescription")}
        </p>
      )}
    </>
  );
}
