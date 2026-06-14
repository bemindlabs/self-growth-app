import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { storyApi, type Story } from "@/api/story";
import { Sparkles, Trash2, Wand2 } from "lucide-react";
import Markdown from "@/components/ui/Markdown";

const toneColors: Record<string, string> = {
  encouraging: "bg-primary/10 text-primary",
  reflective: "bg-secondary text-secondary-foreground",
  cinematic: "bg-warning/10 text-warning",
  playful: "bg-success/10 text-success",
  calm: "bg-muted text-muted-foreground",
};

export default function StoriesPage() {
  const { t } = useTranslation();
  const [stories, setStories] = useState<Story[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const navigate = useNavigate();

  const loadStories = () => {
    storyApi.list().then(setStories).catch(console.error);
  };

  useEffect(loadStories, []);

  const handleDelete = async (id: number) => {
    await storyApi.delete(id);
    if (expanded === id) setExpanded(null);
    loadStories();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "Z");
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const truncate = (text: string, maxLength = 120) =>
    text.length <= maxLength ? text : text.slice(0, maxLength).trimEnd() + "…";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary" size={22} />
          <h2 className="text-2xl font-bold">{t("stories.title")}</h2>
        </div>
        <button
          onClick={() => navigate("/stories/new")}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity"
        >
          <Wand2 size={16} />
          {t("stories.generateStory")}
        </button>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">{t("stories.emptyState")}</p>
          <button
            onClick={() => navigate("/stories/new")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity"
          >
            <Wand2 size={16} />
            {t("stories.generateStory")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => {
            const isExpanded = expanded === story.id;
            return (
              <div key={story.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : story.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                          toneColors[story.tone] ?? "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {story.tone}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(story.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-snug">
                      {isExpanded ? story.prompt : truncate(story.prompt, 100)}
                    </p>
                    {!isExpanded && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {truncate(story.story, 120)}
                      </p>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(story.id)}
                    className="p-2 text-destructive hover:bg-secondary rounded-md transition-colors flex-shrink-0"
                    aria-label={t("stories.deleteStory", { date: formatDate(story.created_at) })}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border space-y-3">
                    <Markdown className="text-sm leading-7">{story.story}</Markdown>
                    {story.context_summary && (
                      <div className="bg-secondary/50 rounded-md p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {t("stories.contextUsed")}
                        </p>
                        <p className="text-xs text-muted-foreground">{story.context_summary}</p>
                      </div>
                    )}
                    {(story.model || story.provider) && (
                      <p className="text-xs text-muted-foreground">
                        {[story.provider, story.model].filter(Boolean).join(" · ")}
                      </p>
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
