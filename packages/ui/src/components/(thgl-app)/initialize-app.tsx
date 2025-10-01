"use client";
import { initializeApp } from "@repo/lib/thgl-app";
import { useEffect } from "react";

export function InitializeApp({
  role = "client",
}: {
  role?: "client" | "dashboard";
}) {
  useEffect(() => {
    initializeApp(role);
  }, []);

  return <></>;
}
