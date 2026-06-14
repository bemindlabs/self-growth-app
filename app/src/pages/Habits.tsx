import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { habitsApi, type Habit } from "@/api/habits";
import { Plus, Trash2, CheckSquare } from "lucide-react";

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
}

export default function Habits() {
  const { t } = useTranslation();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<number, Set<string>>>({});
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [identityStatement, setIdentityStatement] = useState("");

  const last7 = getLast7Days();

  const loadHabits = async () => {
    const list = await habitsApi.list();
    setHabits(list);

    const logsMap: Record<number, Set<string>> = {};
    for (const habit of list) {
      const habitLogs = await habitsApi.getLogs(habit.id, 7);
      logsMap[habit.id] = new Set(habitLogs.map((l) => l.logged_date));
    }
    setLogs(logsMap);
  };

  useEffect(() => {
    loadHabits().catch(console.error);
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await habitsApi.create({
      name: name.trim(),
      description: description.trim() || undefined,
      identity_statement: identityStatement.trim() || undefined,
    });
    setName("");
    setDescription("");
    setIdentityStatement("");
    setShowForm(false);
    loadHabits();
  };

  const handleToggle = async (habitId: number, date: string) => {
    await habitsApi.toggle(habitId, date);
    setLogs((prev) => {
      const set = new Set(prev[habitId] || []);
      if (set.has(date)) {
        set.delete(date);
      } else {
        set.add(date);
      }
      return { ...prev, [habitId]: set };
    });
  };

  const handleDelete = async (id: number) => {
    await habitsApi.delete(id);
    loadHabits();
  };

  const getStreak = (habitId: number): number => {
    const completedDates = logs[habitId] || new Set();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (completedDates.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{t("habits.title")}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
        >
          <Plus size={16} />
          {t("habits.addHabit")}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder={t("habits.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
          />
          <textarea
            placeholder={t("habits.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
            rows={2}
          />
          <input
            type="text"
            placeholder={t("habits.identityPlaceholder")}
            value={identityStatement}
            onChange={(e) => setIdentityStatement(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              {t("habits.create")}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm">
              {t("habits.cancel")}
            </button>
          </div>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">{t("habits.emptyState")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const completedDates = logs[habit.id] || new Set();
            const streak = getStreak(habit.id);

            return (
              <div key={habit.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{habit.name}</h3>
                    {habit.identity_statement && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">{habit.identity_statement}</p>
                    )}
                    {habit.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{habit.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {streak > 0 && (
                      <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                        {t("habits.streak", { count: streak })}
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(habit.id)}
                      className="p-1.5 text-destructive hover:bg-secondary rounded-md transition-colors"
                      aria-label={t("habits.deleteAriaLabel", { name: habit.name })}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  {last7.map((date) => {
                    const done = completedDates.has(date);
                    const isToday = date === last7[6];
                    return (
                      <button
                        key={date}
                        onClick={() => handleToggle(habit.id, date)}
                        className="flex flex-col items-center gap-1"
                      >
                        <span className={`text-[10px] ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                          {getDayLabel(date)}
                        </span>
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                            done
                              ? "bg-success text-success-foreground"
                              : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                          }`}
                          style={done ? { backgroundColor: habit.color, color: "white" } : {}}
                        >
                          {done ? "~" : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
