# The Hidden Gaming Lair — Web Components

This is the multi-app frontend monorepo for [The Hidden Gaming Lair](https://www.th.gl), containing apps, websites, and shared UI components.

## ⚠️ License & Usage

This project is not open source.
You are not permitted to use or repurpose this code for your own projects.

All rights reserved © The Hidden Gaming Lair.

## 🎮 What is The Hidden Gaming Lair?

The Hidden Gaming Lair (TH.GL) is a comprehensive gaming companion platform providing **interactive maps**, **in-game overlays**, and **real-time tracking tools** for 20+ popular games.

### Core Features

**📍 Interactive Maps**

- Comprehensive location databases for collectibles, resources, NPCs, and more
- Advanced filtering system with custom categories per game
- Progress tracking: mark locations as discovered (unlimited, completely free)
- Custom markers, routes, and drawings that can be shared with friends/guilds
- Real-time actor tracking (monsters, animals, NPCs) when supported by the game

**🖥️ Companion App (Windows)**

- Standalone desktop application (~7MB) - no additional platform required
- **In-game overlays**: DirectX injection for seamless map access without alt-tabbing
- **Second screen mode**: Use a separate display for full map view with one hotkey
- **Peer Link**: Sync your position with any device (phone, tablet) as a live minimap
- **Live mode**: Real-time position tracking and nearby actor detection
- Customizable hotkeys for all functions
- Automatic updates and game detection
- Privacy-focused: runs locally, no account required

**🌐 Web-Based Tools**

- Full interactive maps accessible from any device/browser
- No download required - works on Windows, Mac, Linux, mobile
- Progress syncs across devices (browser storage)
- All map features available (except overlay and live tracking)

**🎮 Overwolf Apps**

- Alternative in-game overlay platform for supported games
- Available on Overwolf app store
- Both platforms supported and maintained

### Supported Games

Currently supporting 20+ games including:

- **Companion App** (10+ games): Palworld, Dune Awakening, Once Human, Wuthering Waves, Palia, Blue Protocol: Star Resonance, Duet Night Abyss, RuneScape: Dragonwilds, and more
- **Overwolf Apps**: Palia, Palworld, Once Human, Wuthering Waves, Diablo 4, New World, Avowed, Satisfactory, Hogwarts Legacy, Sons of the Forest, and more
- **Web Maps**: All 20+ games with full interactive features

### Why TH.GL?

- ✅ **Free to use** - Ad-supported with optional Patreon subscription for ad-free experience
- ✅ **Unlimited discoveries** - Mark locations with no limits or paywalls
- ✅ **Privacy-focused** - Local execution, no account required, anonymous analytics
- ✅ **Officially approved** - Confirmed safe by developers of Dune Awakening, Once Human, and Palia
- ✅ **Multiple platforms** - Companion App, Overwolf, or browser-based
- ✅ **Community-driven** - Open to contributions, feature requests via Discord

### How It Works

**For Players:**

1. Visit game-specific website (e.g., palworld.th.gl) for browser-based maps
2. OR download TH.GL Companion App for overlays and live tracking
3. OR install Overwolf app for alternative overlay experience

**Technical Implementation:**

- Web apps serve interactive WebGL2-based maps with real-time data
- Companion app reads game memory for position tracking (read-only, no modifications)
- Memory addresses discovered through reverse engineering per game
- APIs provide location data, filters, and real-time actor positions
- WebView2 renders UI in both browser and desktop app

Visit [www.th.gl/companion-app](https://www.th.gl/companion-app) for more details.

## 🧩 Related Repositories

This repo is part of a larger ecosystem of tools and services powering The Hidden Gaming Lair. Some of these repositories are private and not open source:

| Repository                                                                             | Description                                                                                 |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [`thgl-actors-api`](https://github.com/The-Hidden-Gaming-Lair/thgl-actors-api)         | API for in-game location tracking with seed-aware storage and filters.                      |
| [`thgl-data-forge`](https://github.com/The-Hidden-Gaming-Lair/thgl-data-forge)         | Data mining and API project for serving static game data (locations, filters, icons, etc.). |
| [`thgl-api-forge`](https://github.com/The-Hidden-Gaming-Lair/thgl-api-forge)           | Dynamic API + database layer (starting with comments, more to come).                        |
| [`thgl-memory-access`](https://github.com/The-Hidden-Gaming-Lair/thgl-memory-access)   | Game-specific memory reading projects for real-time data extraction.                        |
| [`thgl-companion-app`](https://github.com/The-Hidden-Gaming-Lair/thgl-companion-app)   | Windows companion app with in-game overlay and position tracking.                           |
| [`thgl-discord-bot`](https://github.com/The-Hidden-Gaming-Lair/thgl-discord-bot)       | Discord bot exposing update & info channels via API (used for release notes on apps/web).   |
| [`thgl-web-components`](https://github.com/The-Hidden-Gaming-Lair/thgl-web-components) | Multi-app frontend monorepo containing apps, websites, and shared UI components.            |

## 🧱 Tech Stack

- **Monorepo:** TurboRepo
- **Runtime & Package Manager:** [Bun](https://bun.sh/)
- **Frameworks:** Next.js / Vite (React-based)
- **Languages:** TypeScript
- **Shared packages:** in `packages/ui` (UI components), `packages/lib` (utilities, logic)

## 🤝 Contributing

- Run and explore any app (`bunx turbo run dev --filter=...`)
- Follow the code style and structure already in use
- PRs welcome — especially UI tweaks, content improvements, or bugfixes
- **Using Claude Code?** See `CLAUDE.md` for AI-specific development guidance

## 🚀 Getting Started

### ✅ Prerequisites

- **OS:** Windows recommended (Overwolf SDK support). WSL should work too.
- **Bun:** [Install Bun](https://bun.sh/)
- **VSCode + Extensions:**  
  Use the recommended extensions in `.vscode/extensions.json`, especially:
  - `esbenp.prettier-vscode`
  - `dbaeumer.vscode-eslint`

### 📦 Install Dependencies

```bash
bun install
```

### ▶️ Run a Project

To start a specific app (e.g. `dune-awakening-web`):

```bash
bunx turbo run dev --filter=dune-awakening-web...
```

> You can swap the app name to run a different project.

### 🌱 Environment Variables

Most apps **do not** require any `.env` setup.
Only `thgl-web` and `thgl-app` use environment variables (API access, database, etc.).

## 🗂️ Repository Structure

```
apps/
  ├─ game-name-web/         # Public website (e.g., duneawakening.th.gl)
  ├─ game-name-overwolf/    # Overwolf in-game app
  ├─ thgl-web/              # Main www.th.gl site (blog, portfolio, etc.)
  └─ thgl-app/              # Windows companion app (desktop overlay + tracking)

packages/
  ├─ ui/                    # Shared UI components (React)
  └─ lib/                   # Shared logic, utilities, types
```

Each app contains a `src/config.ts` file for routing and game-specific setup.

## ✍️ Code Style

- **Format:** Prettier (`Format on Save` recommended)
- **Linting:** ESLint
- **Language:** TypeScript only
- **Testing:** None (rely on TS, lint, and formatting)

> Follow the style and patterns used in the existing codebase.

## 🔒 Git & Branching Rules

- **Do not push to `main` directly.**
- Create a **Pull Request** for all contributions.
- Only the repo owner can merge into `main`.

## 📦 Deployment

| Type          | How it works                                                                                                                                                                                                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Websites      | `games-web` multi-tenant **Bunny Magic Container**, redeployed on change (`games-web-deploy.yml`)                                                                                                                                                                                                                                 |
| Overwolf Apps | Released on a `manifest.json` version change: `bun run bump fix` (or `minor`/`major`, optionally one app: `bun run bump fix palia`), commit as `Bump version`, push. Each `<game>-preview.yml` then builds, uploads to the preview channel and promotes to production. Code changes alone do NOT ship to the apps until you bump. |

## 🧠 Need Help?

Ask in coding channels on my Discord: <https://th.gl/discord>

Open issues and suggestions in #suggestions-issues channel
