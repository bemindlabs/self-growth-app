import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { learningApi, type LearningItem } from "@/api/learning";
import { Plus, Trash2, BookOpen, Video, FileText, Code } from "lucide-react";

const typeIcons: Record<string, typeof BookOpen> = {
  book: BookOpen,
  video: Video,
  article: FileText,
  course: Code,
  practice: Code,
};

const statusColors: Record<string, string> = {
  backlog: "bg-secondary text-secondary-foreground",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
};

export default function Learning() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [itemType, setItemType] = useState("course");
  const [sourceUrl, setSourceUrl] = useState("");
  const [filter, setFilter] = useState<string | undefined>();
  const { t } = useTranslation();

  const loadItems = () => {
    learningApi.list(filter).then(setItems).catch(console.error);
  };

  useEffect(loadItems, [filter]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    await learningApi.create({
      title: title.trim(),
      description: description.trim() || undefined,
      item_type: itemType,
      source_url: sourceUrl.trim() || undefined,
    });
    setTitle("");
    setDescription("");
    setItemType("course");
    setSourceUrl("");
    setShowForm(false);
    loadItems();
  };

  const handleStatusChange = async (id: number, status: string) => {
    await learningApi.update(id, { status });
    loadItems();
  };

  const handleDelete = async (id: number) => {
    await learningApi.delete(id);
    loadItems();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{t("learning.title")}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
        >
          <Plus size={16} />
          {t("learning.addItem")}
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[undefined, "backlog", "in_progress", "completed"].map((s) => (
          <button
            key={s ?? "all"}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {s ? t(`learning.filter_${s}`) : t("learning.filterAll")}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder={t("learning.titlePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
          />
          <textarea
            placeholder={t("learning.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
            rows={2}
          />
          <div className="flex gap-3">
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background"
            >
              <option value="course">{t("learning.type_course")}</option>
              <option value="book">{t("learning.type_book")}</option>
              <option value="video">{t("learning.type_video")}</option>
              <option value="article">{t("learning.type_article")}</option>
              <option value="practice">{t("learning.type_practice")}</option>
            </select>
          </div>
          <input
            type="url"
            placeholder={t("learning.sourceUrlPlaceholder")}
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
          />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              {t("learning.create")}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm">
              {t("learning.cancel")}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("learning.empty")}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = typeIcons[item.item_type] || FileText;
            return (
              <div key={item.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon size={18} className="text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className={`px-2 py-0.5 rounded text-xs border-0 ${statusColors[item.status] || ""}`}
                        >
                          <option value="backlog">{t("learning.status_backlog")}</option>
                          <option value="in_progress">{t("learning.status_in_progress")}</option>
                          <option value="completed">{t("learning.status_completed")}</option>
                        </select>
                        <span className="text-xs text-muted-foreground">{item.item_type}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-destructive hover:bg-secondary rounded-md"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
