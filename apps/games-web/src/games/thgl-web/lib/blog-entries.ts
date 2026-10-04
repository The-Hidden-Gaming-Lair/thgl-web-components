export type BlogEntry = {
  id: string;
  headline: string;
  title: string;
  description: string;
  date: string; // ISO string or "2024-05-12"
  content: string; // Markdown
  contentReference: string[];
};

export type BlogContentReference = string;

export const blogEntries: BlogEntry[] = [
  {
    id: "embed-maps-and-tooltips",
    headline: "Put TH.GL Maps and Tooltips on Your Website",
    title: "Free Embeddable Game Maps and Item Tooltips for Your Website",
    description:
      "Guide writers, bloggers and creators can now embed TH.GL interactive maps and add hover tooltips for items to their own sites. Free, no sign-up, no API key.",
    date: "2026-10-04",
    content: `
If you write guides, run a fan site or a blog, you can now put TH.GL on your own pages: **interactive maps** you can embed with one line of code, and **item tooltips** that appear when your readers hover a link.

Everything is free, also for commercial sites. No sign-up, no API key.

Copy-paste code, live demos and all options are on the [**Embeds & Tooltips**](https://www.th.gl/developers) page.

## Embed Any Map

Every map on TH.GL can be embedded: markers, tooltips, zoom and pan, without our menus or ads.

The easiest way:

1. Open the map on its game site and set it up the way you want: move to the right spot, zoom in, and turn on only the markers your readers need.
2. Open the **⋯** button in the map controls (or right-click the map) and choose **Embed this map**.
3. Copy the code into your page.

The embed starts exactly at your view and shows only the markers you had turned on. A guide about one boss or one resource route no longer has to send readers to a map full of everything else.

**Your own markers and drawings:** if you are signed in, you can also embed a custom filter with your own markers and drawings. Open **My Filters**, open the filter's menu and choose **Embed on a website**.

## Item Tooltips for Your Links

Add one line to your page:

\`\`\`html
<script async src="https://www.th.gl/tooltips.js"></script>
\`\`\`

From then on, every link to a TH.GL database page shows a tooltip with the icon, name, type, description and key stats when someone hovers it. Your links stay normal links, so readers can still click through to the full entry.

A few optional settings:

- Show the item icon in front of each link
- Color links by item rarity
- Replace the link text with the item name
- Pick a language for the tooltips

Tooltips work for every game with a TH.GL database and in every language the game site has. The script sets no cookies and does no tracking.

## The One Thing I Ask

Keep the small TH.GL link under embedded maps. It is how readers find the full map, and it is the only thing I ask in return.

Wikis like Fandom and wiki.gg don't allow outside iframes or scripts, so a plain link to the map or the database entry is the way to go there.

## Questions or Ideas?

If you use the embeds or tooltips somewhere, I'd love to see it. Questions, missing options or ideas are welcome in the [Discord](https://th.gl/discord).

— DevLeon
`.trim(),
    contentReference: [
      "embeds",
      "tooltips",
      "interactive maps",
      "game database",
      "Discord",
    ],
  },
  {
    id: "2026-update-25-new-games",
    headline: "25 New Games and What Else Changed",
    title: "TH.GL in 2026: 25 New Games, Game Databases and More",
    description:
      "It's been a while since the last post. Since then, TH.GL added interactive maps and databases for 25 new games, game databases in many languages, game stats, game requests, a service status page and embeddable maps.",
    date: "2026-10-04",
    content: `
It's been quiet on this blog for almost a year. Not because nothing happened, but because I spent the time building instead of writing.

Here's a summary of everything new on TH.GL since the last post.

## 25 New Games

TH.GL now has interactive maps, databases or tools for these games:

- [**Crimson Desert**](https://crimsondesert.th.gl)
- [**Heroes of Might & Magic: Olden Era**](https://oldenera.th.gl)
- [**Gothic 1 Remake**](https://gothic1remake.th.gl)
- [**Subnautica 2**](https://subnautica2.th.gl)
- [**Witchspire**](https://witchspire.th.gl)
- [**Neverness To Everness**](https://nte.th.gl)
- [**Heartopia**](https://heartopia.th.gl)
- [**DragonSword: Awakening**](https://dragonswordawakening.th.gl)
- [**Enshrouded**](https://enshrouded.th.gl)
- [**Star Rupture**](https://starrupture.th.gl)
- [**The Planet Crafter**](https://planetcrafter.th.gl)
- [**The Legend of Khiimori**](https://khiimori.th.gl)
- [**Soul's Remnant**](https://soulsremnant.th.gl)
- [**The Sinking City 2**](https://sinkingcity2.th.gl)
- [**Where Winds Meet**](https://wherewindsmeet.th.gl)
- [**The Blood of Dawnwalker**](https://bloodofdawnwalker.th.gl)
- [**Aniimo**](https://aniimo.th.gl)
- [**Graveyard Keeper 2**](https://graveyardkeeper2.th.gl)
- [**Delta Force**](https://deltaforce.th.gl)
- [**Welcome to Elderfield**](https://welcometoelderfield.th.gl)
- [**AION 2**](https://aion2.th.gl)
- [**Valheim**](https://valheim.th.gl)
- [**Albion Online**](https://albiononline.th.gl)
- [**The First Descendant**](https://thefirstdescendant.th.gl)
- [**Minecraft Dungeons II**](https://minecraftdungeons2.th.gl)

The full list of supported games is on the [**Gaming Apps**](https://www.th.gl/apps) page.

## Game Databases

Most games now have a **database** next to the map: items, creatures, characters, recipes and more, with stats, descriptions and where to find them. Many databases are available in the game's own languages.

From a marker on the map you can jump to its database entry, and from a database entry back to the map with **Show on map**.

## Companion App Updates

The [**Companion App**](https://www.th.gl/companion-app) keeps growing. The newest addition: a game's **database, guides and tools** now open right inside the app, with back and forward buttons and a tab back to the map. In the desktop map window, "View in Codex" links open in the app instead of your browser.

## Game Stats and Game Requests

- [**Game Stats**](https://www.th.gl/stats) shows player counts, peaks, trends, Steam reviews and recent patches for every game TH.GL supports. The numbers update every 10 minutes.
- [**Request a Game**](https://www.th.gl/requests) lets you request the game you want maps and tools for next, and vote for other requests. Votes help me pick what to build next.

## Service Status

If a map or the app doesn't load, check the [**Service Status**](https://www.th.gl/status) page first. It shows the live health of the TH.GL services and the live tracking for each game, plus any ongoing incidents.

## Maps and Tooltips for Your Website

Guide writers and creators can now embed TH.GL maps and add item tooltips to their own websites. More about that in [**this post**](https://www.th.gl/blog/embed-maps-and-tooltips).

## Thank You

All of this is possible because of the TH.GL community. If you'd like to support the project and remove ads, check out the [**Support Me**](https://www.th.gl/support-me) page. Sharing TH.GL with friends and on social media helps a lot too.

Feedback and ideas are always welcome in the [Discord](https://th.gl/discord).

— DevLeon
`.trim(),
    contentReference: [
      "interactive maps",
      "game database",
      "THGL Companion App",
      "game stats",
      "game requests",
      "service status",
      "Discord",
      "Support Me",
    ],
  },
  {
    id: "ad-blockers-breaking-websites",
    headline: "Ad Blockers Are Breaking More Than Just Ads",
    title: "Why Ad Blockers Are Breaking TH.GL (And What You Should Know)",
    description:
      "Ad blockers like uBlock Origin and AdGuard aren't just blocking ads anymore — they're breaking core website features, destroying supporter accounts, and blocking privacy-friendly analytics. Here's what's actually happening behind the scenes.",
    date: "2025-11-20",
    content: `
I don't have an issue with ad blockers in general.

Seriously — I understand why people use them. The web is full of intrusive ads, tracking scripts, and privacy nightmares. Ad blockers serve a real purpose.

But over the past few months, I've watched ad blockers evolve from "blocking ads" into something far more aggressive — and it's breaking TH.GL in ways that most users don't even realize.

This post is about transparency. I want you to understand what's happening, why it matters, and what you can do about it.

## 📖 A Bit of Context

A few weeks ago, I [made the TH.GL frontend code public](https://www.th.gl/blog/web-code-now-public) for transparency and community contributions. It felt like the right move — opening up the code so anyone could see how things work, contribute fixes, and help improve the platform.

But there's a downside to transparency: **ad blocker developers can now reverse-engineer every part of my site and write hyper-specific filters to break it**.

And that's exactly what's been happening.

## 🚨 The Real Problem

When **over 50% of users started blocking ads**, I had to make a decision.

As a solo developer who quit his job to work on TH.GL full-time, ads are a significant part of how I keep the lights on. But I also believe **everyone should have access to all features without paywalls** — that's why you can mark unlimited locations as discovered, use all map filters, and access everything for free.

So I added a **closable ad-block detection dialog**. It doesn't stop you from using the site — it just lets you know that if you'd like to support the project, you can turn off your ad blocker or [subscribe to remove ads](https://www.th.gl/support-me).

That seemed like a fair compromise.

But then the ad blockers started blocking **the message itself**.

Most users don't even know they're blocking ads anymore. They don't see the dialog. They don't know there's an alternative. The ad blocker just... hides it.

## 🛑 What Ad Blockers Are Actually Blocking

Here's what surprised me most: ad blockers aren't just blocking ads anymore.

They're also blocking:

### 1. **Privacy-Friendly Analytics**

TH.GL uses **self-hosted Plausible Analytics** (\`metrics.th.gl\`) — a privacy-focused service that:
- ✅ Doesn't use cookies
- ✅ Doesn't track individual users
- ✅ Doesn't sell data
- ✅ Is fully GDPR-compliant

I use it **only** to understand how many people visit the site and which features are most popular. That's it.

But uBlock Origin and AdGuard block it anyway.

I started questioning: **How do they decide what's "bad" and what's "good"?**

If I'm blocking a self-hosted, cookie-free analytics tool that respects privacy... what's the criteria?

### 2. **The Ad-Block Detection Message**

As mentioned, the dialog that tells users "Hey, you're blocking ads — here's an alternative" is now hidden by filters.

This means users who **would** consider supporting the project never even see the option.

### 3. **Core Website Functionality**

This is where it gets serious.

In the past few months, ad blockers have broken:

- **Peer Link** (collaborative map sharing) — completely destroyed by uBlock Origin filters
- **Client-side crashes** — caused by AdGuard overriding JavaScript objects in ways that break on updates
- **Supporter accounts** — more on this below

Here's the kicker: **the ad blocker teams didn't notice**. They write aggressive filters targeting one subdomain (like \`palworld.th.gl\`) without testing if those same filters break other TH.GL sites like \`aeternum-map.th.gl\`, \`sotf.th.gl\`, \`duneawakening.th.gl\`, etc.

It takes me **hours** to debug issues that turn out to be caused by ad blocker interference — time I'd much rather spend building features.

## 💥 The Latest Issue: Overriding Supporter Accounts

This is the most egregious example yet.

uBlock Origin added a filter that directly overwrites localStorage data ([see commit](https://github.com/uBlockOrigin/uAssets/commit/6a58c441edc0bb8b41367b7e2323e4c4eca943f7)):

\`\`\`
th.gl##+js(trusted-set-local-storage-item, account-storage, {...})
\`\`\`

**What this does**: It overwrites your account data in localStorage with fake data that sets \`"adRemoval": true\` and \`"userId": null\`.

**The problem**: If you're an **actual paying supporter**, this filter **deletes your real account information** and replaces it with fake data.

They only tested how it works for users without an account. They didn't consider that **real supporters exist** — and now those supporters' accounts aren't being recognized properly.

This isn't just blocking ads. This is **actively breaking the experience for people who financially support the project**.

**Update:** After I added validation to check that \`userId\` exists alongside \`adRemoval\`, they pivoted to hiding UI elements. Their latest filters now use overly broad selectors like:

\`\`\`css
th.gl##.fixed.border
th.gl##.hidden.relative
\`\`\`

These hide **ALL fixed positioned elements with borders** and **ALL hidden relative elements** across the entire site — breaking legitimate dialogs and features that have nothing to do with ads:

- **Settings dialog** - users can't access map settings, hotkey configuration, or preferences
- **User account dialog** - supporters can't manage their accounts or sign out
- **Peer Link dialog** - collaborative map sharing is completely broken
- **Whiteboard dialog** - drawing and collaboration tools don't appear
- **Any confirmation modals** - delete confirmations, warnings, etc. are all hidden

In their attempt to hide one message, they're now breaking core functionality that users actually need and want to use.

## 📜 The W3C Argument

When I raised these concerns with the uBlock Origin team, they responded with this quote from the [W3C Ethical Web Principles](https://www.w3.org/TR/ethical-web-principles/#render):

> "People must be able to change web pages according to their needs. For example, people should be able to install style sheets, assistive browser extensions, and blockers of unwanted content or scripts."

I don't disagree with that principle.

But here's my issue: **people aren't aware of what they're blocking**.

They think they're blocking ads and tracking cookies. They don't know they're also blocking:
- Privacy-friendly analytics
- Ad-block detection dialogs
- Core website features
- Their own supporter account data

If the principle is "people should control what they see," then shouldn't they **actually know what's being blocked**?

## 🔧 The Technical Reality

Here are examples of the kind of aggressive filters being used:

**uBlock Origin** added rules like:
\`\`\`
th.gl##+js(no-setInterval-if, /validate|verify/i)
th.gl##+js(no-setTimeout-if, /validate|verify/i)
\`\`\`

This blocks **all \`setInterval\` and \`setTimeout\` calls** that match certain patterns — across **all TH.GL subdomains**.

The result? Features that have nothing to do with ads break unexpectedly.

**AdGuard** has been more careful, but they also aren't testing across all subdomains, leading to similar issues.

You can see the TH.GL-specific filters yourself:
- [uBlock Origin filters for TH.GL (GitHub)](https://github.com/uBlockOrigin/uAssets/blob/31f5d588c4073759ce5acc52594447d0ef6171ae/filters/quick-fixes.txt#L401-L403)
- [AdGuard filters for TH.GL (GitHub)](https://github.com/AdguardTeam/AdguardFilters/blob/d6d9254d093e6bca0ea11b340c16ad939248387d/AnnoyancesFilter/Popups/sections/antiadblock.txt#L2140)

These filters are also used by **Brave Browser** and other Chromium-based browsers with built-in ad blocking.

## ⚖️ My Position

I want to be clear about where I stand:

1. **I'm fine with people blocking ads** — as long as they know they're doing it
2. **I'm fine with ad blockers existing** — they serve a purpose in a world of bad actors
3. **I'm NOT fine with**:
   - Blocking privacy-friendly analytics without user awareness
   - Hiding messages that give users informed choices
   - Breaking website functionality in the name of "blocking ads"
   - Overriding supporter account data

If you want to block ads on TH.GL, that's your choice. But you should **know what else is being blocked** — and ideally, see my message so you can make an informed decision.

## ✅ What You Can Do

If you value TH.GL and want to ensure it works properly, here's what I recommend:

### 1. **Whitelist TH.GL**

Add \`th.gl\` and all its subdomains to your ad blocker's whitelist. This ensures:
- ✅ All features work as intended
- ✅ Analytics help me understand what features to prioritize
- ✅ Ads load normally (which supports the project)
- ✅ No ad-block detection message (because you're not blocking anything)

### 2. **Customize Your Ad Blocker Filters**

Instead of relying on aggressive pre-made filter lists, consider:
- **Disabling the default filter lists** for TH.GL specifically
- **Adding your own custom filters** for specific elements you want to block
- Using browser-level content blockers that focus on **tracking and malware**, not blanket script blocking

Both uBlock Origin and AdGuard are trying to block the ad-block detection dialog and break functionality — so the issue isn't which blocker you use, it's about the aggressive filter lists they maintain.

### 3. **Support Directly**

If you want an ad-free experience **and** want to support the project, consider [subscribing](https://www.th.gl/support-me). The pricing was discussed with the community to find a fair rate, and it directly helps me keep TH.GL running without paywalls.

### 4. **Raise Awareness**

If you think ad blockers should be more transparent about what they block, consider opening issues on their GitHub repos:
- [uBlock Origin Issues](https://github.com/uBlockOrigin/uAssets/issues)
- [AdGuard Issues](https://github.com/AdguardTeam/AdguardFilters/issues)

Let them know that **blocking analytics and messages** goes beyond "blocking unwanted content."

## 🙏 Final Thoughts

I'm not writing this to guilt anyone or wage war against ad blockers.

I'm writing this because I believe in **transparency**.

You should know what's happening behind the scenes. You should know that ad blockers are breaking more than just ads. And you should be able to make an informed decision about what to block and what to allow.

If you've made it this far — thank you for reading.

If you have thoughts, feedback, or just want to chat, feel free to [join the Discord](https://th.gl/discord).

— DevLeon
`.trim(),
    contentReference: [
      "uBlock Origin",
      "AdGuard",
      "ad blockers",
      "Plausible Analytics",
      "privacy",
      "localStorage",
      "supporter accounts",
      "W3C",
      "Ethical Web Principles",
      "Brave Browser",
      "GitHub",
      "Peer Link",
      "transparency",
      "open source",
      "TH.GL",
    ],
  },
  {
    id: "duet-night-abyss-launch",
    headline: "Duet Night Abyss Interactive Maps Now Live",
    title: "Duet Night Abyss Support: Interactive Maps & Activity Tracker",
    description:
      "Explore Duet Night Abyss with detailed interactive maps for all major regions, plus a new activity tracker to manage your daily and weekly goals. Companion app support coming soon!",
    date: "2025-11-07",
    content: `
**Duet Night Abyss** has officially joined the TH.GL lineup! 🎮

Whether you're a new player exploring the world or a veteran managing your daily routine, the new maps and activity tracker are here to help you get the most out of your journey.

## 🗺️ Interactive Maps for All Major Regions

Explore every corner of Duet Night Abyss with detailed, interactive maps at [**duetnightabyss.th.gl**](https://duetnightabyss.th.gl).

**Available regions:**
- 🏝️ **Purgatorio Island**
- 🌆 **Eastern District, Icelake** (includes Glevum Pit, Icelake Sewers & Galea Theatre)
- 🏰 **Lonza Fortress**

Each map includes markers for:
- 👹 **Geniemon**
- 📦 **Chests & collectibles**
- 🪨 **Materials**
- 🧑‍🤝‍🧑 **NPCs**
- 📍 **Other exploration points**

Click any marker to track your progress, mark locations as discovered, and ensure you never miss important spots.

## 🧭 Activity Tracker: Stay on Top of Your Goals

Managing daily and weekly activities just got easier with the new **Activity Tracker**:

👉 [**duetnightabyss.th.gl/activities-tracker**](https://duetnightabyss.th.gl/activities-tracker)

This tool lets you:
- ✅ Track daily and weekly activities
- 🎯 Manage your in-game routine
- 💾 Save progress directly in your browser
- 🎨 Clean, customizable interface

It's perfect for players who want to maximize their efficiency without losing track of what's left to do.

## 📱 Coming Soon: THGL Companion App Support

Next week, I'll be adding **Duet Night Abyss support to the THGL Companion App**.

This means you'll be able to:
- 🖥️ Use overlays and second-screen modes
- 📍 Get real-time position tracking (once available)
- 🎮 Access maps and tools without leaving the game

Stay tuned for the update announcement!

## 🙏 Thank You for the Support

These updates are made possible by the amazing TH.GL community. If you'd like to support the project and unlock **Pro features** like ad removal and early access, check out the [**Support Me**](https://www.th.gl/support-me) page.

—

Enjoy exploring Duet Night Abyss — and feel free to [join the Discord](https://th.gl/discord) if you have feedback or suggestions! 🌙

— DevLeon
`.trim(),
    contentReference: [
      "Duet Night Abyss",
      "TH.GL",
      "interactive maps",
      "activity tracker",
      "Purgatorio Island",
      "Eastern District",
      "Icelake",
      "Glevum Pit",
      "Icelake Sewers",
      "Galea Theatre",
      "Lonza Fortress",
      "Geniemon",
      "THGL Companion App",
      "Discord",
      "Support Me",
    ],
  },
  {
    id: "web-code-now-public",
    headline: "The Web Code Is Now Public",
    title: "The Code Is Now Public — Here's Why",
    description:
      "After years of building TH.GL solo, the web components source code is now available on GitHub. Here's what's open, what's not, and how you can contribute — especially with AI tools like Claude Code.",
    date: "2025-10-02",
    content: `
Over the past few years, I've been asked countless times: **"How does the map work?"**, **"Can I see the code?"**, or **"How do you handle X feature?"**

Today, I'm happy to share that the answer is now: **Yes — go look for yourself!**

## 🔓 The Code Is Now Public

The **TH.GL web components** monorepo is now available on GitHub:

👉 [**github.com/The-Hidden-Gaming-Lair/thgl-web-components**](https://github.com/The-Hidden-Gaming-Lair/thgl-web-components)

This includes:
- 🌐 All game-specific **web apps** (palworld.th.gl, duneawakening.th.gl, etc.)
- 🎮 All **Overwolf apps** (in-game overlays)
- 📦 Shared **UI components** and **libraries**
- ⚙️ Build configs, CI/CD workflows, and tooling

It's the full frontend codebase — everything that powers the maps, filters, overlays, and interactive features you use every day.

## 🤔 Why Now?

I've been building TH.GL solo for years, and it's grown way beyond what I imagined.

But I've reached a point where **I can't handle all the requests and suggestions on my own anymore**.

There are dozens of feature requests, bug reports, and small improvements sitting on the [**suggestions-issues page**](https://www.th.gl/suggestions-issues) — many of which I'd love to implement, but simply don't have the time for.

By opening the code, I'm hoping the community can help out. Whether it's fixing a bug, adding a feature, improving documentation, or even translating the UI — **all contributions are welcome**.

## 📖 What's Open (and What's Not)

### ✅ What's Public:
- **thgl-web-components** — all web apps, Overwolf apps, shared UI/libraries
- Full access to the codebase, issues, pull requests, and discussions

### 🔒 What's Still Private:
- **Data mining tools** (extracting game data from files)
- **Memory reading tools** (real-time position tracking)
- **Companion app internals** (Windows desktop app)

These stay private for security, anti-cheat, and licensing reasons.

## ⚖️ The License: What You Can (and Can't) Do

The code is **source-available, but NOT open source**.

**You CAN:**
- ✅ Read and explore the code
- ✅ Submit pull requests with improvements
- ✅ Learn from the code and use it as a reference
- ✅ Report issues and suggest features

**You CANNOT:**
- ❌ Deploy your own version of TH.GL (with or without ads)
- ❌ Reuse the code for your own projects
- ❌ Fork it to build competing services

Think of it as **"view and contribute only"** — not a free-for-all.

All rights remain reserved. If you're interested in forking or licensing the code for something else, reach out to me directly.

## 🤖 Contributing with AI — It's Easier Than Ever

Here's the thing: contributing to open codebases used to require deep familiarity with the project.

But now, with **AI tools like Claude Code**, you can jump in much faster.

I've included a **[CLAUDE.md](https://github.com/The-Hidden-Gaming-Lair/thgl-web-components/blob/main/CLAUDE.md)** file in the repo that provides context for AI assistants — so if you're using Claude Code (or similar tools), it can help you:
- Understand the project structure
- Navigate the monorepo
- Suggest fixes or improvements
- Write code that matches the existing style

Even if you're not an expert in React, Next.js, or TurboRepo — AI can help bridge the gap.

**Want to try?** Check out the [**README.md**](https://github.com/The-Hidden-Gaming-Lair/thgl-web-components/blob/main/README.md), let Claude (or your AI tool of choice) read the [**CLAUDE.md**](https://github.com/The-Hidden-Gaming-Lair/thgl-web-components/blob/main/CLAUDE.md), and start exploring.

## 🛠️ A Few Technical Notes

### The Monorepo
The codebase is organized as a **TurboRepo monorepo** — each game has its own web app and Overwolf app, with shared packages for UI components and logic.

It's grown organically over the years, and honestly, **I wouldn't structure it this way if I started fresh today**. But it works, and it's what we have.

### High-Performance Maps
The maps are built on a **custom WebGL2 engine** optimized for performance — handling thousands of markers with features like:
- 🔄 **Map rotation**
- 🎯 **Perspective changes**
- ✨ **Smooth controls and interactions**

It's still experimental, but it's coming.

![Experimental Map Preview](/games/thgl-web/images/thgl-map-experimental.png)

## 💬 Where to Contribute

Not sure where to start? Here are some ideas:

1. **Check the [suggestions-issues page](https://www.th.gl/suggestions-issues)** — these are community requests pulled from Discord
2. **Improve documentation** — add comments, write guides, clarify configs
3. **Fix bugs** — test the apps and submit fixes
4. **Add translations** — help localize the UI for other languages

If you want to discuss contributions or get help, join the [**Discord**](https://th.gl/discord) — I'm active there and happy to guide new contributors.

## 🙏 Thank You

Building TH.GL has been an incredible journey, and I'm excited to see what happens now that the code is open.

If you've ever wanted to peek under the hood, contribute a feature, or just see how something works — **now's your chance**.

And if you'd like to support the project financially (and unlock Pro perks like ad removal), check out the [**Support Me**](https://www.th.gl/support-me) page.

Thanks for being part of this journey.

— DevLeon
`.trim(),
    contentReference: [
      "GitHub",
      "thgl-web-components",
      "monorepo",
      "TurboRepo",
      "Overwolf",
      "WebGL2",
      "Claude Code",
      "CLAUDE.md",
      "suggestions-issues",
      "Discord",
      "open source",
      "source-available",
      "contributions",
      "pull requests",
    ],
  },
  {
    id: "overlay-input-freeze-fix",
    headline: "Overlay Input Freeze Fix",
    title: "How We Fixed the Overlay Input Freeze in the THGL Companion App",
    description:
      "Some users reported that the THGL overlay stopped responding after a few minutes — while hotkeys still worked. After days of debugging and community testing, the cause and a permanent fix are finally here.",
    date: "2025-09-12",
    content: `
## 🧩 The Issue

After releasing the rewritten **THGL Companion App**, some users began reporting that the overlay would **stop responding to clicks** after a few minutes — even though:

- Hotkeys still worked perfectly  
- The map was still updating in real time  
- Restarting sometimes helped, but only for a few minutes

Interestingly, this problem **wasn’t universal**:  
- It happened frequently for some users while playing **Dune Awakening**  
- Others only saw it in **Palia**  
- Most players never experienced it at all

This made it *very* hard to reproduce and fix.

## 🕵️ What We Discovered

The overlay depends on low-level mouse input events from \`WM_INPUT\`.  
However, these messages are posted to the same message queue as everything else in the overlay — including rendering, UI logic, and other work.

If the overlay process gets **slightly overloaded** (for example while rendering large map updates), the message queue can start backing up.  
Once it fills up far enough, **\`WM_INPUT\` stops being dispatched entirely**, even though the rest of the app keeps running.

This explains:

- Why it happened more often in heavier games like **Dune Awakening**  
- Why it sometimes showed up in lighter games like **Palia**  
- Why it never happened at all on faster PCs  
- Why the freeze didn’t occur immediately — the backlog slowly built up

## ⚡ The Fix

The solution was to **move input handling into its own dedicated thread**.

- The input thread now receives all \`WM_INPUT\` events directly  
- It forwards them to the overlay window using \`PostMessage\`  
- This keeps input processing smooth and isolated from heavy rendering work

Since implementing this, testers have reported **no further freezes** — even after hours of use.

## 💡 Lessons Learned

- Don’t run time-critical input logic on the same thread as rendering/UI  
- \`WM_INPUT\` can silently stop arriving if the main queue is congested  
- Having a community willing to test builds is *invaluable* 🧡

## 📦 THGL Companion App Rewrite

This fix shipped as part of the larger rewrite of the [**THGL Companion App**](https://www.th.gl/companion-app):

- 🧠 No more game injection (safer, more stable)  
- 🎯 Much lower memory usage and CPU load  
- 🗺️ Support for new games like **Dune Awakening**  
- 🐛 Fixes for various issues (like missing fish locations and weekly wants)

If you’re happy with the **Overwolf** version, you can keep using it —  
but if you want the new architecture and fixes, try the Companion App!

`.trim(),
    contentReference: [
      "WM_INPUT",
      "PostMessage",
      "RegisterRawInputDevices",
      "message queue",
      "input thread",
      "THGL Companion App",
      "Dune Awakening",
      "Palia",
      "Overwolf",
    ],
  },
  {
    id: "soulframe-grounded2-subreddit-update",
    headline: "Soulframe Maps, Grounded 2 Preview & New Subreddit",
    title:
      "Soulframe Support, Grounded 2 Preview Release, and a Quick Summer Heads-Up",
    description:
      "Soulframe interactive maps are now live on TH.GL! Grounded 2 enters preview for Elite Supporters, plus a new subreddit is now open for updates and discussion. Also: I’m taking a short summer break.",
    date: "2025-07-01",
    content: `
**The Hidden Gaming Lair** is expanding again — with a new game, a preview launch, a community update, and a quick summer break heads-up.

## 🌿 Soulframe Interactive Map Now Live

Soulframe has joined the lineup of supported games on TH.GL!

You can now explore a beautiful, interactive map at [**soulframe.th.gl**](https://soulframe.th.gl).  
If you're jumping into the game or just curious about the world, this is a great way to start getting familiar with the map and layout.

Expect more features over time as the game evolves!

> ![Soulframe Map](/games/thgl-web/images/soulframe-map-preview.jpg)

## 🐞 Grounded 2 — Early Preview Release

A brand-new game is in development: **Grounded 2**!  
It’s still early in development, but **Elite Supporters** now have access to a **preview version**.

🔒 If you’re in that group, check the private \`#preview-access\` channel on Discord for the link and details.

> Feedback is welcome — just know that things are still in progress and subject to change!

## 💬 New Subreddit for Updates & Community

I’ve launched a new subreddit to help share updates and encourage discussion outside of Discord:

👉 [**r/TheHiddenGamingLair**](https://www.reddit.com/r/TheHiddenGamingLair/)

I'll be cross-posting updates there regularly — so if you prefer Reddit or want to stay in the loop outside of Discord, give it a follow and join the conversation!

## 🌴 Summer Break Notice

I’ll be on vacation until the **end of August** and will be **partially available** during that time.

Here’s what to expect:
- 🛠️ I’ll fix **critical issues** if they come up
- 🧪 I plan to continue working on **Grounded 2** during a few open days
- 🚫 No major new features will ship until I’m back fully

Thanks so much for your ongoing support and patience — it really means a lot.

If you’d like to support the project, unlock early features, or go ad-free, check out the [**Support Me**](https://www.th.gl/support-me) page.

—

Enjoy the summer (or winter, depending where you are) — and happy exploring! 🌍  
— DevLeon
`.trim(),
    contentReference: [
      "Soulframe",
      "TH.GL",
      "Grounded 2",
      "Elite Supporters",
      "r/TheHiddenGamingLair",
      "Reddit",
      "Discord",
      "preview access",
      "summer break",
      "Support Me",
    ],
  },
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

> ![Discovered Marker](/games/thgl-web/images/dune-marker-dialog.webp)

## 👥 Built for Groups and Guilds

The maps aren’t just for solo play.  
For group coordination and guild planning, you’ll find:

- **Shared filters**  
  Draw paths, place custom markers, and share them with others.
- **Whiteboard mode**  
  Perfect for live strategy planning and PvP coordination.

> ![Add Drawing](/games/thgl-web/images/dune-drawing-dialog.webp)

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
    contentReference: [
      "Dune Awakening",
      "Hagga Basin",
      "Arrakeen",
      "Harko Village",
      "The Deep Desert",
      "xREALM",
      "private servers",
      "dune.gaming.tools",
      "guild planning",
      "whiteboard mode",
      "PvP coordination",
    ],
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
  
  > ![Elderwood Expansion Screenshot](/games/thgl-web/images/palia-elderwood.webp)
  
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
    contentReference: [
      "Palia",
      "Elderwood",
      "Elderwood Expansion",
      "Ogopuu",
      "Shmole",
      "Rockhopper",
      "Overwolf",
      "TH.GL Companion App",
      "weekly wants",
      "star level tracking",
      "Patreon",
    ],
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

![Palworld Overlay](/games/thgl-web/images/overlay-palworld.webp)

### What’s Inside the Companion App

The TH.GL Companion App offers:
- Overlay + second-screen toggle
- Real-time player tracking
- Support for multiple games, including **Palworld**, **Once Human**, **Infinity Nikki**, and more

All without needing to install or run Overwolf.

![App Launcher](/games/thgl-web/images/app-launcher.webp)

### The Benefits

By moving away from Overwolf, I can:
- Push updates and support new games much faster
- Avoid waiting for platform fixes
- Deliver a smoother experience with fewer restrictions
- Keep everything lightweight and performance-focused

Plus, it’s been a great learning experience — diving into DX injection, overlay rendering, and everything required to build an app like this from scratch.

### How’s It Going?

The Companion App is still new, but I’ve already seen **hundreds of daily users**, even with a soft launch. It’s far from done, but the core functionality is solid, and I’m updating it regularly based on feedback.

![Second Screen Mode](/games/thgl-web/images/second-screen.webp)

### Try It Yourself

Want to try it?

[👉 Download the TH.GL Companion App](/companion-app)

And if you’d like to support development or remove ads, check out [Support Me](/support-me).

Thanks for reading — and stay tuned for what's next!
      `.trim(),
    contentReference: [
      "TH.GL Companion App",
      "Overwolf",
      "Trophy Hunter",
      "League of Legends",
      "New World",
      "Palworld",
      "Once Human",
      "Infinity Nikki",
      "DX injection",
      "overlay rendering",
      "second-screen",
    ],
  },
];

import { normalizeTags } from "./blog-tag-mapping";

export const allBlogContentReferences: BlogContentReference[] = Array.from(
  new Set(
    blogEntries.flatMap((entry) => normalizeTags(entry.contentReference)),
  ),
).sort((a, b) => a.localeCompare(b));
