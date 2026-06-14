import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ragApi, type SearchResult } from "@/api/rag";
import { Search as SearchIcon, RefreshCw, BookOpen, Target, RotateCcw, Heart, ListTodo } from "lucide-react";

const sourceIcons: Record<string, typeof BookOpen> = {
  learning_items: BookOpen,
  skills: Target,
  routines: RotateCcw,
  health_daily: Heart,
  todos: ListTodo,
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ragApi.search(query.trim());
      setResults(res);
    } catch (e) {
      setError(String(e));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      const count = await ragApi.rebuildEmbeddings();
      setError(null);
      alert(t("search.rebuiltAlert", { count }));
    } catch (e) {
      setError(String(e));
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t("search.title")}</h2>
        <button
          onClick={handleRebuild}
          disabled={rebuilding}
          className="flex items-center gap-1 px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw size={14} className={rebuilding ? "animate-spin" : ""} />
          {t("search.rebuildIndex")}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("search.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm bg-background"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50"
        >
          {loading ? "..." : t("search.searchButton")}
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, i) => {
            const Icon = sourceIcons[result.source_table] || BookOpen;
            return (
              <div key={`${result.source_table}-${result.source_id}-${i}`} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon size={18} className="text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium">{result.title}</h3>
                    {result.description && (
                      <p className="text-sm text-muted-foreground mt-1">{result.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                        {result.source_table.replace("_", " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("search.percentMatch", { percent: (result.score * 100).toFixed(0) })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {results.length === 0 && query && !loading && !error && (
        <p className="text-muted-foreground text-sm text-center py-8">
          {t("search.noResults")}
        </p>
      )}

      {!query && (
        <div className="text-center py-12 text-muted-foreground">
          <SearchIcon size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">{t("search.emptyHint")}</p>
        </div>
      )}
    </div>
  );
}
