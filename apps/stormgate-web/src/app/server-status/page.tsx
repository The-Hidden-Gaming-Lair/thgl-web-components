import { ContentLayout } from "@repo/ui/ads";
import { HeaderOffset } from "@repo/ui/header";
import { type Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/server-status",
  },
  title: "Stormgate Server Status – The Hidden Gaming Lair",
  description: "Check the Stormgate server status and ping times.",
};

export default function ServerStatus() {
  return (
    <HeaderOffset full>
      <ContentLayout
        id="stormgate"
        header={
          <>
            <h2 className="text-2xl">Server Status</h2>
            <p className="text-sm">
              Check the Stormgate server status and ping times. Press
              CTRL+ALT+SHIFT+F in-game to see the server status.
            </p>
          </>
        }
        content={
          <div className="flex flex-col gap-4 grow">
            <div className="ml-auto flex gap-2 mt-4">
              {/* <CustomActivities />
                <ActivityReset /> */}
            </div>
            {/* <Activities /> */}
          </div>
        }
      />
    </HeaderOffset>
  );
}
