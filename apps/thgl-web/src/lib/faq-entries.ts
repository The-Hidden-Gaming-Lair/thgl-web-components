export type FAQEntry = {
  id: string;
  headline: string;
  question: string;
  answer: string;
};

export const faqEntries: FAQEntry[] = [
  {
    id: "companion-log-files",
    headline: "Get Companion App log files",
    question: "How do I get the log files of the TH.GL Companion App?",
    answer: `
  The logs are stored locally on your system:
  
  \`C:\\Users\\<user>\\AppData\\Local\\The Hidden Gaming Lair\`  
  You can also type \`%appdata%\\..\\Local\\The Hidden Gaming Lair\` into File Explorer.
  
  - \`log.txt\` is the current session
  - \`log.1.txt\` to \`log.5.txt\` are older logs from previous sessions
    `.trim(),
  },
  {
    id: "ads-still-visible",
    headline: "Ads still visible after subscribing",
    question:
      "I've subscribed, but why are ads still visible in the Overwolf apps?",
    answer: `
If you've subscribed and still see ads in the Overwolf ads, make sure to:

- Open the [account page](/support-me/account) in the same browser you use for *.th.gl
- Authenticate and click on "Unlock the app"
- If that fails, use "Copy Secret" and paste it inside the app (click the heart icon)

**Note:** The Enthusiast tier does not remove ads.
    `.trim(),
  },
  {
    id: "live-mode-not-working",
    headline: "Live mode / Position detection not working",
    question:
      "Why isn't live mode or position detection working in Palworld or Palia?",
    answer: `
This is often caused when the game or Steam is run as administrator.

**Fix:**
- Avoid running Steam or the game as admin
- If unavoidable, try running Overwolf as admin too

This ensures the app can connect correctly and detect your position.
    `.trim(),
  },
  {
    id: "overwolf-on-linux-macos",
    headline: "Linux and MacOS support",
    question: "Can I run the Overwolf apps on Linux or MacOS?",
    answer: `
Linux and MacOS are not supported due to technical limitations.  
You need to use Overwolf and the apps on **Windows**.
    `.trim(),
  },
  {
    id: "palia-app-bannable",
    headline: "Is the Palia app bannable?",
    question: "Is the Palia Map App bannable or against TOS?",
    answer: `
No, you can use it safely.

Even the S6 Chief Revenue Officer confirmed it's allowed.  
> "It’s not in our best interest to discourage folks like you from making tools that support Palia."

The only concern mentioned was apps showing *hidden* resources, but in Palia this has no competitive impact.
    `.trim(),
  },
  {
    id: "aeternum-position-inaccurate",
    headline: "Inaccurate position in Aeternum Map",
    question: "Why is the position not accurate in the Aeternum Map?",
    answer: `
Due to Amazon Game Studios' policy, accurate tracking is not allowed to prevent botting.

The app uses **position extrapolation**, which works best with default movement keys.

More info: [New World Compliance Guide](https://dev.overwolf.com/ow-native/guides/game-compliance/new-world)
    `.trim(),
  },
  {
    id: "fps-drops",
    headline: "FPS drop with Overwolf apps",
    question:
      "I have low FPS or drops when using Overwolf apps. What can I do?",
    answer: `
Try the following:

- Check mouse polling settings: [FPS Issues](https://support.overwolf.com/en/support/solutions/articles/9000184425-performance-issues-fps-cpu-memory-)
- RivaTuner might conflict: [RivaTuner FAQ](https://support.overwolf.com/en/support/solutions/articles/9000177860-overwolf-and-conflicts-with-rivatuner)
- Use hardware acceleration (Overwolf settings)
- DLSS 3.5 Frame Generation may cause crashes
- Match desktop + game resolution
- Use 2nd screen or Peer Link instead of overlay
- Avoid low polling rates in settings
    `.trim(),
  },
  {
    id: "once-human-bannable",
    headline: "Is the Once Human app safe?",
    question: "Can I get banned for using the Once Human map app?",
    answer: `
No. According to the support team on Reddit:

> "This map is ALLOWED. We will NOT be banning users for using this map."

Source: [Reddit confirmation](https://www.reddit.com/r/OnceHumanOfficial/comments/1eryrag/comment/li6g7rc)
    `.trim(),
  },
  {
    id: "apps-bannable",
    headline: "Are the apps bannable?",
    question: "Are the Companion App and Overwolf apps safe to use?",
    answer: `
Yes, they are safe.

Apps only read local memory and do not modify the game in any way.  
No bans have been reported across supported games.
    `.trim(),
  },
  {
    id: "admin-rights-error",
    headline: "Overwolf asks for admin rights",
    question:
      "The Overwolf app asks for admin rights, but I already granted them. Why?",
    answer: `
Most likely, Overwolf wasn’t **fully exited**.

**Steps:**
1. Exit Overwolf via system tray or Task Manager (not just \`X\`)
2. Close your game
3. Run Overwolf as admin
4. Launch the app, check if the error is gone
5. If not, try again — one step likely failed

This fixes 99% of admin permission issues.
    `.trim(),
  },
  {
    id: "adblock-detected",
    headline: "Ad blocker detected",
    question: "Why am I seeing an 'Ad Blocker Detected' message?",
    answer: `
You're using an ad blocker or DNS filter that blocks NitroPay.

**Fixes:**
- Whitelist \`*.th.gl\` in your ad blocker
- Subscribe via [Support Me](/support-me) to remove ads

**Known blockers:**  
AdBlock, uBlock, Malwarebytes, Pi-Hole, Firefox strict mode, and more.

If you're unsure, check if [this file](https://s.nitropay.com/ads-1487.js) loads. If not, you're being blocked.
    `.trim(),
  },
  {
    id: "windows-insider",
    headline: "Windows Insider unsupported",
    question: "Can I use the Overwolf apps on Windows Insider builds?",
    answer: `
Officially, no — but there’s a workaround.

See: [Overwolf on Windows Insider](https://support.overwolf.com/en/support/solutions/articles/9000197893-running-overwolf-on-windows-insider)
    `.trim(),
  },
  {
    id: "get-overwolf-logs",
    headline: "Get Overwolf logs",
    question: "How can I send you Overwolf logs for debugging?",
    answer: `
Follow this guide: [How to get Overwolf logs](https://support.overwolf.com/en/support/solutions/articles/9000176827-how-to-get-your-overwolf-logs)
    `.trim(),
  },
];
