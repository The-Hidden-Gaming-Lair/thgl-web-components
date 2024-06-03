import DiscordButton from "@/components/discord-button";
import { Subtitle } from "@/components/subtitle";

export const metadata = {
  title: "Partner Program - The Hidden Gaming Lair",
  description:
    "Join my Partner Program and play a crucial role in promoting my apps to your audience on YouTube or Twitch.",
  alternates: {
    canonical: "/partner-program",
  },
};

export default function Partners(): JSX.Element {
  return (
    <div className="space-y-8 px-4 pt-10 pb-20 text-center">
      <Subtitle>Become a Partner</Subtitle>
      <p className="mx-auto max-w-xl text-center">
        Join my Partner Program and play a crucial role in promoting my apps to
        your audience on YouTube or Twitch.
      </p>

      <Subtitle order={3}>Benefits</Subtitle>
      <ul className="grow space-y-2">
        <li>
          <b>Free Subscription:</b> Enjoy an ad-free experience with premium
          features.
        </li>
        <li>
          <b>Visibility:</b> Receive recognition on my website and social media.
        </li>
        <li>
          <b>Preview Access:</b> Be the first to experience new features.
        </li>
        <li>
          <b>Exclusive Support:</b> Receive priority support and direct
          communication.
        </li>
      </ul>

      <Subtitle order={3}>Expectations</Subtitle>
      <ul className="grow space-y-2">
        <li>
          <b>Active Channel:</b> Maintain a well-maintained YouTube or Twitch
          channel.
        </li>
        <li>
          <b>Showcasing Apps:</b> Feature my apps in your content regularly.
        </li>
        <li>
          <b>App Advertising:</b> Promote my apps in your Twitch profile or
          video descriptions.
        </li>
        <li>
          <b>Regular Streaming:</b> Stream at least once a week with my apps.
        </li>
        <li>
          <b>Minimum Audience:</b> Have 1000+ subscribers or followers.
        </li>
        <li>
          <b>Brand Representation:</b> Showcase enthusiasm and professionalism.
        </li>
        <li>
          <b>Quality Content:</b> Create high-quality content that reflects
          positively.
        </li>
        <li>
          <b>Accurate Information:</b> Ensure accurate information about my
          apps.
        </li>
        <li>
          <b>Respectful Behavior:</b> Interact positively with the community.
        </li>
      </ul>

      <Subtitle order={3}>How to Apply</Subtitle>
      <p>
        If you meet the requirements and are excited to become a Partner, drop
        me a DM on Discord:
        <DiscordButton
          href="https://discord.com/users/311400587445141504"
          className="mx-auto mt-4"
        >
          devleon
        </DiscordButton>
      </p>
      <p>Thank you for considering my Partner Program!</p>
    </div>
  );
}
