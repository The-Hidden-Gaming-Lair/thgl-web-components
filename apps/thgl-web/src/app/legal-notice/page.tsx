import DiscordButton from "@/components/discord-button";
import { Subtitle } from "@/components/subtitle";

export const metadata = {
  title: "Legal Notice - The Hidden Gaming Lair",
  description:
    "Find important legal information, including the website owner's details, contact information, and Discord server link, on The Hidden Gaming Lair's legal notice page.",
  alternates: {
    canonical: "/legal-notice",
  },
};

export default function LegalNotice(): JSX.Element {
  return (
    <div className="space-y-4 px-4 pt-10 pb-20 text-center">
      <Subtitle>Legal Notice / Impressum</Subtitle>
      <h3 className="font-bold">Website Owner</h3>
      <p>Leon Machens</p>
      <h3 className="font-bold">Contact</h3>
      <p>Email: leon(at)machens(dot)koeln</p>
      <DiscordButton
        href="https://discord.com/users/311400587445141504"
        className="mx-auto"
      >
        devleon
      </DiscordButton>
    </div>
  );
}
