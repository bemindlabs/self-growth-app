// English strings. These values MUST stay identical to the original hardcoded
// copy so that, with the default language "en", the rendered UI (and tests) are
// unchanged. Thai lives in th.ts.
export const en = {
  nav: {
    dashboard: "Dashboard",
    goals: "Goals",
    todos: "Todos",
    habits: "Habits",
    routines: "Routines",
    health: "Health",
    checkups: "Checkups",
    skills: "Skills",
    learning: "Learning",
    journal: "Journal",
    chat: "Chat",
    stories: "Stories",
    ledger: "Ledger",
    search: "Search",
    settings: "Settings",
    getStarted: "Get Started",
    more: "More",
  },
  shell: {
    tagline: "Self Development Platform",
    poweredBy: "Powered by Bemind Technology Co.,Ltd. (Bemindlabs)",
  },
  common: {
    save: "Save",
    cancel: "Cancel",
    reset: "Reset",
    delete: "Delete",
  },
  language: {
    title: "Language",
    description: "Choose the app language.",
    english: "English",
    thai: "ไทย (Thai)",
  },
  settings: {
    title: "Settings",
    bwoc: {
      title: "BWOC Agent",
      description:
        "AI coaching, insights, stories, and OCR are handled by an agent in your BWOC fleet. Choose how the app reaches it.",
      transport: "Transport",
      agentId: "Agent ID",
      agentUrl: "Agent URL (A2A)",
      workspacePath: "Workspace path (optional)",
      token: "Token (optional)",
      save: "Save BWOC settings",
      test: "Test Connection",
      testing: "Testing...",
      reachable: "Reachable",
    },
    googleFit: {
      title: "Google Fit",
      save: "Save Google Fit settings",
    },
    backup: {
      title: "Backup & Restore",
    },
    reset: {
      title: "Reset Settings",
      action: "Reset to defaults",
    },
    about: {
      title: "About",
    },
  },
  dashboard: {
    title: "Dashboard",
    healthSnapshot: "Health Snapshot",
    wheelOfLife: "Wheel of Life",
    quickCoach: "Quick Coach",
    insights: "Insights",
    weeklySummary: "Weekly Summary",
  },
};

export type Translation = typeof en;
