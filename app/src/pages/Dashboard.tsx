import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  progressApi,
  type DashboardStats,
  type LifeBalanceDomain,
  type MoodHabitCorrelation,
} from "@/api/progress";
import { aiApi, type AiResponse } from "@/api/ai";
import { todosApi, type Todo } from "@/api/todos";
import { healthApi, type HealthSummary } from "@/api/health";
import { habitsApi, type Habit, type HabitLog } from "@/api/habits";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Flame,
  Target,
  RotateCcw,
  Trophy,
  CheckCircle,
  ListTodo,
  Heart,
  AlertCircle,
  Check,
  Footprints,
  Moon,
  Weight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Markdown from "@/components/ui/Markdown";

const trendIcons: Record<string, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

function formatHealthValue(type: string, value: number): string {
  if (type === "sleep_minutes") return `${(value / 60).toFixed(1)}h`;
  if (type === "distance_m") return `${(value / 1000).toFixed(1)}km`;
  if (type === "weight_kg") return `${value.toFixed(1)}kg`;
  if (type === "heart_rate") return `${Math.round(value)}bpm`;
  return Math.round(value).toLocaleString();
}

type TFunc = (key: string, opts?: Record<string, unknown>) => string;

function formatDate(date: string | null, t: TFunc): string {
  if (!date) return "";
  const d = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return t("dashboard.dateToday");
  if (diff === 1) return t("dashboard.dateTomorrow");
  if (diff < 0) return t("dashboard.dateOverdue", { count: Math.abs(diff) });
  if (diff <= 7) return t("dashboard.dateInDays", { count: diff });
  return date;
}

