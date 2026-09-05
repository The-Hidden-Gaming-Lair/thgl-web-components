import {
  AppHeader,
  AppVersion,
  CompatFlagNotice,
  ExclusiveFullscreenWarning,
  InitializeApp,
  ResizeBorders,
  DashboardSidebar,
  NavigationButtons,
} from "@repo/ui/thgl-app";
import { THGLDashboardAds } from "@repo/ui/ads";
import { LocaleSync } from "./locale-sync";
import Image from "next/image";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <InitializeApp role="dashboard" />
      <CompatFlagNotice />
      <LocaleSync />
      <div className="flex h-full flex-col w-dvw">
        <AppHeader>
          <div className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <Image
              src="/games/thgl-app/cave128.png"
              alt="Logo"
              width={28}
              height={28}
              className="shrink-0"
            />
            TH.GL
            <AppVersion />
          </div>
          <NavigationButtons />
        </AppHeader>
        <div className="flex flex-1 overflow-hidden pt-[32px]">
          <DashboardSidebar />
          <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
            <ExclusiveFullscreenWarning />
            <div className="flex-1 min-h-0 min-w-0 overflow-auto">
              {children}
            </div>
          </div>
          <THGLDashboardAds className="w-[360px] flex-none border-l overflow-y-auto" />
        </div>
      </div>
      <ResizeBorders />
    </>
  );
}
