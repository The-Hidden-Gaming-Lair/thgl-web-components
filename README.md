# The Hidden Gaming Lair — Web Components

This is the multi-app frontend monorepo for [The Hidden Gaming Lair](https://www.th.gl), containing apps, websites, and shared UI components.

## ⚠️ License & Usage

This project is not open source.
You are not permitted to use or repurpose this code for your own projects.

All rights reserved © The Hidden Gaming Lair.

## 🧩 Related Repositories

This repo is part of a larger ecosystem of tools and services powering The Hidden Gaming Lair. Some of these repositories are private and not open source:

| Repository                                                                            | Description                                                                                 |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [`thgl-data-forge`](https://github.com/The-Hidden-Gaming-Lair/thgl-data-forge)        | Data mining and API project for serving static game data (locations, filters, icons, etc.). |
| [`thgl-api-forge`](https://github.com/The-Hidden-Gaming-Lair/thgl-api-forge)          | Dynamic API + database layer (starting with comments, more to come).                        |
| [`thgl-memory-access`](https://github.com/The-Hidden-Gaming-Lair/thgl-memory-access)  | Game-specific memory reading projects for real-time data extraction.                        |
| [`thgl-companion-app`](https://github.com/The-Hidden-Gaming-Lair/thgl-companion-app)  | Windows companion app with in-game overlay and position tracking.                           |
| [`thgl-discord-bot`](https://github.com/The-Hidden-Gaming-Lair/thgl-discord-bot)      | Discord bot exposing update & info channels via API (used for release notes on apps/web).   |
| [`thgl-web-components`](https://github.com/The-Hidden-Gaming-Lair/thgl-companion-app) | Multi-app frontend monorepo containing apps, websites, and shared UI components.            |

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

services/
  └─ actors-api/           # API for in-game location tracking (used by Overwolf apps)
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

| Type          | How it works                                   |
| ------------- | ---------------------------------------------- |
| Websites      | Automatically deployed to **Vercel** on change |
| Overwolf Apps | Must be manually updated (via `manifest.json`) |

## 🧠 Need Help?

Ask in coding channels on my Discord: <https://th.gl/discord>

Open issues and suggestions in #suggestions-issues channel
