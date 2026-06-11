# Self Growth — Vision

## Mission

Empower individuals to take ownership of their personal development through a private, AI-augmented desktop companion that keeps all data local and under their control.

## Why Self Growth Exists

Most personal development tools are fragmented — a habit tracker here, a journal there, a budget app elsewhere. Insights stay siloed, and the full picture of someone's growth never emerges. Cloud-first services hold your most intimate data on someone else's servers.

Self Growth unifies every dimension of personal development into a single, offline-first desktop app. Your data never leaves your machine unless you choose otherwise.

## Core Principles

1. **Privacy by default** — All data lives in a local SQLite database. Embeddings run on-device via fastembed. No account required, no telemetry, no cloud sync unless explicitly opted in.
2. **Holistic growth** — Skills, habits, goals, health, finances, learning, journaling, and routines belong together. Cross-domain insights (e.g., correlating sleep with productivity) are only possible when the data coexists.
3. **AI as coach, not crutch** — The AI layer surfaces patterns, asks questions, and suggests next steps. It does not decide for the user. Semantic search (RAG) lets users query their own history in natural language.
4. **Local-first, open ecosystem** — Built on Tauri v2 and the BWOC agent framework. Runs natively on macOS, Windows, and Linux. Integrates with a BWOC agent for optional AI capabilities while keeping the core experience fully offline.
5. **Progressive complexity** — A first-time user sees a simple dashboard and guided onboarding. Power users unlock routines, financial ledgers, health checkups, and deep semantic search as they grow into the tool.

## Product Pillars

### Self-Awareness
- **Journal** — Freeform entries with mood tracking and AI-powered reflection prompts.
- **Stories** — Narrative progress reports that weave together data from multiple domains into a coherent growth story.
- **Search (RAG)** — Semantic search across all personal data to surface forgotten insights and recurring themes.

### Discipline & Consistency
- **Habits** — Daily/weekly habit tracking with streaks, completion rates, and trend visualization.
- **Routines** — Sequenced activity blocks (morning, evening, workout) with timers and checklists.
- **Todos** — Lightweight task management tied to goals and daily planning.

### Direction & Purpose
- **Goals** — Long-term goal setting with milestones, progress tracking, and AI-suggested action plans.
- **Skills** — Skill inventory with proficiency levels, learning paths, and deliberate practice logging.
- **Learning** — Curated resources, reading lists, course tracking, and knowledge capture.

### Wellbeing
- **Health** — Daily health metrics (sleep, exercise, water, weight) with trend charts.
- **Checkups** — Periodic self-assessments for mental health, energy, stress, and life satisfaction.

### Financial Health
- **Ledger** — Income/expense tracking, receipt OCR scanning, and basic financial summaries to connect financial habits with personal goals.

### AI Coaching
- **Chat** — Conversational AI coach powered by a BWOC agent that has context from all your personal data (with your permission) to provide personalized guidance.

## North Star Metrics

- **Daily active usage** — Users open the app and log at least one data point daily.
- **Cross-domain engagement** — Users actively use 3+ feature domains (e.g., habits + journal + goals).
- **Retention at 90 days** — Users who are still actively using the app after 3 months.
- **Insight discovery** — Users find value in AI-generated reflections, stories, or semantic search results.

## Future Horizons

### Near-term
- Mobile companion (iOS/Android via Tauri) for on-the-go logging
- Data export/import (JSON, CSV) for portability
- Customizable dashboard widgets
- Goal-habit linking with automated progress inference

### Mid-term
- Optional encrypted cloud sync for multi-device usage
- Community templates for routines, habit stacks, and goal frameworks
- Plugin system for third-party integrations (Apple Health, Google Fit, Strava)
- Advanced analytics with cross-domain correlation insights

### Long-term
- Peer accountability groups with privacy-preserving data sharing
- Professional coaching integration (therapists, mentors, trainers)
- Life timeline visualization spanning years of personal data
- Predictive AI that anticipates challenges and proactively suggests interventions

## Design Philosophy

- **Calm UI** — Muted colors, generous whitespace, no gamification dark patterns. Growth is not a game to win; it is a practice to sustain.
- **Keyboard-first** — Power users can navigate and log data without touching the mouse.
- **Accessible** — WCAG 2.1 AA compliance. Screen reader support. Respects system preferences for motion, contrast, and color scheme.
- **Fast** — Native Rust backend with SQLite means sub-100ms response times for all local operations. The app should feel instant.
