"use client";
import { CurrentVersion, initController } from "@repo/lib/thgl-app";
import { useEffect } from "react";

export function InitializeController({
  currentVersion,
}: {
  currentVersion: CurrentVersion;
}) {
  useEffect(() => {
    initController(currentVersion);
  }, []);

  return null;
}
