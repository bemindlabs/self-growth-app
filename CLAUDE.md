# CLAUDE.md

This file provides guidance to AI assistants when working with code in this workspace.

## Project Overview

Self Growth is an AI-powered personal development desktop app built with Tauri v2. It runs locally on macOS (and other desktop platforms) with all data stored in a bundled SQLite database. Features include skills tracking, habit tracking, goal management, journaling, health metrics, learning resources, financial ledger, AI coaching chat, routines, todos, progress stories, OCR receipt scanning, and semantic search (RAG).

App identifier: `com.bemindlabs.growth.v2`

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, Recharts, react-markdown
- **Backend:** Rust (Tauri v2), rusqlite (bundled SQLite), fastembed 4 (local embeddings, desktop only), reqwest, chrono
- **Testing:** Vitest 4, @testing-library/react, Playwright
- **Package manager:** pnpm 10

## Key Commands

All commands run from `app/`:

```bash
# Install dependencies
pnpm install

# Development (starts Vite dev server + Tauri)
pnpm tauri dev

# Production build
pnpm tauri build

# Frontend-only dev server (Vite, port 1421)
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Architecture

```
app/
  src/                        # React frontend
    App.tsx                   # Route definitions (React Router 7)
    pages/                    # One file per route/feature
    components/
      layout/AppShell.tsx     # Persistent shell wrapping all routes
    api/                      # Tauri IPC wrappers (one module per feature)
      *.ts                    # invoke() calls to Rust commands
      *.test.ts               # Vitest unit tests for API layer
  src-tauri/                  # Rust backend
    src/
      lib.rs                  # Tauri builder, plugin registration, invoke_handler
      main.rs                 # Entry point — delegates to lib::run()
      commands/               # Feature-grouped Tauri command handlers
      db.rs                   # SQLite init and DbState (Mutex<Connection>)
      embedder.rs             # EmbedderState for fastembed (desktop only)
      models.rs               # Shared Rust structs with serde
      search.rs               # Semantic search / RAG logic
      bwoc.rs                 # BWOC agent transport (A2A / CLI) for AI features
      store.rs                # Settings + query helpers shared across commands
    Cargo.toml
    tauri.conf.json
```

### Pages (routes)

Dashboard, Routines, Habits, Todos, Health, Checkups, Learning, Skills, Goals, Journal, Search (RAG), Stories, Chat, Ledger, Settings, GetStarted.

### IPC pattern

The frontend calls Rust via `invoke()` from `@tauri-apps/api/core`, wrapped in typed functions inside `src/api/`. Each domain (skills, habits, goals, etc.) has its own `commands/<domain>.rs` module on the Rust side and a matching `src/api/<domain>.ts` on the frontend. Managed state is passed to commands via `tauri::State<DbState>` and `tauri::State<EmbedderState>`.

### Data persistence

SQLite database (`self-growth.db`) initialized at app startup (`db::init_db`) and stored in the platform app data directory. The `DbState` wraps the connection in a `Mutex` for safe concurrent access from async Tauri commands.

### Embeddings / RAG

`fastembed` runs locally (desktop builds only, excluded on iOS/Android via `cfg` flag). The `EmbedderState` is initialized at startup and used by `commands::rag` for semantic search across journeys, goals, and notes.

### AI features (BWOC)

AI features (coach, insights, summaries, chat, stories, OCR) address an agent in the **BWOC** fleet rather than a standalone LLM endpoint — the agent owns its own LLM backend. `bwoc.rs` implements a pluggable transport selectable in Settings:

- **A2A over HTTP** (default) — JSON-RPC `message/send` to an agent's A2A endpoint, local (`bwoc serve`) or a hosted endpoint on your fleet.
- **Local bwoc CLI** (desktop only) — shells out to `bwoc run`; compiled out (`#[cfg(desktop)]`) on mobile.

The default agent is `agent-growth-coach`. No LLM endpoint/token/model is stored by the app — only which agent to address (`bwoc_transport`, `bwoc_agent_id`, `bwoc_agent_url`).

## Versioning

Uses calendar versioning: `yyyy.m.d` (e.g., `2026.4.8`). Version is set in three files:
- `app/package.json`
- `app/src-tauri/Cargo.toml`
- `app/src-tauri/tauri.conf.json`

## Conventions

- Follow existing code style and patterns
- Write tests for new features
- Use conventional commit messages
- Keep PR scope focused

## Git Hooks

Pre-commit and pre-push hooks enforce quality gates locally. To install after cloning:

```bash
sh scripts/setup-hooks.sh
```

Hooks are stored in `.githooks/` and installed to the git hooks directory.

## Scrum Board

This project uses AI-DLC for development lifecycle management:
- Stories and tasks are stored in `.scrum/` as markdown files
- DLC phases: Plan → Develop → Test → QA → Deploy
- Agents are stored in `agents/` with profile.md and memory/
