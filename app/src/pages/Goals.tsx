import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { goalsApi, type Goal } from "@/api/goals";
import { Plus, Trash2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  paused: "bg-secondary text-secondary-foreground",
};

export default function Goals() {
  const { t } = useTranslation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [filter, setFilter] = useState<string | undefined>();

  const loadGoals = () => {
    goalsApi.list(filter).then(setGoals).catch(console.error);
  };

  useEffect(loadGoals, [filter]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    await goalsApi.create({
      title: title.trim(),
      description: description.trim() || undefined,
      target_date: targetDate || undefined,
    });
    setTitle("");
    setDescription("");
    setTargetDate("");
    setShowForm(false);
    loadGoals();
  };

  const handleStatusChange = async (id: number, status: string) => {
    await goalsApi.update(id, { status });
    loadGoals();
  };

  const handleDelete = async (id: number) => {
    await goalsApi.delete(id);
    loadGoals();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{t("goals.title")}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          {t("goals.addGoal")}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {[undefined, "active", "completed", "paused"].map((s) => (
          <button
            key={s ?? "all"}
            onClick={() => setFilter(s)}
            className={cn(
              "px-3 py-1 rounded-full text-xs transition-colors",
              filter === s
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {s ? t(`goals.filter_${s}`) : t("goals.filterAll")}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t("goals.labelTitle")}</label>
            <input
              type="text"
              placeholder={t("goals.placeholderTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t("goals.labelDescription")}</label>
            <textarea
              placeholder={t("goals.placeholderDescription")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t("goals.labelTargetDate")}</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity">
              {t("goals.create")}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-md text-sm hover:bg-secondary transition-colors">
              {t("goals.cancel")}
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">{t("goals.emptyState")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Trophy size={18} className="text-warning mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <select
                        value={goal.status}
                        onChange={(e) => handleStatusChange(goal.id, e.target.value)}
                        className={cn(
                          "px-2 py-0.5 rounded text-xs border-0",
                          statusColors[goal.status] || ""
                        )}
                        aria-label={t("goals.statusFor", { title: goal.title })}
                      >
                        <option value="active">{t("goals.status_active")}</option>
                        <option value="completed">{t("goals.status_completed")}</option>
                        <option value="paused">{t("goals.status_paused")}</option>
                      </select>
                      {goal.target_date && (
                        <span className="text-xs text-muted-foreground">{t("goals.targetPrefix", { date: goal.target_date })}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="p-2 text-destructive hover:bg-secondary rounded-md transition-colors"
                  aria-label={t("goals.deleteAria", { title: goal.title })}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
