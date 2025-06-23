export type BlogEntry = {
  id: string;
  headline: string;
  title: string;
  description: string;
  date: string; // ISO string or "2024-05-12"
  content: string; // Markdown
};

export const blogEntries: BlogEntry[] = [
  {
    id: "dune-awakening-map-release",
    headline: "Dune Awakening Maps Are Live",
    title: "Dune Awakening Interact Maps Now Available on TH.GL",
    description:
      "Explore Hagga Basin, Arrakeen, Harko Village, and The Deep Desert with detailed interactive maps for Dune: Awakening. Solo tools, group strategy, and private servers included.",
    date: "2025-06-04",
    content: `
**Dune: Awakening** is about to launch — and TH.GL is ready.  
Starting today, you can explore detailed, interactive maps for this ambitious new survival MMO.

## 🗺️ Fully Interactive Maps for Dune Awakening

Whether you're a solo explorer or part of a guild, [**duneawakening.th.gl**](https://duneawakening.th.gl) now offers full coverage for:

- 🏜️ **Hagga Basin**
- 🏙️ **Arrakeen**
- 🏚️ **Harko Village**
- 🌵 **The Deep Desert**

Each map includes markers for:
- 📍 Trainers
- 📦 Items
- 🧑‍🤝‍🧑 NPCs
- 🪨 Resources

Click to track progress, mark locations as discovered, and make sure you never miss a key spot on Arrakis.

> ![Discovered Marker](/images/dune-marker-dialog.webp)

## 👥 Built for Groups and Guilds

The maps aren’t just for solo play.  
For group coordination and guild planning, you’ll find:

- **Shared filters**  
  Draw paths, place custom markers, and share them with others.
- **Whiteboard mode**  
  Perfect for live strategy planning and PvP coordination.

> ![Add Drawing](/images/dune-drawing-dialog.webp)

## 🛠️ Private Servers Are Live

Want to explore Arrakis with friends or set up your own RP or PvP events?  
[**Private servers**](https://duneawakening.th.gl/private-servers) are available — powered by [**xREALM**](https://xrealm.com) and integrated into TH.GL.  

## 📚 Need More Info?

For a detailed **item and recipe database**, check out [**dune.gaming.tools**](https://dune.gaming.tools/) — a fantastic resource built by a fellow developer.

## 🗓️ Launch Timeline

- 🎮 **Pre-release:** June 5, 2025  
- 🚀 **Full release:** June 10, 2025  

I'm actively updating the maps as more player data comes in — expect more features and refinements after launch.

## 🔧 Feedback + Support

If you run into bugs, have suggestions, or want to connect with other players, feel free to [join the Discord](https://th.gl/discord).

And if you'd like to support the project and unlock Pro perks (like ad removal and early access features), check out the [Support Me](https://www.th.gl/support-me) page.

—

Thanks for exploring Arrakis with me — and enjoy the dunes! 🐛  
— DevLeon
`.trim(),
  },
  {
    id: "palia-elderwood-expansion",
    headline: "Palia Elderwood Expansion",
    title: "Explore the Elderwood: Palia Expansion + Companion App Update",
    description:
      "Palia just expanded! The new Elderwood region is now live on palia.th.gl, the Overwolf app, and the TH.GL Companion App. Here's everything you need to know.",
    date: "2025-05-16",
    content: `
  Palia just received a [major update](https://palia.com/news/patch-191) — **The Elderwood Expansion** — and TH.GL is already updated to match!
  
  ## 🗺️ Elderwood Region Now Available
  
  The newly unlocked **Elderwood** area is now included on [palia.th.gl](https://palia.th.gl) and both the Overwolf and Companion App versions of the map.
  
  You’ll find **new creature filters**, including:
  
  - 🐸 **Ogopuu**  
  - 🐿️ **Shmole**  
  - 🪨 **Rockhopper**
  
  *Spawn locations will continue to be updated over the next few days as player data rolls in.*
  
  > ![Elderwood Expansion Screenshot](/images/palia-elderwood.webp)
  
  ## 🖥️ Overwolf App Updated to v4.1.0
  
  The Overwolf app is now at **version 4.1.0**, adding **position tracking support for the new region**.
  
  If you're using the in-game app, make sure you've updated to get full tracking coverage inside Elderwood.
  
  ## 💻 Companion App Now Supports Palia
  
  The [**TH.GL Companion App**](https://www.th.gl/companion-app) now supports Palia!
  
  This standalone app is an alternative to Overwolf with a more lightweight and privacy-friendly setup:
  
  - ✅ No Overwolf required  
  - ✅ Runs faster and uses fewer resources  
  - ✅ Includes real-time overlays and second-screen support  
  - ✅ Cross-game support with shared features
  
  A few features like **weekly wants** and **star level tracking** are still in the works, but are coming soon.
  
  ## 🙌 Thank You for the Support
  
  These updates wouldn’t be possible without the amazing community supporting TH.GL.  
  If you'd like to help out and unlock **Pro features** (like ad removal and early access), you can support me on [Patreon](https://www.th.gl/support-me).
  
  Also, don't forget to link your account on the [account page](https://www.th.gl/support-me/account) to activate your perks!
  
  —
  
  Thanks for reading, and enjoy exploring the Elderwood 🌲  
  Feel free to join [the Discord](https://th.gl/discord) if you run into issues or just want to chat.
  
  — DevLeon
    `.trim(),
  },
  {
    id: "why-i-built-companion-app",
    headline: "Standalone Companion App",
    date: "2025-05-07",
    title: "Why I Created a Standalone Companion App After 10+ Overwolf Apps",
    description:
      "After years of developing Overwolf apps, I built the TH.GL Companion App to be lighter, faster, and more flexible — with overlays, live maps, and tracking tools outside of Overwolf.",
    content: `
In 2016, I built my first Overwolf app during the **League of Legends Overwolf Dev Challenge** — and won it with *Trophy Hunter*, an achievement tracker for LoL. That experience kicked off my journey into building tools for gamers.

Since then, I’ve developed more than 10 Overwolf apps for games like **New World**, **Palworld**, **Once Human**, **Infinity Nikki**, and many others.

But in 2025, I launched something entirely new: the **TH.GL Companion App** — a standalone application, independent from Overwolf.

### Overwolf Was a Great Start

Overwolf gave me the tools I needed:
- A strong API for overlays, hotkeys, and in-game data
- Automatic updates and app store visibility
- A way to focus on app development, not deployment infrastructure

It worked well for many years, especially while I was building these tools alongside a full-time job.

### Why I Built My Own

Over time, I began hearing requests for a more lightweight solution. Some users wanted a version of the tools **without extra background services**, installations, or performance overhead.

There were also challenges on the development side. Occasionally, I had to delay updates because of Overwolf platform issues like:
- Missing support for certain games or DX versions
- Crashes and performance issues that weren’t under my control

Eventually, I decided I wanted to try building my own system — one that would give me more control, flexibility, and fewer dependencies.

![Palworld Overlay](/images/overlay-palworld.webp)

### What’s Inside the Companion App

The TH.GL Companion App offers:
- Overlay + second-screen toggle
- Real-time player tracking
- Support for multiple games, including **Palworld**, **Once Human**, **Infinity Nikki**, and more

All without needing to install or run Overwolf.

![App Launcher](/images/app-launcher.webp)

### The Benefits

By moving away from Overwolf, I can:
- Push updates and support new games much faster
- Avoid waiting for platform fixes
- Deliver a smoother experience with fewer restrictions
- Keep everything lightweight and performance-focused

Plus, it’s been a great learning experience — diving into DX injection, overlay rendering, and everything required to build an app like this from scratch.

### How’s It Going?

The Companion App is still new, but I’ve already seen **hundreds of daily users**, even with a soft launch. It’s far from done, but the core functionality is solid, and I’m updating it regularly based on feedback.

![Second Screen Mode](/images/second-screen.webp)

### Try It Yourself

Want to try it?

[👉 Download the TH.GL Companion App](/companion-app)

And if you’d like to support development or remove ads, check out [Support Me](/support-me).

Thanks for reading — and stay tuned for what’s next!
      `.trim(),
  },
];
