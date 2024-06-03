"use client";

import { Button } from "@/components/button";
import { SignOut } from "@/components/sign-out";
import { Subtitle } from "@/components/subtitle";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="space-y-8 px-4 pt-10 pb-20 text-center">
      <Subtitle>Something went wrong!</Subtitle>
      <p className="mx-auto max-w-xl text-center">
        The Patreon authentication code is invalid or has expired. Please try
        again.
      </p>
      <p>{error.message}</p>
      <Button onClick={() => location.reload()}>Try again</Button>
      <SignOut />
    </div>
  );
}
