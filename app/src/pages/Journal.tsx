import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { journalApi, type JournalEntry } from "@/api/journal";
import { Plus, Trash2, PenLine, ChevronDown, ChevronUp } from "lucide-react";
import Markdown from "@/components/ui/Markdown";
import OcrButton from "@/components/ui/OcrButton";

const moods = ["", "1", "2", "3", "4", "5"];
const moodEmoji: Record<string, string> = { "1": "😞", "2": "😕", "3": "😐", "4": "🙂", "5": "😊" };

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const { t } = useTranslation();

  const loadEntries = () => {
    journalApi.list().then(setEntries).catch(console.error);
  };

  useEffect(loadEntries, []);

  const handleCreate = async () => {
    if (!content.trim()) return;
    await journalApi.create({
      title: title.trim() || undefined,
      content: content.trim(),
      mood_rating: mood ? parseInt(mood) : undefined,
    });
    setTitle("");
    setContent("");
    setMood("");
    setShowForm(false);
    loadEntries();
  };

  const handleDelete = async (id: number) => {
    await journalApi.delete(id);
    loadEntries();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "Z");
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{t("journal.title")}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
        >
          <Plus size={16} />
          {t("journal.newEntry")}
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder={t("journal.titlePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
          />
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted-foreground">{t("journal.contentLabel")}</label>
              <OcrButton
                label={t("journal.scanHandwriting")}
                onResult={(text) => setContent((prev) => prev ? prev + "\n\n" + text : text)}
              />
            </div>
            <textarea
              placeholder={t("journal.contentPlaceholder")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
              rows={6}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">{t("journal.moodLabel")}</label>
            <div className="flex gap-2">
              {moods.filter(Boolean).map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(mood === m ? "" : m)}
                  className={`w-9 h-9 rounded-full text-lg flex items-center justify-center transition-colors ${
                    mood === m ? "bg-primary/20 ring-2 ring-primary" : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {moodEmoji[m]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              {t("journal.saveEntry")}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm">
              {t("journal.cancel")}
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <PenLine size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">{t("journal.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const isExpanded = expanded === entry.id;
            return (
              <div key={entry.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : entry.id)}
                    className="flex items-start gap-3 flex-1 text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {entry.title || formatDate(entry.created_at)}
                        </h3>
                        {entry.mood_rating && (
                          <span>{moodEmoji[String(entry.mood_rating)]}</span>
                        )}
                      </div>
                      {!isExpanded && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {entry.content}
                        </p>
                      )}
                      {entry.title && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(entry.created_at)}
                        </span>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-muted-foreground mt-1" /> : <ChevronDown size={16} className="text-muted-foreground mt-1" />}
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-destructive hover:bg-secondary rounded-md ml-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <Markdown className="text-sm">{entry.content}</Markdown>
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
