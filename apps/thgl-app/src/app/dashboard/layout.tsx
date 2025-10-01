import { AppHeader, InitializeApp, ResizeBorders } from "@repo/ui/thgl-app";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <InitializeApp role="dashboard" />
      <AppHeader>
        <Link
          className="text-lg font-extrabold tracking-tight"
          href="/dashboard"
        >
          <h1 className="text-lg md:leading-6 font-extrabold tracking-tight whitespace-nowrap">
            TH.GL
          </h1>
        </Link>
        <p className="text-muted-foreground">The Hidden Gaming Lair</p>
      </AppHeader>
      {children}
      <ResizeBorders />
    </>
  );
}
