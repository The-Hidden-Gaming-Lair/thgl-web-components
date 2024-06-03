import { ContentLayout } from "@repo/ui/ads";
import { ActivityReset, CustomActivities, Skeleton } from "@repo/ui/data";
import { HeaderOffset } from "@repo/ui/header";
import { ActivitiesProvider, type Activity } from "@repo/ui/providers";
import { type Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  alternates: {
    canonical: "/activities-tracker",
  },
  title: "Activities Tracker – The Hidden Gaming Lair",
  description:
    "Track your progress and conquer the challenges of Night Crows with this Activity Tracker. Monitor your achievements, quests, and milestones!",
};

const Activities = dynamic(() => import("@/components/activities"), {
  ssr: false,
  loading: () => (
    <>
      <div className="space-y-1">
        <Skeleton className="h-8 rounded-md w-40" />
        <Skeleton className="h-8 rounded-md" />
        <Skeleton className="h-8 rounded-md" />
      </div>
      <div className="space-y-1">
        <Skeleton className="h-8 rounded-md w-40" />
        <Skeleton className="h-8 rounded-md" />
        <Skeleton className="h-8 rounded-md" />
      </div>
    </>
  ),
});

export default function ActivitiesTracker(): JSX.Element {
  return (
    <ActivitiesProvider activities={activities}>
      <HeaderOffset full>
        <ContentLayout
          id="night-crows"
          header={
            <>
              <h2 className="text-2xl">Activities Tracker</h2>
              <p className="text-sm">
                This tracker puts you in control of your Night Crows journey.
                Customize and track the in-game activities and resources that
                matter most to you. Keep tabs on your progress and optimize your
                gameplay.
              </p>
            </>
          }
          content={
            <div className="flex flex-col gap-4 grow">
              <div className="ml-auto flex gap-2 mt-4">
                <CustomActivities />
                <ActivityReset />
              </div>
              <Activities />
            </div>
          }
        />
      </HeaderOffset>
    </ActivitiesProvider>
  );
}

const activities: Activity[] = [
  {
    title: "Irlette Temple",
    category: "Dungeon",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Masarta Ice Cavern",
    category: "Dungeon",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Guild Dungeon",
    category: "Dungeon",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Guild Shop",
    category: "Shop",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Contribution Coins",
    category: "Shop",
    max: 1,
    frequently: "weekly",
  },
  {
    title: "Daily Quests",
    category: "Quests",
    max: 30,
    frequently: "daily",
  },
  {
    title: "Guild Check In",
    category: "Guild",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Guild Donation Gold",
    category: "Guild",
    max: 3,
    frequently: "daily",
  },
  {
    title: "Guild Donation Morion",
    category: "Guild",
    max: 3,
    frequently: "daily",
  },
  {
    title: "Guild Donation Diamond",
    category: "Guild",
    max: 3,
    frequently: "daily",
  },
  {
    title: "Guild Orders",
    category: "Guild",
    max: 5,
    frequently: "daily",
  },
  {
    title: "Land of Prosperity",
    category: "Dungeon",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Forest of Training",
    category: "Dungeon",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Sancona Ruins",
    category: "Dungeon",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Battlefront Shop",
    category: "Shop",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Artifact Shop",
    category: "Shop",
    max: 1,
    frequently: "daily",
  },
  {
    title: "Gold Shop",
    category: "Shop",
    max: 1,
    frequently: "daily",
  },
];
