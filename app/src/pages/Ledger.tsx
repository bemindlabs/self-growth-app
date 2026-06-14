import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ledgerApi, type LedgerEntry, type LedgerSummary } from "@/api/ledger";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import OcrButton from "@/components/ui/OcrButton";

const categories = ["general", "course", "book", "coaching", "subscription", "tools", "health", "other"];

const categoryColors: Record<string, string> = {
  general: "bg-secondary",
  course: "bg-blue-500/10 text-blue-500",
  book: "bg-amber-500/10 text-amber-500",
  coaching: "bg-purple-500/10 text-purple-500",
  subscription: "bg-cyan-500/10 text-cyan-500",
  tools: "bg-orange-500/10 text-orange-500",
  health: "bg-green-500/10 text-green-500",
  other: "bg-secondary",
};

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
}

export default function Ledger() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [filterCat, setFilterCat] = useState<string | undefined>();

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [entryType, setEntryType] = useState("expense");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);

  const load = async () => {
    const [e, s] = await Promise.all([
      ledgerApi.list(filterCat),
      ledgerApi.summary(period),
    ]);
    setEntries(e);
    setSummary(s);
  };

  useEffect(() => { load().catch(console.error); }, [period, filterCat]);

  const handleCreate = async () => {
    const amt = parseFloat(amount);
    if (!title.trim() || isNaN(amt) || amt <= 0) return;
    await ledgerApi.create({
      title: title.trim(),
      amount: amt,
      entry_type: entryType,
      category,
      description: description.trim() || undefined,
      entry_date: entryDate,
    });
    setTitle("");
    setAmount("");
    setEntryType("expense");
    setCategory("general");
    setDescription("");
    setEntryDate(new Date().toISOString().split("T")[0]);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: number) => {
    await ledgerApi.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{t("ledger.title")}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
        >
          <Plus size={16} />
          {t("ledger.addEntry")}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-success" />
              <span className="text-xs text-muted-foreground">{t("ledger.income")}</span>
            </div>
            <p className="text-lg font-bold text-success">
              {formatAmount(summary.total_income, summary.currency)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-destructive" />
              <span className="text-xs text-muted-foreground">{t("ledger.expense")}</span>
            </div>
            <p className="text-lg font-bold text-destructive">
              {formatAmount(summary.total_expense, summary.currency)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground">{t("ledger.balance")}</span>
            </div>
            <p className={`text-lg font-bold ${summary.balance >= 0 ? "text-success" : "text-destructive"}`}>
              {formatAmount(summary.balance, summary.currency)}
            </p>
          </div>
        </div>
      )}

      {/* Period + Category Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex gap-1">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-full text-xs ${
                period === p ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="w-px bg-border" />
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setFilterCat(undefined)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
              !filterCat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {t("ledger.all")}
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                filterCat === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Spending by Category */}
      {summary && summary.by_category.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium mb-3">{t("ledger.spendingByCategory")}</h3>
          <div className="space-y-2">
            {summary.by_category.map(([cat, amt]) => {
              const pct = summary.total_expense > 0 ? (amt / summary.total_expense) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[cat] || "bg-secondary"}`}>{cat}</span>
                  <div className="flex-1 bg-secondary rounded-full h-2">
                    <div className="bg-primary rounded-full h-2" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-20 text-right">
                    {formatAmount(amt, summary.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder={t("ledger.titlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-2 px-3 py-2 border border-border rounded-md text-sm bg-background"
            />
            <input
              type="number"
              placeholder={t("ledger.amountPlaceholder")}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              className="px-3 py-2 border border-border rounded-md text-sm bg-background"
            />
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="px-3 py-2 border border-border rounded-md text-sm bg-background"
            />
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              className="px-3 py-2 border border-border rounded-md text-sm bg-background"
            >
              <option value="expense">{t("ledger.expense")}</option>
              <option value="income">{t("ledger.income")}</option>
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-border rounded-md text-sm bg-background"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <textarea
              placeholder={t("ledger.descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background"
              rows={2}
            />
            <OcrButton
              mode="receipt"
              label={t("ledger.scanReceipt")}
              onResult={(text) => setDescription((prev) => prev ? prev + "\n" + text : text)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              {t("ledger.add")}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm">
              {t("ledger.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Wallet size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">{t("ledger.emptyState")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{entry.title}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColors[entry.category] || "bg-secondary"}`}>
                    {entry.category}
                  </span>
                </div>
                {entry.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
                )}
                <span className="text-[10px] text-muted-foreground">{entry.entry_date}</span>
              </div>
              <span className={`text-sm font-mono font-medium ${
                entry.entry_type === "income" ? "text-success" : "text-destructive"
              }`}>
                {entry.entry_type === "income" ? "+" : "-"}{formatAmount(entry.amount, entry.currency)}
              </span>
              <button
                onClick={() => handleDelete(entry.id)}
                className="p-1.5 text-destructive hover:bg-secondary rounded-md"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
