export type FAQLabel =
  | "Overwolf"
  | "Companion App"
  | "General"
  | "Dune: Awakening"
  | "Once Human"
  | "Palia"
  | "New World"
  | "Linux"
  | "Subscription"
  | "Technical";

export type FAQEntry = {
  id: string;
  headline: string;
  question: string;
  answer: string;
  labels: FAQLabel[];
};

export const faqEntries: FAQEntry[] = [
  {
    id: "ticley-watch-scam",
    headline: "Charged by Ticley Watch / thgl.app",
    question: "I saw charges from THGL. Is this from The Hidden Gaming Lair?",
    answer: `
The Hidden Gaming Lair lives at **www.th.gl** and only offers subscriptions through Patreon.

If you see unexpected charges labeled "THGL" they likely come from the unrelated iOS app **Ticley Watch** at [thgl.app](https://thgl.app) ([App Store link](https://apps.apple.com/us/app/ticley-watch/id6745942105)). That project is not affiliated with The Hidden Gaming Lair.

### What to do
- Uninstall the Ticley Watch app
- Cancel any active subscription on your Apple ID
- Request a refund via the developer's [money-back page](https://thgl.app/money-back)
- Leave a review to warn other users and report the app in the App Store

I never charge users directly—only Patreon handles billing for the real THGL project.
    `.trim(),
    labels: ["General", "Subscription"],
  },
  {
    id: "once-human-gatherables-disabled",
    headline: "Once Human gatherables not showing in live mode",
    question:
      "Why don’t Gold or Silver nodes show up in live mode in the Once Human app?",
    answer: `
Starry Studio (the developers of Once Human) asked me to disable live tracking for gatherables like Gold or Silver.

To keep the apps safe and avoid any ban risks, I do **not** plan to re-enable this unless the studio gives clear permission.

You can still see **possible spawn locations** by disabling live mode in the app.

If you'd like to see this feature return, feel free to contact the game studio and ask them to allow it.
  `.trim(),
    labels: ["Once Human", "Overwolf"],
  },
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
  - \`crash.txt\` contains crash reports (if any)
  
  Please send these files when reporting bugs or issues.
    `.trim(),
    labels: ["Companion App", "Technical"],
  },
  {
    id: "antivirus-false-positive",
    headline: "Antivirus flags the Companion App",
    question:
      "Why does my antivirus flag THGLApp.exe or THGLUpdater.exe as a threat?",
    answer: `
  Some antivirus tools, especially Kaspersky, can falsely flag THGLApp.exe or THGLUpdater.exe as malware.
  
  These detections are false positives. You can confirm by uploading the file to [VirusTotal](https://www.virustotal.com/), where it is usually only flagged by a single vendor.
  
  I am working with antivirus vendors to resolve these reports, but they can be triggered by harmless details like the PNG icon in the installer or the updater's hidden command line.
    `.trim(),
    labels: ["Companion App", "Technical"],
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
    labels: ["Overwolf", "Subscription"],
  },
  {
    id: "locations-wrong-position",
    headline: "Locations not matching in-game position",
    question:
      "Why are the locations on the map not in the right position compared to in-game?",
    answer: `
This is usually related to **Live Mode** settings.

## Understanding Live Mode:

**Live Mode ENABLED:**
- Shows items/resources that are **actually spawned** in real-time
- Locations match exactly what's in your game right now
- Not all filters support live mode (hover to check tooltip)

**Live Mode DISABLED:**
- Shows **all possible spawn locations**
- These are potential spots where items CAN spawn
- May not match current in-game state

## Solution:
1. **Enable Live Mode** in the app settings
2. Check if your filter supports live mode (hover over it)
3. If supported, locations should now match in-game

Most users reporting "wrong positions" simply have Live Mode disabled. Enabling it typically fixes the issue immediately.
    `.trim(),
    labels: ["Overwolf", "General", "Technical"],
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
    labels: ["Overwolf", "Palia", "Technical"],
  },
  {
    id: "overwolf-on-linux-macos",
    headline: "Linux and MacOS support",
    question: "Can I run the Overwolf apps on Linux or MacOS?",
    answer: `
**MacOS/Steam Deck:** Not supported at all due to technical limitations.

**Linux:** While not officially supported, some users have had limited success with Wine/Proton. **Warning: This is experimental, often fails, and is not recommended.**

## Community Linux Guide (Experimental)

**⚠️ Important:** This guide rarely works and is provided as-is. No support is offered for Linux installations.

### Prerequisites
1. Launch your game (e.g., Palia) at least once through Steam
2. Verify the game prefix exists:
\`\`\`bash
# For Palia (adjust the number for other games)
if [ -d $HOME/.local/share/Steam/steamapps/compatdata/2707930 ]; then 
  echo "Game prefix OK"
else 
  echo "Launch the game first"
fi
\`\`\`

### Installation Steps

**Step 1: Install Protontricks**
\`\`\`bash
# Debian/Ubuntu/Mint
sudo apt install protontricks

# Arch-based (Manjaro, CachyOS, etc.)
sudo pacman -Syu protontricks

# Fedora
sudo dnf install protontricks
\`\`\`

Install .NET Framework:
\`\`\`bash
protontricks 2707930 dotnet452
\`\`\`

**Step 2: Install Overwolf**
1. Download [Overwolf setup](https://content.overwolf.com/downloads/setup/latest/regular.html)
2. Extract the zip file
3. Run \`protontricks\` and select your game
4. Choose "Enable silent install" → OK
5. Choose "Select the default wineprefix" → OK  
6. Choose "Run an arbitrary executable" → OK
7. Navigate to the extracted Overwolf setup and run it
8. Complete installation and cancel out of protontricks

**Step 3: Install Winetricks**
\`\`\`bash
# Arch-based
sudo pacman -Syu winetricks

# Debian/Ubuntu
sudo apt install winetricks

# Fedora
sudo dnf install winetricks
\`\`\`

Install additional .NET versions (first command may error - ignore it):
\`\`\`bash
WINEPREFIX="$HOME/.local/share/Steam/steamapps/compatdata/2707930/pfx/" winetricks -q dotnet40
WINEPREFIX="$HOME/.local/share/Steam/steamapps/compatdata/2707930/pfx/" winetricks -q dotnet48
\`\`\`

**Step 4: Set Windows 10 mode**
\`\`\`bash
protontricks 2707930 win10
\`\`\`

**Step 5: Install Protonhax**
\`\`\`bash
wget https://raw.githubusercontent.com/jcnils/protonhax/refs/heads/main/protonhax -P /usr/local/bin/
sudo chmod 755 /usr/local/bin/protonhax
\`\`\`

**Step 6: Run the game and Overwolf**
1. Launch your game through Steam
2. In a terminal, inject Overwolf:
\`\`\`bash
protonhax run 2707930 "$HOME/.steam/steam/steamapps/compatdata/2707930/pfx/drive_c/Program Files (x86)/Overwolf/Overwolf.exe"
\`\`\`

### Troubleshooting
- **Errors during installation:** Delete the game prefix and start over:
  \`\`\`bash
  sudo rm -rf $HOME/.local/share/Steam/steamapps/compatdata/2707930
  \`\`\`
- **Steam issues:** Run Steam from terminal instead of menu: \`steam\`
- **Overwolf won't start:** Repeat Step 2 to reinstall

### Why This Often Fails
- Overwolf requires Windows-specific components
- Memory reading for live tracking is incompatible with Wine/Proton
- Each game and system configuration behaves differently
- Updates frequently break compatibility

**Recommended alternative:** Use the web versions (e.g., palia.th.gl) on Linux.
    `.trim(),
    labels: ["Overwolf", "Linux", "Technical"],
  },
  {
    id: "palia-fish-tracker-guide",
    headline: "How to use the fish tracker",
    question: "How do I use the fish tracker feature in the Palia app?",
    answer: `
The fish tracker helps you catch specific fish efficiently.

## How to use:

1. **Select your target fish** - Choose one or multiple fish you want to catch in the app
2. **Cast your fishing rod** - Start fishing normally in-game
3. **Wait for the indicator** - After a moment, if your selected fish took the bait, it will appear on the map
4. **Make your decision**:
   - If your target fish appears → Reel it in!
   - If nothing appears or it's the wrong fish → Pull back before it bites and recast

## Tips:
- Works best when you know spawn locations for your target fish
- You can track multiple fish types simultaneously
- The tracker shows what's on your line BEFORE you commit to reeling

This feature saves time by letting you skip unwanted catches!
    `.trim(),
    labels: ["Palia", "Overwolf", "General"],
  },
  {
    id: "palia-incorrect-fish-display",
    headline: "Map shows incorrect fish for other players",
    question:
      "Why does the map show different fish than what my friends are actually catching?",
    answer: `
This is a **game issue**, not an app issue.

The app only displays what your game client loads. Sometimes Palia shows the wrong fish for other players visually in-game.

**What happens:**
- Your friend catches a plushie/ancient fish
- Their game shows the correct fish
- Your game displays it as a different fish (e.g., Tinfin instead of Floatfish plushie)
- The app shows what YOUR game sees

**Important notes:**
- Your own fish should always be accurate
- This visual bug affects what you see of OTHER players' fish
- You can verify this by looking at the fish model in-game
- Report this to the Palia team as a visual sync issue

Unfortunately, there's nothing the app can do to fix this since it only reads what the game displays.
    `.trim(),
    labels: ["Palia", "Overwolf", "Technical"],
  },
  {
    id: "palia-app-bannable",
    headline: "Is the Palia app bannable?",
    question: "Is the Palia Map App bannable or against TOS?",
    answer: `
No, you can use it without any risk of getting banned.

## Official Confirmation

I've had direct communication with **S6 Chief Revenue Officer WizardCrab**, who confirmed the app is allowed:

> "I don't know that there's an official statement I can make, but in general it's really not in our best interest to discourage folks like you from making tools that support Palia. So you don't have anything to worry about."

> "I think the only one that has raised some eyebrows is the in-game app that can tell you where all of the resources are even when you can't see them. But because you're not competitive over resources in our game, I don't think it really matters (the way it might in like New World for instance)."

![WizardCrab Confirmation](/faq/wizardcrab-confirmation.png)

WizardCrab also publicly stated in the official Discord that S6 does not care about 3rd party addons like this one.

## Terms of Service Compliance

While the Palia TOS mentions "3rd party applications that provide unfair advantage are not allowed without prior authorization":

- This map has **not** been determined to provide an "unfair" advantage
- It has been regularly checked by S6 since early 2024
- It has been continuously "authorized" via direct dev communication

## Important Notes

- **Thousands use the app daily** with zero bans reported
- The app has been available and monitored by S6 since early 2024
- If S6 changes their policies, the app will be updated immediately

**Warning:** Sometimes support teams (not S6 staff) share incorrect information based only on TOS without knowing about the explicit approval. There's also occasional misinformation spreading on social media platforms.
    `.trim(),
    labels: ["Palia", "Overwolf", "General"],
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
    labels: ["New World", "Overwolf", "Technical"],
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
    labels: ["Overwolf", "Technical"],
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
    labels: ["Once Human", "Overwolf", "General"],
  },
  {
    id: "dune-awakening-bannable",
    headline: "Is the Dune: Awakening app safe?",
    question: "Is the companion app bannable for Dune: Awakening?",
    answer: `
No, it has been officially approved by Funcom.

> "Our official stance is simple. We approve of the development of this app as long as it does not track the real-time positioning of enemy players in PvP situations. Therefore, in its current form, our teams will not penalize players for using it and we will provide advance notice should anything change in the future."

Source: [Reddit confirmation](https://www.reddit.com/r/duneawakening/comments/1n97yfy/comment/nd25kov/)
    `.trim(),
    labels: ["Dune: Awakening", "Companion App", "General"],
  },
  {
    id: "request-new-game-support",
    headline: "Request support for a new game",
    question:
      "Can you add support for [game name]? How do I request a new game?",
    answer: `
Game support depends on several factors. Here's what I consider:

## Requirements:
- **Game Engine**: Preferably Unreal Engine (data mining/tools are ready)
- **User Base**: Higher player count is preferred (check SteamDB charts)
- **Game Type**: Upcoming games or established games with active communities

## When requesting, please provide:
1. **Why are interactive maps useful** for this specific game?
2. **Which filters/locations** are most important to track?
3. **Existing competition** - Are there already good maps available?
4. **Feature scope** - Do you want:
   - Interactive web map only?
   - In-game app with live position tracking?

## How to request:
1. Join the Discord: [th.gl/discord](https://th.gl/discord)
2. Go to the **#👾・other-games** channel
3. **Search first** to check if already requested
4. Share your request with the details above

The more information you provide, the better I can evaluate the feasibility!
    `.trim(),
    labels: ["General", "Companion App", "Overwolf"],
  },
  {
    id: "apps-bannable",
    headline: "Are the apps bannable?",
    question: "Are the Companion App and Overwolf apps safe to use?",
    answer: `
Yes, they are safe.

Apps only read local memory and do not modify the game in any way.  
No bans have been reported across supported games.

Several games have official confirmations:
- **Dune: Awakening**: Officially approved by Funcom
- **Once Human**: Confirmed allowed by Starry Studio
- **Palia**: Confirmed allowed by S6 Chief Revenue Officer
    `.trim(),
    labels: ["General", "Companion App", "Overwolf"],
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
    labels: ["Overwolf", "Technical"],
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
    labels: ["General", "Subscription", "Technical"],
  },
  {
    id: "windows-insider",
    headline: "Windows Insider unsupported",
    question: "Can I use the Overwolf apps on Windows Insider builds?",
    answer: `
Officially, no — but there’s a workaround.

See: [Overwolf on Windows Insider](https://support.overwolf.com/en/support/solutions/articles/9000197893-running-overwolf-on-windows-insider)
    `.trim(),
    labels: ["Overwolf", "Technical"],
  },
  {
    id: "get-overwolf-logs",
    headline: "Get Overwolf logs",
    question: "How can I send you Overwolf logs for debugging?",
    answer: `
Follow this guide: [How to get Overwolf logs](https://support.overwolf.com/en/support/solutions/articles/9000176827-how-to-get-your-overwolf-logs)
    `.trim(),
    labels: ["Overwolf", "Technical"],
  },
];

export const allLabels: FAQLabel[] = [
  "General",
  "Overwolf",
  "Companion App",
  "Dune: Awakening",
  "Once Human",
  "Palia",
  "New World",
  "Linux",
  "Subscription",
  "Technical",
];
