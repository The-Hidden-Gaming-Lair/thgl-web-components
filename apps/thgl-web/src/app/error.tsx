"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { Subtitle } from "@/components/subtitle";
import { Button } from "@repo/ui/controls";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error); // Optionally replace with external logging service
  }, [error]);

  return (
    <div className="container max-w-xl mx-auto text-center p-8 space-y-8">
      <Subtitle>Oops, something went wrong</Subtitle>

      <p className="text-muted-foreground text-sm">
        We hit an unexpected error. Try reloading the page — or let us know if
        it keeps happening.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button onClick={reset}>Try Again</Button>
        <Link
          href="https://th.gl/discord"
          rel="noopener noreferrer"
          target="_blank"
          className="text-sm underline text-muted-foreground hover:text-white"
        >
          Contact us on Discord
        </Link>
      </div>

      <pre className="text-xs text-muted-foreground border-t pt-4 whitespace-pre-wrap break-words text-left">
        {error.message}
      </pre>
    </div>
  );
}
