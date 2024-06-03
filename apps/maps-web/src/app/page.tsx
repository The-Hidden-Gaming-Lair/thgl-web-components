import { HeaderOffset } from "@repo/ui/header";
import type { Metadata } from "next";
import { SignIn } from "@/components/sign-in";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  title: "Interactive Maps – The Hidden Gaming Lair",
  description: "Create your own Interactive Map for your favorite game.",
};

export default function Home(): JSX.Element {
  return (
    <HeaderOffset full>
      <SignIn />
    </HeaderOffset>
  );
}
