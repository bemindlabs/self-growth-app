# Self Growth

AI-powered personal development desktop app built with Tauri v2, React 19, and Rust. Track habits, skills, routines, goals, and health — with intelligent coaching powered by local vector embeddings and the BWOC agent fleet.

**Bundle ID:** `com.bemindlabs.growth.v2`

## Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview with streaks, completion rates, active items |
| **Skills** | Track development across categories with levels |
| **Routines** | Daily/weekly routines with ordered steps and completion logs |
| **Habits** | Simple habit tracking with daily logs and colors |
| **Todos** | Task management with due dates and priorities |
| **Learning** | Course, book, article, and video tracking |
| **Goals** | Long-term goal setting with target dates |
| **Journal** | Daily journaling with mood ratings |
| **Health** | Apple Health import and Google Fit OAuth sync |
| **Checkups** | Health checkup record tracking |
| **Ledger** | Financial transaction tracking and summaries |
| **AI Coach** | Personalized advice based on your data |
| **AI Chat** | Multi-turn conversational coaching with history |
| **AI Insights** | Pattern analysis across all tracked data |
| **AI Stories** | Inspirational stories generated from your context |
| **Semantic Search** | RAG-based search using local vector embeddings |
| **Backup** | Full database export/import |
| **OCR** | Text extraction from images |

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Vite 8, Recharts, React Router 7
- **Backend:** Rust, Tauri v2, SQLite (rusqlite, WAL mode), fastembed (AllMiniLM-L6-v2)
- **UI:** shadcn/ui components, lucide-react icons
- **Testing:** Vitest, Testing Library, Playwright
- **Package Manager:** pnpm

## Quick Start

```bash
# Install dependencies
pnpm install

# Install git hooks (one-time setup)
sh scripts/setup-hooks.sh

# Development mode with hot reload
pnpm tauri dev

# Production build
pnpm tauri build
```

## Commands

```bash
pnpm install           # Install frontend dependencies
pnpm tauri dev         # Development mode (Vite + Tauri, port 1421)
pnpm tauri build       # Production build (.dmg, .exe, .AppImage)
pnpm dev               # Frontend dev server only (no Tauri)
pnpm build             # Frontend build only
pnpm test              # Run Vitest tests
pnpm test:watch        # Vitest in watch mode
```

## Architecture

```
app/
├── src/                        # React frontend
│   ├── pages/                  # 17 feature pages
│   ├── api/                    # Tauri IPC command wrappers (31 modules)
│   ├── components/
│   │   ├── layout/AppShell.tsx # Main navigation shell
│   │   └── ui/                 # Shared UI components
│   └── lib/                    # Utilities
│
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── commands/           # 19 Tauri IPC command modules
│   │   ├── bwoc.rs             # BWOC agent transport (A2A / CLI)
│   │   ├── store.rs            # Settings + query helpers (shared)
│   │   ├── db.rs               # SQLite init + migrations
│   │   ├── embedder.rs         # Local vector embeddings (fastembed)
│   │   ├── search.rs           # Cosine similarity search
│   │   ├── models.rs           # Domain models
│   │   └── lib.rs              # Tauri app setup
│   └── migrations/             # 9 SQL migration files
│
├── package.json
├── tauri.conf.json
└── vite.config.ts
```

### Tauri IPC Pattern

Frontend communicates with the Rust backend via Tauri's `invoke` function:

```typescript
// Frontend: src/api/<domain>.ts
import { invoke } from "@tauri-apps/api/core";
export async function listSkills(): Promise<Skill[]> {
  return invoke<Skill[]>("list_skills");
}
```

```rust
// Backend: src-tauri/src/commands/<domain>.rs
#[tauri::command]
pub fn list_skills(db: State<'_, DbState>) -> Result<Vec<Skill>, String> { ... }
```

### Database

SQLite with WAL mode, stored at:
- **macOS:** `~/Library/Application Support/com.bemindlabs.growth.v2/self-growth.db`
- **Linux:** `~/.local/share/self-growth/self-growth.db`
- **Windows:** `%AppData%\BemindLabs\Self Growth\self-growth.db`

### AI Integration (BWOC)

AI features address an agent in the **BWOC** fleet — the agent owns its own LLM backend, so the app stores no LLM endpoint/token/model:
- Pluggable transport in Settings: **A2A over HTTP** (local `bwoc serve` or a hosted endpoint) or the **local `bwoc` CLI** (desktop only)
- Default agent: `agent-growth-coach`
- Local vector embeddings via fastembed (AllMiniLM-L6-v2) for semantic search
- AI features: coaching, insights, weekly summaries, story generation, RAG search, OCR

## License

Proprietary — Bemind Technology Co., Ltd.
