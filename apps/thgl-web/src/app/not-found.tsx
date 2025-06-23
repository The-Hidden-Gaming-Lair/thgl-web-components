import Image from "next/image";
import Link from "next/link";
import { Subtitle } from "@/components/subtitle";
import { Button } from "@repo/ui/controls";

export default function NotFound() {
  return (
    <div className="container max-w-xl mx-auto text-center p-8 space-y-8">
      <Subtitle>Page Not Found</Subtitle>

      <p className="text-muted-foreground text-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
        <Link
          href="https://th.gl/discord"
          rel="noopener noreferrer"
          target="_blank"
          className="text-sm underline text-muted-foreground hover:text-white"
        >
          Contact us on Discord
        </Link>
      </div>
    </div>
  );
}
