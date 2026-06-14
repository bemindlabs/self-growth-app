import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { routinesApi, type Routine } from "@/api/routines";
import { Plus, Check, Trash2 } from "lucide-react";

export default function Routines() {
  const { t } = useTranslation();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");

  const loadRoutines = () => {
    routinesApi.list().then(setRoutines).catch(console.error);
  };

  useEffect(loadRoutines, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await routinesApi.create({
      name: name.trim(),
      description: description.trim() || undefined,
      frequency,
    });
    setName("");
    setDescription("");
    setFrequency("daily");
    setShowForm(false);
    loadRoutines();
  };

  const handleComplete = async (routineId: number) => {
    await routinesApi.complete(routineId);
    loadRoutines();
  };

  const handleDelete = async (id: number) => {
    await routinesApi.delete(id);
    loadRoutines();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t("routines.title")}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
        >
          <Plus size={16} />
          {t("routines.addRoutine")}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder={t("routines.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
          />
          <textarea
            placeholder={t("routines.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
            rows={2}
          />
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
          >
            <option value="daily">{t("routines.daily")}</option>
            <option value="weekly">{t("routines.weekly")}</option>
            <option value="custom">{t("routines.custom")}</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              {t("routines.create")}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm"
            >
              {t("routines.cancel")}
            </button>
          </div>
        </div>
      )}

      {routines.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("routines.emptyState")}</p>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="font-medium">{routine.name}</h3>
                {routine.description && (
                  <p className="text-sm text-muted-foreground mt-1">{routine.description}</p>
                )}
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded mt-1 inline-block">
                  {routine.frequency}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleComplete(routine.id)}
                  className="p-2 text-success hover:bg-secondary rounded-md"
                  title={t("routines.markComplete")}
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => handleDelete(routine.id)}
                  className="p-2 text-destructive hover:bg-secondary rounded-md"
                  title={t("routines.delete")}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
