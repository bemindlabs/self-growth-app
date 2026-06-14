# Changelog

All notable changes to Self Growth will be documented in this file.

## [2026.6.14] - 2026-06-14

### Added

- **Thai language (ไทย)** with an in-app language switcher in Settings (i18next).
- **New app icon** — a sprout / growth motif on the indigo→purple brand gradient — across desktop, iOS, Android, and web.
- **iOS launch / splash screen** (sprout + "Self Growth" + "powered by BWOC"), held ~3s.

### Changed / Fixed

- iOS **safe-area insets** now respected (notch / Dynamic Island / home indicator) via `viewport-fit=cover`.
- iOS **webview zoom disabled** (pinch, input-focus auto-zoom, double-tap).
- Settings **"Test Connection"** persists the form values first — fixes a false "No agent URL configured" when the URL field was filled.
- Committed the regenerated **iOS/Android project** (signing, launch screen, app icons) to the repo so mobile builds reproduce from a clean clone.
- Docs (README / CLAUDE / VISION) updated for the BWOC migration.

## [2026.6.11] - 2026-06-11

### Changed

- **Replaced the OpenClaw LLM gateway with the BWOC agent fleet.** AI features
  (coach, insights, summaries, chat, stories, OCR) now address a BWOC agent
  instead of an OpenAI-compatible LLM endpoint. The agent owns its own LLM
  backend, so the app no longer stores an LLM endpoint/token/model.
- AI connection is now a pluggable **BWOC transport**, selectable in Settings:
  - **A2A over HTTP** (default) — JSON-RPC `message/send` to an agent's A2A
    endpoint, local (`bwoc serve`) or a hosted endpoint on your fleet (reach a
    gateway-hosted agent without running your own server).
  - **Local bwoc CLI** (desktop only) — runs `bwoc run` against your workspace.
  - **Gateway relay** — placeholder for the native WS signed-envelope transport.
- Settings UI reworked: "LLM Connection" → "BWOC Agent" (transport, agent id,
  agent URL, workspace). Get Started / FAQ / privacy / terms copy updated to BWOC.
- On mobile (iOS/Android) only the A2A transport is offered; the CLI transport is
  compiled out and hidden in the UI.

### Added

- BWOC coach agent `agent-growth-coach` (Ollama `gemma3:27b` backend, vision-capable for OCR).
- Migration `009_bwoc_migration`: drops legacy `llm_endpoint`/`llm_token` settings
  and seeds BWOC defaults (`bwoc_transport=a2a`, `bwoc_agent_id=agent-growth-coach`).

### Removed

- OpenClaw gateway client (`gateway.rs`), `LLM_MODEL`, and the `llm_endpoint`/`llm_token` settings.

## [2026.4.8] - 2026-04-08

First public release.

### Added

- Dashboard with streaks, completion rates, and AI quick coach
- Daily habit tracking with color-coded streaks
- Goal setting with milestones and status tracking
- Routines with ordered steps and timer
- Todo management with priorities and due dates
- Reflective journaling with mood ratings
- Skills inventory with proficiency levels
- Learning resource tracker (courses, books, articles, videos)
- AI coaching chat with multi-turn conversations
- AI-generated progress stories
- Semantic search (RAG) with local embeddings (AllMiniLM-L6-v2)
- Apple Health XML import and Google Fit OAuth sync
- Health checkup tracking
- Financial ledger with OCR receipt scanning
- Database backup and restore
- Settings page with LLM endpoint configuration
- Onboarding guide (Get Started page)
- CI workflow (TypeScript, Vitest, Vite build, Cargo check, Clippy)
- Release workflow (quality gate, macOS build, GitHub release)
- Pre-commit hook (type check + tests)
- Pre-push hook (type check + tests + build + cargo check)
- Homebrew cask (`brew tap bemindlabs/self-growth`)

### Technical

- Tauri v2 with Rust backend and React 19 frontend
- SQLite database with WAL mode and 7 migrations
- Local vector embeddings via fastembed (desktop only)
- OpenClaw LLM gateway integration
- Calendar versioning (yyyy.m.d)
