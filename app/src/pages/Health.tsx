import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  healthApi,
  type HealthSummary,
  type HealthMetric,
  type HealthSync,
} from "@/api/health";
import {
  Heart,
  Footprints,
  Moon,
  Weight,
  Flame,
  Timer,
  MapPin,
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Minus,
  Upload,
  RefreshCw,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const metricConfig: Record<
  string,
  { labelKey: string; icon: typeof Heart; color: string }
> = {
  steps: { labelKey: "health.metricSteps", icon: Footprints, color: "#22c55e" },
  heart_rate: { labelKey: "health.metricHeartRate", icon: Heart, color: "#ef4444" },
  sleep_minutes: { labelKey: "health.metricSleep", icon: Moon, color: "#8b5cf6" },
  weight_kg: { labelKey: "health.metricWeight", icon: Weight, color: "#3b82f6" },
  calories_burned: { labelKey: "health.metricCalories", icon: Flame, color: "#f97316" },
  active_minutes: { labelKey: "health.metricActiveMin", icon: Timer, color: "#14b8a6" },
  distance_m: { labelKey: "health.metricDistance", icon: MapPin, color: "#6366f1" },
  workout: { labelKey: "health.metricWorkouts", icon: Dumbbell, color: "#ec4899" },
};

const trendIcons: Record<string, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

function formatValue(type: string, value: number): string {
  if (type === "sleep_minutes") return `${(value / 60).toFixed(1)}h`;
  if (type === "distance_m") return `${(value / 1000).toFixed(1)}km`;
  if (type === "weight_kg") return `${value.toFixed(1)}kg`;
  if (type === "heart_rate") return `${Math.round(value)} bpm`;
  return Math.round(value).toLocaleString();
}

export default function HealthPage() {
  const { t } = useTranslation();
  const [summaries, setSummaries] = useState<HealthSummary[]>([]);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [syncs, setSyncs] = useState<HealthSync[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>("steps");
  const [chartDays, setChartDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gfitAuthCode, setGfitAuthCode] = useState("");
  const [showGfitAuth, setShowGfitAuth] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sum, syn] = await Promise.all([
        healthApi.getSummary(),
        healthApi.listSyncs(),
      ]);
      setSummaries(sum);
      setSyncs(syn);
      if (sum.length > 0 && !sum.find((s) => s.metric_type === selectedMetric)) {
        setSelectedMetric(sum[0].metric_type);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const data = await healthApi.listMetrics(selectedMetric, chartDays);
      setMetrics(data);
    } catch (e) {
      setError(String(e));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadChartData();
  }, [selectedMetric, chartDays]);

  const handleImportAppleHealth = async () => {
    try {
      // Use Tauri's file dialog if available, otherwise prompt
      let filePath: string | null = null;
      const path = prompt(t("health.promptApplePath"));
      if (path) filePath = path;

      if (!filePath) return;

      setImporting(true);
      setError(null);
      const result = await healthApi.importAppleHealth(filePath);
      alert(t("health.importedRecords", { count: result.records_added }));
      await loadData();
      await loadChartData();
    } catch (e) {
      setError(String(e));
    } finally {
      setImporting(false);
    }
  };

  const handleGoogleFitAuth = async () => {
    try {
      const url = await healthApi.startGoogleFitAuth();
      // Open in browser
      try {
        const { open: shellOpen } = await import("@tauri-apps/plugin-shell");
        await shellOpen(url);
      } catch {
        window.open(url, "_blank");
      }
      setShowGfitAuth(true);
    } catch (e) {
      setError(String(e));
    }
  };

  const handleCompleteGfitAuth = async () => {
    if (!gfitAuthCode.trim()) return;
    try {
      await healthApi.completeGoogleFitAuth(gfitAuthCode.trim());
      setShowGfitAuth(false);
      setGfitAuthCode("");
      alert(t("health.gfitConnected"));
    } catch (e) {
      setError(String(e));
    }
  };

  const handleSyncGoogleFit = async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await healthApi.syncGoogleFit(30);
      alert(t("health.syncedRecords", { count: result.records_added }));
      await loadData();
      await loadChartData();
    } catch (e) {
      setError(String(e));
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteData = async (source?: string) => {
    const label = source ?? t("health.allSources");
    if (!confirm(t("health.confirmDelete", { label }))) return;
    try {
      const count = await healthApi.deleteData(source);
      alert(t("health.deletedRecords", { count }));
      await loadData();
      await loadChartData();
    } catch (e) {
      setError(String(e));
    }
  };

  // Prepare chart data (reverse so oldest first)
  const chartData = [...metrics]
    .reverse()
    .map((m) => ({
      date: m.recorded_at.slice(0, 10),
      value: m.value,
    }));

  // Aggregate by date for chart (sum for steps/calories, avg for heart_rate/weight)
  const aggregateTypes = new Set([
    "steps",
    "calories_burned",
    "distance_m",
    "active_minutes",
    "sleep_minutes",
  ]);
  const grouped = new Map<string, number[]>();
  for (const point of chartData) {
    const arr = grouped.get(point.date) || [];
    arr.push(point.value);
    grouped.set(point.date, arr);
  }
  const aggregatedChart = Array.from(grouped.entries()).map(([date, vals]) => ({
    date,
    value: aggregateTypes.has(selectedMetric)
      ? vals.reduce((a, b) => a + b, 0)
      : vals.reduce((a, b) => a + b, 0) / vals.length,
  }));

  const cfg = metricConfig[selectedMetric] || metricConfig.steps;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t("health.title")}</h2>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 mb-4 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            {t("health.dismiss")}
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {summaries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {summaries.map((s) => {
            const mc = metricConfig[s.metric_type];
            if (!mc) return null;
            const Icon = mc.icon;
            const TrendIcon = trendIcons[s.trend] || Minus;
            return (
              <button
                key={s.metric_type}
                onClick={() => setSelectedMetric(s.metric_type)}
                className={`bg-card border rounded-lg p-3 text-left transition-colors ${
                  selectedMetric === s.metric_type
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} style={{ color: mc.color }} />
                  <span className="text-xs text-muted-foreground">
                    {t(mc.labelKey)}
                  </span>
                  <TrendIcon size={12} className="ml-auto text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold">
                  {formatValue(s.metric_type, s.latest_value)}
                </p>
                {s.avg_7d != null && (
                  <p className="text-xs text-muted-foreground">
                    {t("health.avg7d", { value: formatValue(s.metric_type, s.avg_7d) })}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Chart */}
      {aggregatedChart.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">{t("health.overTime", { metric: t(cfg.labelKey) })}</h3>
            <div className="flex gap-1">
              {[7, 14, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setChartDays(d)}
                  className={`px-2 py-1 text-xs rounded ${
                    chartDays === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {t("health.daysShort", { count: d })}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={aggregatedChart}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(value) => [
                  formatValue(selectedMetric, Number(value)),
                  t(cfg.labelKey),
                ]}
                labelFormatter={(label) => t("health.tooltipDate", { date: label })}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={cfg.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {summaries.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground mb-6">
          <Heart size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">{t("health.emptyState")}</p>
        </div>
      )}

      {/* Data Sources */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Apple Health */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-medium mb-1">{t("health.appleHealth")}</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {t("health.appleHealthDesc")}
          </p>
          <button
            onClick={handleImportAppleHealth}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50"
          >
            <Upload size={14} />
            {importing ? t("health.importing") : t("health.importXml")}
          </button>
        </div>

        {/* Google Fit */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-medium mb-1">{t("health.googleFit")}</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {t("health.googleFitDesc")}
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleGoogleFitAuth}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm hover:bg-secondary"
            >
              <ExternalLink size={14} />
              {t("health.connect")}
            </button>
            <button
              onClick={handleSyncGoogleFit}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? t("health.syncing") : t("health.sync")}
            </button>
          </div>

          {showGfitAuth && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                {t("health.pasteAuthCode")}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={gfitAuthCode}
                  onChange={(e) => setGfitAuthCode(e.target.value)}
                  placeholder={t("health.authCodePlaceholder")}
                  className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background"
                />
                <button
                  onClick={handleCompleteGfitAuth}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                >
                  {t("health.submit")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sync History */}
      {syncs.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-3">{t("health.syncHistory")}</h3>
          <div className="space-y-2">
            {syncs.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">
                    {s.source}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {s.sync_type}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {t("health.recordsAdded", { count: s.records_added })}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      s.status === "completed"
                        ? "bg-success/10 text-success"
                        : s.status === "failed"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-medium mb-1 text-destructive">{t("health.manageData")}</h3>
        <p className="text-xs text-muted-foreground mb-3">
          {t("health.manageDataDesc")}
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleDeleteData("apple_health")}
            className="flex items-center gap-1 px-3 py-2 border border-destructive text-destructive rounded-md text-sm"
          >
            <Trash2 size={14} />
            {t("health.deleteAppleHealth")}
          </button>
          <button
            onClick={() => handleDeleteData("google_fit")}
            className="flex items-center gap-1 px-3 py-2 border border-destructive text-destructive rounded-md text-sm"
          >
            <Trash2 size={14} />
            {t("health.deleteGoogleFit")}
          </button>
        </div>
      </div>
    </div>
  );
}
