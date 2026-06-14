import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { checkupsApi, type HealthCheckup } from "@/api/checkups";
import { Plus, Trash2, ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import Markdown from "@/components/ui/Markdown";
import OcrButton from "@/components/ui/OcrButton";

const categories = ["general", "blood_test", "physical", "dental", "vision", "mental_health", "specialist", "vaccination", "other"];

const categoryLabelKeys: Record<string, string> = {
  general: "checkups.categoryGeneral",
  blood_test: "checkups.categoryBloodTest",
  physical: "checkups.categoryPhysical",
  dental: "checkups.categoryDental",
  vision: "checkups.categoryVision",
  mental_health: "checkups.categoryMentalHealth",
  specialist: "checkups.categorySpecialist",
  vaccination: "checkups.categoryVaccination",
  other: "checkups.categoryOther",
};

export default function Checkups() {
  const { t } = useTranslation();
  const catLabel = (c: string) =>
    categoryLabelKeys[c] ? t(categoryLabelKeys[c]) : c;
  const [checkups, setCheckups] = useState<HealthCheckup[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<string | undefined>();

  // Form
  const [title, setTitle] = useState("");
  const [checkupDate, setCheckupDate] = useState(new Date().toISOString().split("T")[0]);
  const [provider, setProvider] = useState("");
  const [category, setCategory] = useState("general");
  const [results, setResults] = useState("");
  const [notes, setNotes] = useState("");

  const load = () => {
    checkupsApi.list(filter).then(setCheckups).catch(console.error);
  };

  useEffect(load, [filter]);

  const handleCreate = async () => {
    if (!title.trim() || !results.trim()) return;
    await checkupsApi.create({
      title: title.trim(),
      checkup_date: checkupDate,
      provider: provider.trim() || undefined,
      category,
      results: results.trim(),
      notes: notes.trim() || undefined,
    });
    setTitle("");
    setCheckupDate(new Date().toISOString().split("T")[0]);
    setProvider("");
    setCategory("general");
    setResults("");
    setNotes("");
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: number) => {
    await checkupsApi.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{t("checkups.title")}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
        >
          <Plus size={16} />
          {t("checkups.addResult")}
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setFilter(undefined)}
          className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
            !filter ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          {t("checkups.filterAll")}
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
              filter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {catLabel(c)}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder={t("checkups.titlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-2 px-3 py-2 border border-border rounded-md text-sm bg-background"
            />
            <input
              type="date"
              value={checkupDate}
              onChange={(e) => setCheckupDate(e.target.value)}
              className="px-3 py-2 border border-border rounded-md text-sm bg-background"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-border rounded-md text-sm bg-background"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{catLabel(c)}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder={t("checkups.providerPlaceholder")}
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="col-span-2 px-3 py-2 border border-border rounded-md text-sm bg-background"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground">{t("checkups.resultsLabel")}</label>
              <OcrButton
                mode="lab"
                label={t("checkups.scanLabResults")}
                onResult={(text) => setResults((prev) => prev ? prev + "\n\n" + text : text)}
              />
            </div>
            <textarea
              placeholder={t("checkups.resultsPlaceholder")}
              value={results}
              onChange={(e) => setResults(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
              rows={6}
            />
          </div>
          <textarea
            placeholder={t("checkups.notesPlaceholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
            rows={2}
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              {t("checkups.save")}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm">
              {t("checkups.cancel")}
            </button>
          </div>
        </div>
      )}

      {checkups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">{t("checkups.emptyState")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checkups.map((checkup) => {
            const isExpanded = expanded === checkup.id;
            return (
              <div key={checkup.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : checkup.id)}
                    className="flex items-start gap-3 flex-1 text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{checkup.title}</h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                          {catLabel(checkup.category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{checkup.checkup_date}</span>
                        {checkup.provider && (
                          <span className="text-xs text-muted-foreground">{t("checkups.atProvider", { provider: checkup.provider })}</span>
                        )}
                      </div>
                      {!isExpanded && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{checkup.results}</p>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-muted-foreground mt-1" /> : <ChevronDown size={16} className="text-muted-foreground mt-1" />}
                  </button>
                  <button
                    onClick={() => handleDelete(checkup.id)}
                    className="p-2 text-destructive hover:bg-secondary rounded-md ml-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border space-y-3">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">{t("checkups.resultsHeading")}</h4>
                      <Markdown className="text-sm">{checkup.results}</Markdown>
                    </div>
                    {checkup.notes && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">{t("checkups.notesHeading")}</h4>
                        <Markdown className="text-sm">{checkup.notes}</Markdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
