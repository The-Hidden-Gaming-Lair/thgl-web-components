import { NitroScript } from "@repo/ui/ads";
import DiscordButton from "@/components/discord-button";
import { Subtitle } from "@/components/subtitle";

export const metadata = {
  title: "Privacy Policy - The Hidden Gaming Lair",
  description:
    "Learn how I collect, use, and protect your information on The Hidden Gaming Lair website. This privacy policy covers data collection, data security, CCPA compliance, and how to contact me for privacy-related inquiries.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicy(): JSX.Element {
  return (
    <div className="space-y-4 px-4 pt-10 pb-20 text-center">
      <Subtitle>Privacy Policy</Subtitle>
      <p>
        This Privacy Policy explains how I collect, use, and protect your
        information when you visit my website,{" "}
        <a href="https://www.th.gl">The Hidden Gaming Lair</a>.
      </p>
      <h3 className="font-bold">Data Collection</h3>
      <p>
        I use Plausible Analytics to collect anonymous statistical data about
        website usage, such as the number of visitors and the pages they visit.
        Plausible does not collect any personally identifiable information (PII)
        or use cookies.
      </p>
      <p>
        My website may display ads served by NitroPay, which may use cookies for
        ad personalization and measurement. Please refer to NitroPay's cookie
        banner and privacy policy for more information on their data collection
        practices.
      </p>
      <h3 className="font-bold">Do Not Sell My Personal Information</h3>
      <p>
        To comply with the California Consumer Privacy Act (CCPA), I provide a
        "Do Not Sell My Personal Information" link. You can exercise your CCPA
        rights by clicking on the following link: <span data-ccpa-link="1" />
      </p>
      <h3 className="font-bold">Data Security</h3>
      <p>
        I take the security of your information seriously and have implemented
        appropriate measures to protect it from unauthorized access, disclosure,
        alteration, or destruction.
      </p>
      <h3 className="font-bold">Contact Me</h3>
      <p>
        If you have any questions or concerns about my privacy practices, or if
        you would like to exercise your privacy rights, you can contact me at:
        <DiscordButton
          href="https://discord.com/users/311400587445141504"
          className="mx-auto mt-4"
        >
          devleon
        </DiscordButton>
      </p>
      <h3 className="font-bold">Changes to This Privacy Policy</h3>
      <p>
        I reserve the right to update or change this Privacy Policy at any time.
        Any changes will be effective immediately upon posting the updated
        Privacy Policy on this page.
      </p>
      <NitroScript>
        <div />
      </NitroScript>
    </div>
  );
}
