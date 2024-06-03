"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { Subtitle } from "@/components/subtitle";
import { Button } from "@/components/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container text-center p-8 space-y-8">
      <Subtitle>Something went wrong</Subtitle>
      <p className="text-sm text-gray-300">{error.message}</p>
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => {
            reset();
          }
        }
      >
        Try again
      </Button>
      <p>or join our Discord server and let us know!</p>
      <Link
        className="mx-auto block w-fit hover:scale-110 transition-transform"
        href="https://th.gl/discord"
        rel="noopener noreferrer"
        target="_blank"
      >
        <Image
          alt="Discord"
          height={39}
          src="/discord-logo-white.png"
          width={207}
        />
      </Link>
    </div>
  );
}
