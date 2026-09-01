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
  // Optional rich block rendered after the markdown answer (the answer string
  // is Discord-markdown and can't hold a table/React component).
  embed?: "feature-comparison";
};

export const faqEntries: FAQEntry[] = [
  {
    id: "what-do-i-get-by-supporting",
    headline: "What do I get by supporting? (premium features explained)",
    question:
      "What are the premium features, and what does each supporter tier unlock?",
    answer: `
The map itself is **free** — interactive maps, every filter, live tracking, and **Peer Link** (mirror the map to a phone or second screen) need no account at all.

A **free account** (just sign in) adds **cloud-synced, shareable filters** and **comments on map markers**.

Supporting on [Patreon](https://www.patreon.com/devleon) unlocks the rest. Tiers are **cumulative** — each includes everything below it:

### Enthusiast — $2/mo
- Discord supporter role

### Pro — $5/mo
- Everything in Enthusiast
- Ad-free across every TH.GL app

### Elite — $10/mo
- Everything in Pro
- Early access to preview features (new features land here first before public release)

**A note on "Premium Features":** these are game-specific extras that only a few older apps (like New World) bundle. Newer maps such as **Palia** don't have separate premium features — supporting Palia gets you the perks above (ad removal, preview access).

You can subscribe on the [Support page](/support-me). Here's the full breakdown:
    `.trim(),
    labels: ["Subscription", "General"],
    embed: "feature-comparison",
  },
  {
    id: "palia-active-worlds",
    headline: "Palia Active Worlds & join-code requests",
    question:
      "What is the Active Worlds tracker, and why did I get a “a player wants to join your world” message?",
    answer: `
**Active Worlds** is a live, crowdsourced list of Palia worlds and the events happening in them right now — such as **Flow Trees** and **Palium** — powered by players running the free [TH.GL companion app](/companion-app). You can browse it at [palia.th.gl/worlds](https://palia.th.gl/worlds).

Palia streams each zone as its own server instance, and to hop into a **specific** world you need its **4-character join code**. On the tracker you can **request a code** for any active world.

**"A player wants to join your world" prompt:** when someone requests a code for the world you're currently in, the app shows you a prompt. To share your code, open the game menu (**Esc → World Code**) — the app reads the code the game displays and posts it to the tracker so the other player can join. It's completely optional: nothing is shared unless you open that panel yourself.

**Don't want these prompts?** Turn them off in **Settings → Palia → Join-code request notifications**.
    `.trim(),
    labels: ["Palia"],
  },
  {
    id: "add-nodes-and-drawings",
    headline: "How to add your own nodes & drawings to the map",
    question:
      "How do I add my own markers (nodes) and drawings to the map, and edit them later?",
    answer: `
You can add your own markers (**nodes**) and freehand **drawings** to any map. Both save automatically per map, appear in your filters list, and can be shared. (Sign in with a free account to sync them across devices.)

## Add a node (custom marker)
1. Click **Add Node** in the map toolbar.
2. Click the spot on the map where you want it.
3. Give it a **name**, pick an **icon** and **color**, and add an optional description.
4. **Save** — it appears on the map and as a filter in the sidebar.

## Add a drawing
1. Click **Add Drawing** to open the drawing toolbar.
2. Pick a tool — **Draw Line**, **Draw Rectangle**, **Draw Polygon**, **Draw Circle**, or **Add Text** — and set the **color**, **fill**, and **size**.
3. Draw on the map:
   - **Line / Polygon:** click each point, then double-click (or click the last point again) to finish.
   - **Rectangle / Circle:** click and drag.
   - **Text:** click where you want it and type.
4. **Save** — your drawing shows on the map and in your filters list.

![Drawing toolbar](/games/thgl-web/faq/drawing-toolbar.png)

## Adjust a drawing (edit tools)
The drawing toolbar has three editing tools:
- **Edit Mode** — drag a point to move it, click a **mid-segment dot** to add a new point, and **right-click** a point to delete it. Circles show center and radius handles.
- **Drag Mode** — grab anywhere on a shape to move the whole thing.
- **Remove Layer** — click a shape to delete it.

![Edit mode handles](/games/thgl-web/faq/drawing-edit-mode.jpg)

## Edit or fix it after saving
Your saved nodes and drawings live under **My Filters** in the sidebar. Made a mistake? You don't have to start over — open the **⋯ menu** on a filter to **Edit drawing**, **Rename**, **Duplicate**, or **Delete** it.

## Share with others
Sharing is built in — sign in with a free account so your filter syncs, then open the **⋯ menu** on it:
- **Publish to community** — makes it public so anyone can find and import it from **Browse Community Filters** (the globe button at the top of My Filters).
- **Create share code** — generates a code to send a friend; they add it with **Add Shared Filter** by pasting the code.
- **Download** — export it as a file to share manually (the other person imports it with **Upload**).
    `.trim(),
    labels: ["General"],
  },
  {
    id: "import-progress-from-another-map-site",
    headline: "Import your progress from another map site",
    question:
      "I already tracked chests and collectibles on another interactive map (like appsample). Can I import that progress into TH.GL?",
    answer: `
Yes — for supported games you can bring your found markers over in a one-time copy. It matches the other site's markers to the same locations on our map and marks them as **discovered** here.

> Supported today: **appsample → Wuthering Waves**. More sites/games will follow.

## How to import
1. On the TH.GL map, open **Settings → Discovered Nodes** and click **Import from another site**.
2. Follow the on-screen steps to export from the other site (see below), then paste the result into the box.
3. Review the matched groups and choose **Merge** (keep what you already have) or **Replace all**.

## Exporting from appsample (desktop only)
The other site stores your progress in your signed-in account, so the export has to run in a desktop browser (mobile browsers have no developer console):
1. Open the appsample map on a **computer** and sign in with the same Google account.
2. Press **F12** → **Console** tab.
3. Paste the snippet shown in the TH.GL import dialog and press **Enter**. (If the browser blocks the paste, type **allow pasting** first.)
4. It copies your found markers to the clipboard — paste them back into the TH.GL import box.

## Good to know
- Only marker types we have on our map can be matched (e.g. chests, tidal heritages, sonance caskets). Anything we don't track, or areas not yet supported, is skipped — the dialog tells you how many.
- Discovered markers are stored **per device** (they aren't cloud-synced), so import on each device you use, or use **Backup/Restore** in the same settings section to copy them across.
    `.trim(),
    labels: ["General"],
  },
  {
    id: "ticley-watch-scam",
    headline: "Unexpected charges from THGL.APP (NOT The Hidden Gaming Lair)",
    question:
      "I see charges like 'THGL.APP-4Y...' or 'THGL' on my bank statement. Is this from The Hidden Gaming Lair?",
    answer: `
**NO. These charges are NOT from The Hidden Gaming Lair.**

The Hidden Gaming Lair lives at **www.th.gl** (NOT thgl.app) and **only offers subscriptions through Patreon**. I never charge users directly.

### The Scam Apps

If you see unexpected charges labeled **"THGL.APP-4Y..."** or similar, they come from scam iOS apps at the domain **thgl.app** (note the different domain). These apps are **NOT affiliated** with The Hidden Gaming Lair:

1. **Ticley Watch** - [App Store link](https://apps.apple.com/us/app/ticley-watch/id6745942105)
2. **Holix Gallery** - [App Store link](https://apps.apple.com/us/app/holix-gallery/id6752016590)

Both apps are from [thgl.app](https://thgl.app) and have nothing to do with this gaming project.

### What to do immediately
1. **Uninstall** the Ticley Watch or Holix Gallery app from your iPhone/iPad
2. **Cancel the subscription** in your Apple ID settings
3. **Request a refund** via the developer's [money-back page](https://thgl.app/money-back) or through Apple
4. **Report the app** in the App Store and leave a warning review for others
5. **Contact your bank** if refunds are denied

### Remember
- The Hidden Gaming Lair = **th.gl** (Patreon only)
- The scam apps = **thgl.app** (iOS apps with deceptive charges)
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
## Easiest Method: Use the Debug Snapshot Feature

The app includes a built-in debug snapshot feature that automatically gathers all relevant information:

1. **Open the Dashboard** (double-click the system tray icon)
2. **Click the Menu icon** (☰ burger, top-right of the header)
3. **Click the Bug icon** ("Send Debug Snapshot") — it's in the menu's top row, next to the Discord/GitHub/Reddit icons
4. **Describe your issue** in the text box (e.g., "Ore not showing up on map")
5. **Click Send** - The app automatically captures and sends:
   - Last 500 log entries (including debug logs)
   - Current game state (player position, actors, character data)
   - App version and system info

This method is **faster** and provides **more context** than manually sending log files.

## Manual Method: Access Log Files Directly

If needed, logs are stored locally at:

\`C:\\Users\\<user>\\AppData\\Local\\The Hidden Gaming Lair\`

You can also type \`%appdata%\\..\\Local\\The Hidden Gaming Lair\` into File Explorer.

**Files:**
- \`log.txt\` - Current session
- \`log.1.txt\` to \`log.5.txt\` - Previous sessions (rotated on app restart)
- \`crash.txt\` - Crash reports (if any)

**Note:** The debug snapshot feature captures more information than these files alone, so prefer using that method when reporting issues.
    `.trim(),
    labels: ["Companion App", "Technical"],
  },
  {
    id: "update-companion-app",
    headline: "How to update the Companion App",
    question: "How do I update the TH.GL Companion App to the latest version?",
    answer: `
The Companion App has multiple ways to update:

## Automatic Update (Recommended)
The app includes an auto-updater that checks for new versions:
- When you launch the app
- Regularly while running (only when you're not in-game)

Just wait and the app will update itself automatically.

## Manual Update Methods

**Method 1: Restart the app**
1. Right-click the app icon in the system tray
2. Select "Exit"
3. Launch the app again - it will check for updates on startup

**Method 2: Run the updater directly**
Execute the updater manually:
\`C:\\Program Files (x86)\\The Hidden Gaming Lair\\THGLUpdater.exe\`

Both manual methods will trigger an immediate update check.
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
    headline: "How to remove ads / unlock supporter perks",
    question:
      "How do I remove ads and unlock my perks — on the website, the Companion App, and Overwolf?",
    answer: `
First: ad removal needs the **Pro** or **Elite** tier. The **Enthusiast** tier does *not* remove ads.

How you unlock depends on where you see the ads:

### Website (th.gl in a browser)
1. Click your **profile icon** (top-right) to open the account window.
2. Click **"Already a supporter? Sign In"** and authenticate with Patreon.

Use the same browser you browse *.th.gl in. Ads disappear once you're signed in.

### Companion App
1. Click the **profile icon** in the top-right of the map or the launcher.
2. **Authenticate with Patreon.** That's it — no code to copy.

### Overwolf apps
Overwolf apps can't sign in directly, so you unlock them with a one-time **secret**:
1. Become a **Pro/Elite** supporter on [Patreon](https://www.patreon.com/devleon).
2. Open the [account page](/support-me/account). If a big **Authenticate with Patreon** button shows, click it and sign in. Already signed in? The page shows your account details instead — no button, nothing to do here.
3. Scroll down to the **Unlock Overwolf Apps** section, find your game's card, and click **Unlock App** (one click). If the app doesn't open, click **Copy Secret** instead.
4. In the app, open the account window (profile/heart icon), **paste the secret**, and click **Unlock**.

Still stuck? Patreon occasionally has brief connection issues — wait a few minutes and try again.

**Related:** [Discord supporter role](/faq/discord-supporter-role).
    `.trim(),
    labels: ["General", "Subscription", "Companion App", "Overwolf"],
  },
  {
    id: "discord-supporter-role",
    headline: "How to get the Discord supporter role",
    question: "How do I get the Discord supporter role?",
    answer: `
To get the Discord supporter role, you need to link your Discord account to your Patreon account.

**Steps:**
1. Log into your Patreon account
2. Go to your account settings
3. Connect your Discord account to Patreon
4. The supporter role will be automatically assigned based on your subscription tier

For detailed instructions, see Patreon's official guide: [Getting Discord access](https://support.patreon.com/hc/en-us/articles/212052266-Getting-Discord-access)

**Note:** Make sure you're a member of The Hidden Gaming Lair Discord server for the role to appear.

**Subscriber benefits:**
- Discord supporter role based on your tier
- Ad removal in Overwolf apps (see [unlocking guide](/faq/ads-still-visible))
- Access to the [account page](/support-me/account) to manage your subscription
    `.trim(),
    labels: ["General", "Subscription"],
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
    id: "live-mode-render-distance",
    headline: "Distant resources don't show in live mode",
    question:
      "Can I increase the render distance so resources farther away show up in live mode?",
    answer: `
No — and it's worth explaining why. Live mode reads the entities your **game client currently has loaded**.

In online games like Palia, the **server only sends your client the things near you** (Unreal Engine's "network relevance" — roughly 150 m by default) to save bandwidth. Anything farther isn't sent to your client at all, so there's nothing for the app to read.

**This is controlled by the game's server, not by the app — and not by your graphics settings.** Turning up the in-game "view distance" won't help either, since that only affects what's *drawn*, not what's *loaded*.

**To see resources beyond that range:** turn **off live mode** and use the static / predicted view. It shows every known spawn location for the whole map regardless of where you're standing — ideal for planning a route. Switch live mode back on when you want to confirm what's actually spawned near you right now.
    `.trim(),
    labels: ["General", "Technical"],
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

![WizardCrab Confirmation](/games/thgl-web/faq/wizardcrab-confirmation.png)

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
    headline: "FPS drops, lag, or performance issues with THGL apps",
    question:
      "I have low FPS, lag, or performance drops when using the Overwolf or THGL Companion App. What can I do?",
    answer: `
## General Solutions (All Apps)

Try these solutions first, regardless of which app you're using:

**1. Only Run One Map Launcher**
Make sure you're only running one map launcher at a time. Running both Overwolf and the THGL Companion App simultaneously will impact performance. Overwolf is significantly heavier, so if you already have it running, you're more likely to notice lag from other apps. Generally, switching from Overwolf to the THGL Companion App should improve performance since the Companion is much lighter.

**2. Update GPU Drivers**
Always make sure that your GPU drivers are up-to-date.

**3. Check Antivirus Software**
Some antivirus programs can slow down app requests. Windows Defender typically doesn't cause issues, but third-party antivirus software might interfere with performance.

## THGL Companion App Solutions

If you're experiencing performance issues with the THGL Companion App, especially when using 2nd screen mode:

### Common Cause
This usually happens when your GPU driver or Windows decides to use all resources for the game itself.

### Solutions to Try

**1. Game Display Mode (Important)**
Running the game in **exclusive fullscreen** can cause various issues with the THGL Companion App. Use **borderless fullscreen** or **windowed mode** instead for better compatibility and performance.

**2. Windows Graphics Settings**
1. Go to: Settings → System → Display → Graphics
2. Add the THGLApp executable
3. Set to High Performance (or try other configurations)

**3. Hardware-accelerated GPU scheduling**
1. Go to: Settings → System → Display → Graphics
2. Open Advanced graphics settings
3. Toggle Hardware-accelerated GPU scheduling

## Overwolf App Solutions

If you're experiencing performance issues with Overwolf apps:

- **Check mouse polling settings:** [FPS Issues](https://support.overwolf.com/en/support/solutions/articles/9000184425-performance-issues-fps-cpu-memory-)
- **RivaTuner conflicts:** [RivaTuner FAQ](https://support.overwolf.com/en/support/solutions/articles/9000177860-overwolf-and-conflicts-with-rivatuner)
- **Hardware acceleration:** Enable it in Overwolf settings (disabling makes the map slower, but the game faster)
- **DLSS 3.5 Frame Generation:** May cause crashes or performance issues
- **Resolution matching:** Use the same resolution in-game and on desktop
- **Alternative display methods:** Use 2nd screen mode or Peer Link (phone/tablet as minimap) instead of overlay
- **Polling rate:** Avoid setting polling rates too low in the app settings
    `.trim(),
    labels: ["Overwolf", "Companion App", "Technical"],
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
    id: "companion-app-system-requirements",
    headline: "Companion App system requirements",
    question: "What are the system requirements for the TH.GL Companion App?",
    answer: `
Windows 10 or 11 (64-bit) with WebView2 Runtime (included with Windows 11 or installed automatically). ~7MB download size. Works on most gaming PCs without performance impact.
    `.trim(),
    labels: ["Companion App", "Technical"],
  },
  {
    id: "companion-app-linux-macos",
    headline: "Companion App on Linux or macOS",
    question: "Can I use the TH.GL Companion App on Linux or macOS?",
    answer: `
The companion app is Windows-only. However, you can use our web versions (e.g., palworld.th.gl, duneawakening.th.gl) on any platform. They won't have overlay or position tracking, but all map features work.
    `.trim(),
    labels: ["Companion App", "Linux", "General"],
  },
  {
    id: "how-to-update-apps",
    headline: "How to update the apps (Overwolf & Companion App)",
    question:
      "How do I update the Overwolf apps or the TH.GL Companion App to the latest version?",
    answer: `
Both app types **update automatically** — there is no manual update button and you don't need to reinstall for new versions.

**The universal fix:** fully **exit** the app (system tray icon → Exit, not just the \`X\`) and start it again — or restart your PC. Both apps check for updates on startup.

## TH.GL Companion App

The app checks for a new version:
- shortly after it starts,
- every 30 minutes while it runs,
- right after you close your game.

**Updates are never installed while a game is running** — that's the most common reason the app seems "stuck" on an old version. Close the game and the update installs silently within a few seconds; the app restarts itself on the new version.

**Still on an old version?** If an update attempt failed (e.g. a permission problem), the app waits a few hours before retrying the same version — this prevents endless permission-prompt loops. The fastest fix: download the latest installer and run it over your existing installation. Your settings are kept.

[Download the latest Companion App](https://app.th.gl/THGL_Installer.exe)

## Overwolf apps

Overwolf downloads updates for itself and its apps silently in the background and applies them the next time Overwolf starts. To force an update:

1. **Fully exit Overwolf** via the system tray icon (not just \`X\`) and start it again — pending updates are applied on launch.
2. Or update from inside the app: open the app's **Settings** — the **Status** section shows your version and checks for updates. If a new version is ready, click **Update Now!**, then **Restart Now!** once it's installed.

To update the Overwolf client itself, see the official guide: [How to update Overwolf](https://support.overwolf.com/en/support/solutions/articles/9000176831-what-is-my-overwolf-version-and-how-to-update-it-)

## Still having trouble?

Reach out on Discord at [th.gl/discord](https://th.gl/discord).
    `.trim(),
    labels: ["General", "Overwolf", "Companion App", "Technical"],
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
You're using an ad blocker, browser extension, or network filter that blocks ads.

## Fixes
- Whitelist \`*.th.gl\` in your ad blocker
- Subscribe via [Support Me](/support-me) to remove ads

## Known Browser Extensions & Settings
- AdBlock
- AdBlock Plus
- DuckDuckGo
- Malwarebytes
- uBlock Origin
- Firefox Strict Mode
- Opera Ad Blocker
- Vivaldi Trackers Blocker
- ReasonLabs
- Kaspersky Anti-Banner
- Kaspersky Internet Security
- Safer Web
- Portmaster

## Network-Wide Ad Blockers
A network-wide ad blocker may be blocking ads across your entire home network. Popular solutions include Pi-Hole and AdGuard Home.

**How to check:** Connect to the site with your phone on mobile data vs. your home WiFi. If ads only work on mobile data, your home network is blocking them.

## Still Have Issues?
In rare cases, your IP address may be blacklisted by the ad provider. Check if [this file](https://s.nitropay.com/ads-1487.js) loads. If not, ads are being blocked.
    `.trim(),
    labels: ["General", "Subscription", "Technical"],
  },
  {
    id: "why-adblock-detection",
    headline: "Why ad-blocker detection exists",
    question: "Why does TH.GL have ad-blocker detection?",
    answer: `
## The Short Answer

Ads allow TH.GL to be **100% free** with no paywalls. Every feature is available to everyone. The detection shows a **closable message** — it doesn't block you from using the site.

## Why Not Just Let Ad Blockers Do Their Thing?

I would — if they only blocked ads. But ad blockers like uBlock Origin and AdGuard actively **break website functionality**, not just ads:

### What Ad Blockers Have Done to TH.GL:
- **Corrupted supporter accounts** — uBlock injects fake data into localStorage, overwriting real subscriber data
- **Broke core features** — Peer Link, settings dialogs, and whiteboard were hidden by overly broad CSS filters
- **Crashed the site** — A uBlock filter with invalid JSON crashed the site for all uBlock users until I caught the error
- **Block privacy-friendly analytics** — Self-hosted Plausible (no cookies, no tracking, GDPR-compliant) is blocked

### Example of Active uBlock Filter:
\`\`\`
th.gl##+js(trusted-set-local-storage-item, account-storage, {...})
\`\`\`
This rule overwrites your account data — even if you're a paying supporter. [See the commit](https://github.com/uBlockOrigin/uAssets/commit/ce335b4abe490553f22dfd6e7cfb5a0811b2618c).

## What the Detection Actually Does

1. Shows a **closable message** explaining the situation
2. Links to options: whitelist, subscribe, or keep blocking
3. **Does NOT prevent you from using the site**

## My Position

- I'm fine with people blocking ads — as long as they know they're doing it
- I'm NOT fine with ad blockers breaking functionality and corrupting user data
- You should be able to make an **informed choice**

For the full story, see [Why Ad Blockers Are Breaking TH.GL](/blog/ad-blockers-breaking-websites).
    `.trim(),
    labels: ["General", "Technical"],
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
  {
    id: "overwolf-crash-dumps",
    headline: "How to get Overwolf crash dumps",
    question:
      "The Overwolf app keeps crashing. How do I collect crash dumps for debugging?",
    answer: `
If the Overwolf app is crashing repeatedly, crash dumps help us identify the root cause. Follow these steps to enable and collect them.

## Step 1: Enable Crash Dumps

1. **Download** the registry file: [enable_all_overwolf_dumps.reg](/games/thgl-web/enable_all_overwolf_dumps.reg)
2. **Double-click** the downloaded file
3. **Approve** the Windows UAC prompt and the Registry Editor confirmation
4. This tells Windows to save crash dumps whenever an Overwolf process crashes

## Step 2: Reproduce the Crash

1. Launch Overwolf and the in-game app
2. Play the game as usual until the crash occurs
3. The crash dump will be saved automatically

## Step 3: Find the Crash Dump

Open File Explorer and paste this into the address bar:

\`\`\`
%localappdata%\\Overwolf\\CrashDumps
\`\`\`

You should see \`.dmp\` files named after the crashed process (e.g., \`Palia Map.exe.12345.dmp\`).

## Step 4: Share the Crash Dump

Crash dumps are often too large for Discord (50MB+). Use a file sharing service to upload and share the link:

- [Google Drive](https://drive.google.com) (unlimited time)
- [file.io](https://www.file.io) (free up to 2 GB, deleted after one download)
- [LimeWire](https://limewire.com) (free file sharing)

Share the download link in your support ticket on Discord.

## What Does the Registry File Do?

It adds a Windows Error Reporting rule that creates mini crash dumps for Overwolf processes. This is a standard Windows feature and does not modify Overwolf or your game. You can remove it later by deleting the registry key at:

\`HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\Windows Error Reporting\\LocalDumps\\Overwolf.exe\`
    `.trim(),
    labels: ["Overwolf", "Technical"],
  },
  {
    id: "alt-hold-overlay-interaction",
    headline: "Can't interact with overlay while holding ALT",
    question:
      "Why can't I click the overlay when holding ALT in games like BPSR or Wuthering Waves?",
    answer: `
This is intentional behavior to prevent the mouse cursor from disappearing.

## What happens:

In some games (like Blue Protocol Star Resonance and Wuthering Waves), holding ALT temporarily enables mouse control for in-game UI interaction.

**The problem:**
- When you hold ALT, the game shows the mouse cursor
- If you click the overlay, Windows shifts focus away from the game
- The game detects this focus loss and **immediately hides the cursor**
- Even though you're still holding ALT, the cursor disappears and you can't interact with anything

## The solution:

While holding ALT, the overlay becomes **click-through** (non-interactive):
- You can still **see** the overlay for reference
- All clicks pass through to the game
- The game keeps focus and the cursor stays visible
- You can interact with in-game UI without issues

## To interact with the overlay:

Simply release the ALT key first. The overlay will become interactive again and you can click normally.

This ensures smooth gameplay without cursor visibility issues.
    `.trim(),
    labels: ["Companion App", "Technical"],
  },
  {
    id: "overlay-not-visible-fullscreen",
    headline: "Overlay not visible in exclusive fullscreen",
    question:
      "Why doesn't the map overlay show while my game runs in fullscreen?",
    answer: `
Windows does not allow other windows to draw on top of a game running in **exclusive fullscreen** — the same mechanism that makes your screen flash when you Alt-Tab out of a fullscreen game. This blocks the Companion App overlay and can also break Overwolf overlays.

## Fix: switch to borderless fullscreen

1. Open the game's graphics/display settings.
2. Change **Display Mode** from *Fullscreen* to *Borderless* (also called *Windowed Fullscreen*).

The game still fills the whole screen at your monitor's resolution — on most setups there is no visible difference — and the overlay shows immediately.

## Prefer to keep exclusive fullscreen?

- **2nd screen mode** — show the map on a second monitor.
- **Peer Link** — use a phone or tablet as a live minimap.

**Related:** [Performance issues](/faq/fps-drops).
    `.trim(),
    labels: ["Companion App", "Overwolf", "Technical"],
  },
  {
    id: "webview2-permission-error",
    headline: "WebView2 Runtime unavailable error",
    question:
      "I get 'Microsoft Edge WebView2 Runtime is unavailable' error. How do I fix this?",
    answer: `
This error occurs when the Companion App cannot access the WebView2 UserData folder due to incorrect permissions.

## How to fix:

1. **Close the Companion App** completely
2. **Open File Explorer** and navigate to:
   \`C:\\Users\\<YourUsername>\\AppData\\Local\\The Hidden Gaming Lair\\UserData\`

   Replace \`<YourUsername>\` with your Windows username.

3. **Right-click the UserData folder** → Properties
4. Go to the **Security** tab
5. Click **Edit** → **Add**
6. Type \`Everyone\` and click **Check Names** → OK
7. Select **Everyone** in the list
8. Check **Full Control** under Allow
9. Click **Apply** → OK
10. **Restart the Companion App**

## Still not working?

If the error persists after following these steps, please reach out via Discord at [th.gl/discord](https://th.gl/discord) for further assistance.
    `.trim(),
    labels: ["Companion App", "Technical"],
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
