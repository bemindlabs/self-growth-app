import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import Markdown from "@/components/ui/Markdown";

interface Section {
  id: string;
  title: string;
  content: string;
}

const sections: Section[] = [
  {
    id: "vision",
    title: "Our Vision",
    content: `
### The Self Growth Philosophy

We believe that **true personal growth happens at the intersection of mind, body, and purpose**. Most people track their habits in one app, their fitness in another, and their goals on sticky notes. Self Growth brings it all together — giving you a unified, private, AI-powered platform to see how every part of your life connects.

### Why We Built This

Self-development is not a single metric. It's the compound effect of daily habits, consistent routines, deliberate learning, physical health, and intentional reflection. Self Growth was designed to:

- **Connect the dots** — See how your sleep affects your productivity, how your routines drive your skill growth, and how your habits compound toward your goals
- **Coach with context** — AI coaching that knows your actual data — not generic advice, but guidance grounded in your real progress, health metrics, and patterns
- **Keep you in control** — Your data stays on your device. No cloud accounts, no subscriptions for basic features, no selling your personal growth data
- **Grow with you** — From tracking your first habit to analyzing months of health data alongside skill development, the app scales with your journey

### The Bigger Picture

Self Growth is more than a tracker. It's a **personal growth operating system** that:

1. **Captures** — Goals, habits, routines, skills, learning, health, finances, and reflections in one place
2. **Connects** — Health data from Apple Health and Google Fit flows into the same system as your goals and habits
3. **Understands** — AI-powered semantic search and coaching sees patterns across all your data
4. **Guides** — Personalized insights and coaching adapt to your actual progress, not theoretical advice

### Our Commitment

- **Privacy first** — Local-first architecture. Your growth journey is yours alone
- **Open integration** — Apple Health, Google Fit, and the BWOC agent fleet — connect your existing tools
- **Holistic view** — Mind and body together, because you can't separate physical health from personal development
- **Actionable AI** — Every AI insight references your real data and suggests concrete next steps
`,
  },
  {
    id: "welcome",
    title: "Welcome to Self Growth",
    content: `
Self Growth is a self-development tracking desktop app that helps you build better habits, track your learning, set goals, monitor your health, and get AI-powered coaching — all stored locally on your device.

### What you can do

- **Set Goals** — Define goals with target dates and track progress
- **Develop Habits** — Simple yes/no daily habit tracking with streaks
- **Build Routines** — Create daily/weekly routines with steps and mood tracking
- **Monitor Health** — Import Apple Health data or sync Google Fit for steps, heart rate, sleep, weight, calories, and workouts
- **Track Skills** — Monitor your skill levels across categories
- **Manage Learning** — Track courses, books, articles, and practice
- **Journal** — Write daily reflections with mood ratings
- **Ledger** — Track income and expenses for self-development investments (courses, books, coaching, subscriptions)
- **Todos** — Task management with priorities, due dates, and goal linking
- **AI Coach** — Get personalized advice based on your real data, including health metrics
- **AI Chat** — Multi-turn conversation with your AI coach
- **Smart Search** — Semantic search across all your data, including health summaries
- **Story Lab** — Generate and save inspirational stories from your progress
`,
  },
  {
    id: "setup",
    title: "Setup Guide",
    content: `
### Step 1: Install the App

Download and install Self Growth for your platform. The app runs as a native desktop application.

### Step 2: Connect a BWOC Agent

Self Growth uses an agent in your **BWOC fleet** for AI features (coaching, insights, chat, stories, OCR). The agent owns its own LLM backend — the app only needs to know how to reach it.

1. Go to **Settings** in the app
2. Choose a **Transport**:
   - **A2A over HTTP** — point the **Agent URL** at the agent's A2A endpoint. This can be a local \`bwoc serve\` or a hosted endpoint on your fleet, so you can reach a gateway-hosted agent without running your own server.
   - **Local bwoc CLI** — runs \`bwoc\` on this machine against your workspace.
3. Set the **Agent ID** (default \`agent-growth-coach\`)
4. Click **Test Connection** to verify

> If you don't connect a BWOC agent, the app still works for tracking skills, routines, habits, goals, and journal — just without AI features.

### Step 3: Start Tracking

1. **Set a goal** — Go to Goals and define what you want to achieve
2. **Add a habit** — Go to Habits and create a simple daily habit
3. **Create a routine** — Go to Routines and set up a daily routine
4. **Import health data** — Go to Health and import your Apple Health export or connect Google Fit
5. **Add a skill** — Go to Skills and add something you want to develop
6. **Start learning** — Go to Learning and add a course, book, or article
7. **Track spending** — Go to Ledger and log your self-development investments
8. **Add todos** — Go to Todos and create tasks linked to your goals
9. **Write in your journal** — Go to Journal and write your first entry

### Step 4: Connect Health Data

Self Growth integrates with Apple Health and Google Fit to bring your health metrics into your self-development journey.

**Apple Health:**
1. On your iPhone, open the **Health** app
2. Tap your profile → **Export All Health Data**
3. Transfer the \`export.xml\` file to your computer
4. In Self Growth, go to **Health** → **Import XML Export**

**Google Fit:**
1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Fitness API**
3. Create OAuth 2.0 credentials (Desktop app type)
4. In Self Growth, go to **Settings** → enter your Client ID and Client Secret
5. Go to **Health** → **Connect** → authenticate in your browser → paste the code

### Step 5: Use AI Features

Once your BWOC agent is connected:
- Ask the **AI Coach** questions on your Dashboard — it now includes your health data
- Generate **Insights** to see patterns across habits, goals, and health
- Get a **Weekly Summary** of your progress
- Open **Chat** for a deeper conversation
- Generate **Stories** inspired by your journey
`,
  },
  {
    id: "howto",
    title: "How To Use",
    content: `
### Dashboard
Your home screen. Shows stats (streak, completions, routines, learning items, skills, goals) and quick access to AI Coach, Insights, and Weekly Summary.

### Goals
Set goals with descriptions and target dates. Update status as you make progress. Goals give direction to everything else you track.

### Habits
Simple daily tracking. Click the circles to mark a habit as done for each day. The app tracks your streak automatically.

### Routines
Create structured routines with multiple steps. Log completions with mood ratings. Great for morning routines, workout schedules, or study sessions.

### Health
Monitor your physical well-being with data from Apple Health and Google Fit. View summary cards with trends, interactive charts over time, and manage your data sources. Supported metrics include steps, heart rate, sleep, weight, calories burned, distance, active minutes, and workouts.

Health data is automatically included in AI coaching context and searchable via Smart Search after rebuilding the index.

### Skills
Track skills with categories (technical, soft, health, creative, business) and levels (0-10).

### Learning
Track courses, books, videos, and articles. Change status between Backlog, In Progress, and Completed.

### Ledger
Track your self-development finances. Log income and expenses across categories (courses, books, coaching, subscriptions, tools, health). View summary cards showing income, expenses, and balance. Filter by period (week/month/year) and category. See spending breakdown by category with visual bars.

### Todos
Manage tasks with priorities (low/medium/high/urgent), due dates with optional times, and categories. Link todos to goals for focused execution. Filter by status (pending/in_progress/completed) or priority. Mark tasks complete and track your progress.

### Journal
Write daily reflections. Add a mood rating to track how you feel over time. Supports markdown formatting.

### Chat
Have a multi-turn conversation with your AI coach. The coach has access to your tracked data — including health metrics — and can give personalized advice.

### Story Lab
Generate inspirational stories based on your tracked data. Choose a tone (encouraging, reflective, cinematic, playful, calm), write a prompt, and the AI creates a personalized story. Save your favorites.

### Smart Search
Search across all your skills, learning items, routines, todos, ledger entries, and daily health summaries using AI-powered semantic search. Click "Rebuild Index" to update the search index after adding new data.

### Settings
Configure your BWOC agent connection, Google Fit credentials, test connections, or reset all settings to defaults.
`,
  },
  {
    id: "faq",
    title: "FAQ",
    content: `
**Where is my data stored?**
All data is stored locally on your device in a SQLite database. Nothing is sent to the cloud unless you use AI features, which communicate with your configured BWOC agent.

**Do I need an internet connection?**
No, except for AI features (coaching, chat, insights, stories) and Google Fit sync. All tracking features and Apple Health import work offline.

**Can I use this without a BWOC agent?**
Yes. Skills, routines, habits, goals, health tracking, ledger, todos, journal, and learning tracking all work without any AI connection.

**What is BWOC?**
BWOC is a backend-neutral framework for orchestrating AI agents. Self Growth addresses an agent in your BWOC fleet for its AI features; the agent runs whatever LLM backend you configure for it.

**How does health integration work?**
Self Growth supports two health data sources:
- **Apple Health**: Export your data as XML from the iPhone Health app and import it into Self Growth. Re-import anytime to update — duplicates are handled automatically.
- **Google Fit**: Connect via OAuth using your Google Cloud credentials. Sync pulls the last 30 days of fitness data.

Health data (steps, heart rate, sleep, weight, calories, distance, workouts) is stored locally and automatically included in AI coaching context and semantic search.

**How do I backup my data?**
Your database is stored at:
- **macOS**: \`~/Library/Application Support/com.bemindlabs.growth.v2/self-growth.db\`
- **Linux**: \`~/.local/share/self-growth/self-growth.db\`
- **Windows**: \`%AppData%\\BemindLabs\\Self Growth\\self-growth.db\`

Copy this file to back up all your data.

**How does Smart Search work?**
On desktop, the app generates vector embeddings locally using AllMiniLM-L6-v2. Click "Rebuild Index" in the Search page to index your data, then search using natural language. Health data is indexed as daily summaries covering the last 90 days.

**Can I export my data?**
Currently you can copy the SQLite database file directly. It can be opened with any SQLite viewer.

**What currencies does the Ledger support?**
The Ledger defaults to THB but supports any currency code per entry. Summary calculations are grouped by the most recent currency used.

**Can I link todos to goals?**
Yes. When creating a todo, you can optionally link it to an existing goal. This helps you break goals into actionable tasks.

**Is the AI reading all my data?**
When you use AI features, the app sends relevant context (recent skills, routines, goals, learning items, and 7-day health averages) to your configured BWOC agent. Financial (Ledger) and task (Todos) data is **not** sent to AI coaching — it is only searchable via Smart Search locally. AI data stays within your network when the agent runs on your own machine or fleet.
`,
  },
  {
    id: "terms",
    title: "Terms & Conditions",
    content: `
**Last updated: March 2026**

### 1. Acceptance of Terms
By using Self Growth, you agree to these terms. If you do not agree, do not use the app.

### 2. Description of Service
Self Growth is a self-development tracking application that stores data locally on your device. AI features require a separately configured BWOC agent.

### 3. User Responsibilities
- You are responsible for maintaining the security of your device and data
- You are responsible for configuring and maintaining your own BWOC agent and fleet
- You are responsible for backing up your data

### 4. Data Ownership
All data you create in Self Growth belongs to you. The app stores data locally on your device. We do not collect, store, or have access to your data.

### 5. AI Features
AI features are powered by your BWOC agent. The quality, accuracy, and availability of AI responses depend on your agent configuration and the underlying LLM backend it uses.

### 6. Disclaimer
Self Growth is provided "as is" without warranties of any kind. The AI coaching features are for informational purposes only and do not constitute professional advice.

### 7. Limitation of Liability
Bemind Technology Co., Ltd. (Bemindlabs) shall not be liable for any damages arising from the use of this application.

### 8. Changes to Terms
We may update these terms from time to time. Continued use of the app constitutes acceptance of the updated terms.
`,
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    content: `
**Last updated: March 2026**

### Data Storage
All your data is stored **locally on your device** in a SQLite database. We do not operate any cloud servers or collect any user data.

### What We Don't Collect
- No personal information
- No usage analytics
- No crash reports
- No telemetry
- No cookies or tracking

### AI Feature Data Flow
When you use AI features (Coach, Chat, Insights, Stories), the app sends relevant context data to your **configured BWOC agent**. This includes:
- Recent skills and levels
- Active routines and completion data
- Learning items
- Goals
- Health metrics (7-day averages of steps, heart rate, sleep, etc.)
- Journal content (only when relevant to AI queries)

Ledger entries and todos are indexed for Smart Search but are **not** included in AI coaching context.

This data is sent to the agent you configure in Settings. When that agent runs on your own machine or fleet, this data never leaves your network.

### Health Data
Health data imported from Apple Health or synced from Google Fit is stored **locally on your device**. When using Google Fit sync, the app communicates with Google's Fitness API using your own OAuth credentials — no data passes through our servers.

### Third-Party Services
Self Growth does not integrate with any third-party analytics, advertising, or tracking services. External communication is limited to:
- Your configured **BWOC agent** (for AI features)
- **Google Fitness API** (only if you connect Google Fit, using your own credentials)

### Data Retention
Since all data is stored locally, you have full control over data retention. Delete the database file to remove all data.

### Children's Privacy
Self Growth is not directed at children under 13. We do not knowingly collect data from children.

### Contact
For privacy concerns, contact Bemind Technology Co., Ltd. (Bemindlabs).
`,
  },
];

export default function GetStarted() {
  const [expanded, setExpanded] = useState<string>("vision");

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BookOpen size={24} className="text-primary" />
        <h2 className="text-2xl font-bold">Get Started</h2>
      </div>

      <div className="space-y-2">
        {sections.map((section) => {
          const isOpen = expanded === section.id;
          return (
            <div key={section.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? "" : section.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
              >
                <h3 className="font-medium">{section.title}</h3>
                {isOpen ? (
                  <ChevronUp size={18} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={18} className="text-muted-foreground" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  <Markdown className="text-sm">{section.content}</Markdown>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