const priorityColors: Record<string, string> = {
  urgent: "text-destructive",
  high: "text-warning",
  medium: "text-info",
  low: "text-muted-foreground",
};

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lifeBalance, setLifeBalance] = useState<LifeBalanceDomain[]>([]);
  const [moodCorrelations, setMoodCorrelations] = useState<MoodHabitCorrelation[] | null>(null);
  const [todayTodos, setTodayTodos] = useState<Todo[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummary[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<Map<number, Set<string>>>(new Map());

  // Quick Coach
  const [coachQuestion, setCoachQuestion] = useState("");
  const [coachResult, setCoachResult] = useState<AiResponse | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  // Insights
  const [insightsResult, setInsightsResult] = useState<AiResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Weekly Summary
  const [summaryResult, setSummaryResult] = useState<AiResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    progressApi.getDashboardStats().then(setStats).catch(console.error);
    progressApi.getLifeBalance().then(setLifeBalance).catch(console.error);
    progressApi.getMoodHabitCorrelation().then(setMoodCorrelations).catch(console.error);
    todosApi.getToday().then(setTodayTodos).catch(console.error);
    healthApi.getSummary().then(setHealthSummary).catch(console.error);

    // Load habits and today's logs
    habitsApi.list().then(async (h) => {
      setHabits(h);
      const logsMap = new Map<number, Set<string>>();
      for (const habit of h) {
        try {
          const logs = await habitsApi.getLogs(habit.id, 1);
          const dates = new Set(logs.map((l: HabitLog) => l.logged_date));
          logsMap.set(habit.id, dates);
        } catch {
          logsMap.set(habit.id, new Set());
        }
      }
      setHabitLogs(logsMap);
    }).catch(console.error);
  }, []);

  async function handleAskCoach() {
    if (!coachQuestion.trim()) return;
    setCoachLoading(true);
    setCoachResult(null);
    setCoachError(null);
    try {
      const res = await aiApi.coach(coachQuestion.trim());
      setCoachResult(res);
    } catch (err) {
      setCoachError(err instanceof Error ? err.message : String(err));
    } finally {
      setCoachLoading(false);
    }
  }

  async function handleInsights() {
    setInsightsLoading(true);
    setInsightsResult(null);
    setInsightsError(null);
    try {
      const res = await aiApi.insights();
      setInsightsResult(res);
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : String(err));
    } finally {
      setInsightsLoading(false);
    }
  }

  async function handleWeeklySummary() {
    setSummaryLoading(true);
    setSummaryResult(null);
    setSummaryError(null);
    try {
      const res = await aiApi.summarize("weekly");
      setSummaryResult(res);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : String(err));
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleCompleteTodo(id: number) {
    try {
      await todosApi.complete(id);
      setTodayTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleToggleHabit(habitId: number) {
    try {
      const toggled = await habitsApi.toggle(habitId, today);
      setHabitLogs((prev) => {
        const next = new Map(prev);
        const dates = new Set(next.get(habitId) || []);
        if (toggled) {
          dates.add(today);
        } else {
          dates.delete(today);
        }
        next.set(habitId, dates);
        return next;
      });
    } catch (e) {
      console.error(e);
    }
  }

  if (!stats) {
    return <div className="text-muted-foreground">{t("dashboard.loading")}</div>;
  }

  const overdueTodos = todayTodos.filter(
    (t) => t.due_date && t.due_date < today
  );

  const cards = [
    { label: t("dashboard.cardStreak"), value: `${stats.current_streak}d`, icon: Flame, color: "text-warning" },
    { label: t("dashboard.cardToday"), value: stats.completions_today, icon: CheckCircle, color: "text-success" },
    { label: t("dashboard.cardGoals"), value: stats.active_goals, icon: Trophy, color: "text-warning" },
    { label: t("dashboard.cardTodos"), value: todayTodos.length, icon: ListTodo, color: "text-accent" },
    { label: t("dashboard.cardRoutines"), value: stats.active_routines, icon: RotateCcw, color: "text-primary" },
    { label: t("dashboard.cardSkills"), value: stats.total_skills, icon: Target, color: "text-info" },
  ];

  // Pick top health highlights (max 4)
  const healthHighlights = healthSummary.slice(0, 4);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("dashboard.title")}</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-card rounded-lg border border-border p-3 flex items-center gap-2"
          >
            <div className={cn("p-1.5 rounded-md bg-secondary", card.color)}>
              <card.icon size={16} />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">{card.value}</p>
              <p className="text-[10px] text-muted-foreground">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout: Today's Todos + Habits */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {/* Today's Todos */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <ListTodo size={16} className="text-accent" />
            <h3 className="font-semibold text-sm">{t("dashboard.todaysTodos")}</h3>
            {overdueTodos.length > 0 && (
              <span className="ml-auto flex items-center gap-1 text-xs text-destructive">
                <AlertCircle size={12} />
                {t("dashboard.overdueCount", { count: overdueTodos.length })}
              </span>
            )}
          </div>
          {todayTodos.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {todayTodos.slice(0, 8).map((todo) => {
                const overdue = todo.due_date && todo.due_date < today;
                return (
                  <div
                    key={todo.id}
                    className="flex items-center gap-2 group"
                  >
                    <button
                      onClick={() => handleCompleteTodo(todo.id)}
                      className="w-4 h-4 rounded border border-muted-foreground/40 hover:border-primary hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors"
                      aria-label={t("dashboard.completeAria", { title: todo.title })}
                    >
                      <Check size={10} className="opacity-0 group-hover:opacity-100 text-primary" />
                    </button>
                    <span className="text-sm flex-1 truncate">{todo.title}</span>
                    {todo.due_date && (
                      <span
                        className={cn(
                          "text-[10px] flex-shrink-0",
                          overdue ? "text-destructive" : "text-muted-foreground"
                        )}
                      >
                        {formatDate(todo.due_date, t)}
                      </span>
                    )}
                    <span className={cn("text-[10px]", priorityColors[todo.priority] || "")}>
                      {todo.priority === "urgent" || todo.priority === "high" ? "!" : ""}
                    </span>
                  </div>
                );
              })}
              {todayTodos.length > 8 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  {t("dashboard.moreCount", { count: todayTodos.length - 8 })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-3 text-center">
              {t("dashboard.todosEmpty")}
            </p>
          )}
        </div>

        {/* Today's Habits */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-success" />
            <h3 className="font-semibold text-sm">{t("dashboard.todaysHabits")}</h3>
            {habits.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {t("dashboard.habitsDone", {
                  done: habits.filter((h) => habitLogs.get(h.id)?.has(today)).length,
                  total: habits.length,
                })}
              </span>
            )}
          </div>
          {habits.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {habits.slice(0, 8).map((habit) => {
                const done = habitLogs.get(habit.id)?.has(today) || false;
                return (
                  <div key={habit.id} className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleHabit(habit.id)}
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        done
                          ? "border-success bg-success"
                          : "border-muted-foreground/40 hover:border-success"
                      )}
                      aria-label={done
                        ? t("dashboard.uncheckAria", { name: habit.name })
                        : t("dashboard.checkAria", { name: habit.name })}
                    >
                      {done && <Check size={10} className="text-white" />}
                    </button>
                    <span
                      className={cn(
                        "text-sm flex-1 truncate",
                        done && "line-through text-muted-foreground"
                      )}
                    >
                      {habit.name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-3 text-center">
              {t("dashboard.habitsEmpty")}
            </p>
          )}
        </div>
      </div>

      {/* Health Highlights */}
      {healthHighlights.length > 0 && (
        <div className="mt-4 bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} className="text-destructive" />
            <h3 className="font-semibold text-sm">{t("dashboard.healthSnapshot")}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {healthHighlights.map((h) => {
              const TrendIcon = trendIcons[h.trend] || Minus;
              return (
                <div key={h.metric_type} className="flex items-center gap-2">
                  <div className="text-muted-foreground">
                    {h.metric_type === "steps" && <Footprints size={14} />}
                    {h.metric_type === "heart_rate" && <Heart size={14} />}
                    {h.metric_type === "sleep_minutes" && <Moon size={14} />}
                    {h.metric_type === "weight_kg" && <Weight size={14} />}
                    {!["steps", "heart_rate", "sleep_minutes", "weight_kg"].includes(h.metric_type) && <Target size={14} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">
                      {formatHealthValue(h.metric_type, h.latest_value)}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {h.metric_type.replace("_", " ")}
                      </span>
                      <TrendIcon size={10} className="text-muted-foreground" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Life Balance Radar Chart */}
      {lifeBalance.length > 0 && (
        <div className="mt-4 bg-card rounded-lg border border-border p-4">
          <h3 className="font-semibold text-sm mb-1">{t("dashboard.wheelOfLife")}</h3>
          <p className="text-[10px] text-muted-foreground mb-3">
            {t("dashboard.wheelOfLifeDesc")}
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={lifeBalance} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="domain"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                tickCount={4}
              />
              <Radar
                name={t("dashboard.scoreLabel")}
                dataKey="score"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "var(--foreground)",
                }}
                formatter={(value) => [`${Math.round(Number(value))}`, t("dashboard.scoreLabel")]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mood-Habit Insights */}
      <div className="mt-4 bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={16} className="text-primary" />
          <h3 className="font-semibold text-sm">{t("dashboard.moodHabitInsights")}</h3>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">
          {t("dashboard.moodHabitDesc")}
        </p>
        {moodCorrelations === null ? (
          <p className="text-xs text-muted-foreground py-3 text-center">{t("dashboard.loading")}</p>
        ) : moodCorrelations.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            {t("dashboard.moodHabitInsufficient")}
          </p>
        ) : (
          <div className="space-y-4">
            {/* Ranked list */}
            <div className="space-y-2">
              {moodCorrelations.map((c) => (
                <div key={c.habit_name} className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: c.habit_color }}
                  />
                  <span className="text-sm flex-1 truncate">{c.habit_name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {c.avg_mood_with.toFixed(1)} vs {c.avg_mood_without.toFixed(1)}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-medium tabular-nums",
                      c.diff > 0 ? "text-success" : c.diff < 0 ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {c.diff > 0 ? (
                      <TrendingUp size={12} />
                    ) : c.diff < 0 ? (
                      <TrendingDown size={12} />
                    ) : (
                      <Minus size={12} />
                    )}
                    {c.diff > 0 ? "+" : ""}
                    {c.diff.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bar chart comparison */}
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={moodCorrelations.map((c) => ({
                  name: c.habit_name.length > 12 ? c.habit_name.slice(0, 12) + "…" : c.habit_name,
                  [t("dashboard.withHabit")]: Number(c.avg_mood_with.toFixed(2)),
                  [t("dashboard.withoutHabit")]: Number(c.avg_mood_without.toFixed(2)),
                  color: c.habit_color,
                }))}
                margin={{ top: 4, right: 8, bottom: 4, left: -16 }}
                barCategoryGap="30%"
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "var(--foreground)",
                  }}
                  formatter={(value) => [Number(value).toFixed(2), ""]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", color: "var(--muted-foreground)" }}
                />
                <Bar dataKey={t("dashboard.withHabit")} radius={[3, 3, 0, 0]}>
                  {moodCorrelations.map((c) => (
                    <Cell key={c.habit_name} fill={c.habit_color} fillOpacity={0.85} />
                  ))}
                </Bar>
                <Bar dataKey={t("dashboard.withoutHabit")} radius={[3, 3, 0, 0]} fill="var(--muted-foreground)" fillOpacity={0.35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick Coach */}
      <div className="mt-4 bg-card rounded-lg border border-border p-4">
        <h3 className="font-semibold text-sm mb-3">{t("dashboard.quickCoach")}</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={coachQuestion}
            onChange={(e) => setCoachQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAskCoach()}
            placeholder={t("dashboard.coachPlaceholder")}
            className="flex-1 bg-secondary text-sm rounded-md border border-border px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleAskCoach}
            disabled={coachLoading || !coachQuestion.trim()}
            className="bg-primary text-primary-foreground text-sm font-medium rounded-md px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {coachLoading ? "..." : t("dashboard.ask")}
          </button>
        </div>
        {coachError && (
          <div className="mt-3 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            {coachError}
          </div>
        )}
        {coachResult && (
          <div className="mt-3 rounded-md bg-secondary border border-border px-3 py-3">
            <p className="text-xs text-muted-foreground mb-1">{coachResult.model}</p>
            <Markdown className="text-sm">{coachResult.content}</Markdown>
          </div>
        )}
      </div>

      {/* Insights & Weekly Summary side by side */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm">{t("dashboard.insights")}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("dashboard.insightsDesc")}
              </p>
            </div>
            <button
              onClick={handleInsights}
              disabled={insightsLoading}
              className="bg-primary text-primary-foreground text-xs font-medium rounded-md px-3 py-1.5 disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {insightsLoading ? "..." : t("dashboard.generate")}
            </button>
          </div>
          {insightsError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {insightsError}
            </div>
          )}
          {insightsResult && (
            <div className="rounded-md bg-secondary border border-border px-3 py-3">
              <p className="text-xs text-muted-foreground mb-1">{insightsResult.model}</p>
              <Markdown className="text-sm">{insightsResult.content}</Markdown>
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-sm">{t("dashboard.weeklySummary")}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("dashboard.weeklySummaryDesc")}
              </p>
            </div>
            <button
              onClick={handleWeeklySummary}
              disabled={summaryLoading}
              className="bg-primary text-primary-foreground text-xs font-medium rounded-md px-3 py-1.5 disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {summaryLoading ? "..." : t("dashboard.generate")}
            </button>
          </div>
          {summaryError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {summaryError}
            </div>
          )}
          {summaryResult && (
            <div className="rounded-md bg-secondary border border-border px-3 py-3">
              <p className="text-xs text-muted-foreground mb-1">{summaryResult.model}</p>
              <Markdown className="text-sm">{summaryResult.content}</Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
