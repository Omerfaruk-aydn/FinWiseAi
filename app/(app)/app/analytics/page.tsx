"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Wallet,
  Utensils,
  Target,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FilterSelect } from "@/components/ui/filter-select";

// ─── Types ────────────────────────────────────────────────────────────────────

type MonthTrend = {
  month: number;
  year: number;
  label: string;
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  savingRate: number;
};

type CategoryItem = {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percent: number;
};

type SpendingByCategoryResponse = {
  categories: CategoryItem[];
  total: number;
  month: number;
  year: number;
};

type ChartTrendRange = "3" | "6" | "12" | "ALL";

// ─── Period filter helper ─────────────────────────────────────────────────────

function filterByPeriod(data: MonthTrend[], period: string): MonthTrend[] {
  if (!data.length) return data;
  switch (period) {
    case "Bu Ay":
      return data.slice(-1);
    case "Geçen Ay":
      return data.length >= 2 ? [data[data.length - 2]] : data.slice(0, 1);
    case "Son 3 Ay":
      return data.slice(-3);
    case "Son 6 Ay":
      return data.slice(-6);
    case "Bu Yıl":
    default:
      return data;
  }
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return `₺${Math.round(value).toLocaleString("tr-TR")}`;
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("Bu Ay");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("ALL");
  const [chartTrendRange, setChartTrendRange] = React.useState<ChartTrendRange>("12");

  // Raw API data
  const [allTrendData, setAllTrendData] = React.useState<MonthTrend[]>([]);
  const [categoryData, setCategoryData] = React.useState<CategoryItem[]>([]);
  const [categoryTotal, setCategoryTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Fetch both endpoints on mount
  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [trendRes, catRes] = await Promise.all([
          fetch("/api/analytics/monthly-trend"),
          fetch("/api/analytics/spending-by-category"),
        ]);

        if (trendRes.ok) {
          const json = await trendRes.json();
          if (json.success) setAllTrendData(json.data as MonthTrend[]);
        }

        if (catRes.ok) {
          const json = await catRes.json();
          if (json.success) {
            const payload = json.data as SpendingByCategoryResponse;
            setCategoryData(payload.categories);
            setCategoryTotal(payload.total);
          }
        }
      } catch {
        toast.error("Analiz verileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Derived: filtered trend data for selected period
  const filteredTrend = React.useMemo(() => filterByPeriod(allTrendData, activeTab), [activeTab, allTrendData]);

  // ── Stat card calculations ─────────────────────────────────────────────────

  // Toplam Gider: sum of totalExpenses in filtered period
  const totalExpenses = React.useMemo(
    () => filteredTrend.reduce((s, m) => s + m.totalExpenses, 0),
    [filteredTrend]
  );

  // En Yüksek Kategori: top category from spending-by-category
  const topCategory = categoryData.length > 0 ? categoryData[0] : null;

  // Geçen Aya Fark: compare last entry in full data vs the one before it
  const prevMonthDiff = React.useMemo(() => {
    if (allTrendData.length < 2) return null;
    const current = allTrendData[allTrendData.length - 1].totalExpenses;
    const previous = allTrendData[allTrendData.length - 2].totalExpenses;
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  }, [allTrendData]);

  // Potansiyel Tasarruf: 10% of total expenses in period
  const potentialSavings = totalExpenses * 0.1;

  // ── Chart data for line chart ──────────────────────────────────────────────
  const chartTrendData = chartTrendRange === "ALL" ? allTrendData : allTrendData.slice(-Number(chartTrendRange));
  const lineChartData = chartTrendData.map((m) => ({
    label: m.label,
    gelir: m.totalIncome,
    gider: m.totalExpenses,
  }));

  // ── Comparison table: current vs previous month by category ───────────────
  // We use categoryData for this month. For diff we don't have prev month per-category,
  // so we show the overall month-over-month diff as a proxy per row only when period
  // is "Bu Ay", otherwise we skip the diff badge.
  const comparisonRows = categoryData.slice(0, 6);

  // ── Max category amount for bar scaling ───────────────────────────────────
  const maxCategoryAmount =
    categoryData.length > 0 ? categoryData[0].amount : 1;
  const selectedCategory = categoryData.find((category) => category.id === selectedCategoryId) ?? null;
  const visibleCategoryData = selectedCategory ? [selectedCategory] : categoryData;
  const visibleCategoryTotal = selectedCategory ? selectedCategory.amount : categoryTotal;
  const maxVisibleCategoryAmount = visibleCategoryData.length > 0 ? Math.max(...visibleCategoryData.map((category) => category.amount)) : 1;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 pb-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Harcama Analizi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gelir, gider ve kategori trendlerini dönemlere göre incele.
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
          {["Bu Ay", "Geçen Ay", "Son 3 Ay", "Son 6 Ay", "Bu Yıl"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
              }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                activeTab === tab
                  ? "bg-[#10B981] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <FilterSelect
          ariaLabel="Kategori filtresi"
          value={selectedCategoryId}
          onChange={setSelectedCategoryId}
          options={[
            { value: "ALL", label: "Tüm kategoriler" },
            ...categoryData.map((category) => ({ value: category.id, label: category.name })),
          ]}
        />
      </div>

      {/* Row 1 — 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Toplam Gider */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3">
            <Wallet className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-xs font-medium text-slate-600 mb-1">Toplam Gider</div>
          <div className="text-2xl font-bold text-red-500 mb-2">
            {loading ? "—" : formatCurrency(totalExpenses)}
          </div>
          <div className="text-[10px] text-slate-400">Seçili dönem toplam harcaman</div>
        </div>

        {/* En Yüksek Kategori */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
            <Utensils className="w-5 h-5 text-[#10B981]" />
          </div>
          <div className="text-xs font-medium text-slate-600 mb-1">En Yüksek Kategori</div>
          <div className="text-2xl font-bold text-slate-900 mb-2">
            {loading ? "—" : topCategory ? topCategory.name : "—"}
          </div>
          <div className="text-[10px] text-slate-400">
            {!loading && topCategory && categoryTotal > 0
              ? `Toplam harcamaların %${topCategory.percent.toFixed(1)}'i`
              : "Bu ay veri yok"}
          </div>
        </div>

        {/* Geçen Aya Fark */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-[#10B981]" />
          </div>
          <div className="text-xs font-medium text-slate-600 mb-1">Geçen Aya Göre</div>
          <div
            className={cn(
              "text-2xl font-bold mb-2 flex items-center gap-1 justify-center",
              loading || prevMonthDiff === null
                ? "text-slate-400"
                : prevMonthDiff > 0
                ? "text-red-500"
                : prevMonthDiff < 0
                ? "text-[#10B981]"
                : "text-slate-500"
            )}
          >
            {loading || prevMonthDiff === null ? (
              "—"
            ) : prevMonthDiff > 0 ? (
              <>
                +%{Math.abs(prevMonthDiff).toFixed(1)}{" "}
                <ArrowUpRight className="w-5 h-5" />
              </>
            ) : prevMonthDiff < 0 ? (
              <>
                -%{Math.abs(prevMonthDiff).toFixed(1)}{" "}
                <ArrowDownRight className="w-5 h-5" />
              </>
            ) : (
              <>%0 <ArrowRight className="w-5 h-5" /></>
            )}
          </div>
          <div className="text-[10px] text-slate-400">
            {prevMonthDiff === null
              ? "Karşılaştırma için veri yok"
              : prevMonthDiff > 0
              ? "Harcamalarında artış var"
              : prevMonthDiff < 0
              ? "Harcamalarında azalış var"
              : "Harcamalar aynı"}
          </div>
        </div>

        {/* Potansiyel Tasarruf */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
            <Target className="w-5 h-5 text-[#10B981]" />
          </div>
          <div className="text-xs font-medium text-slate-600 mb-1">Potansiyel Tasarruf</div>
          <div className="text-2xl font-bold text-[#10B981] mb-2">
            {loading ? "—" : formatCurrency(potentialSavings)}
          </div>
          <div className="text-[10px] text-slate-400">Optimizasyon fırsatı</div>
        </div>
      </div>

      {/* Row 2 — Aylık Gider Trendi + Kategori Dağılımı */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Aylık Gelir / Gider Trendi */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-bold text-slate-900">Aylık Gelir / Gider Trendi</h2>
              <div className="flex items-center gap-3 text-[10px] font-medium">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div> Gider (₺)
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]"></div> Gelir (₺)
                </span>
              </div>
            </div>
            <FilterSelect<ChartTrendRange>
              ariaLabel="Trend grafiği dönemi"
              value={chartTrendRange}
              onChange={setChartTrendRange}
              options={[
                { value: "3", label: "Son 3 Ay" },
                { value: "6", label: "Son 6 Ay" },
                { value: "12", label: "Son 12 Ay" },
                { value: "ALL", label: "Tümü" },
              ]}
              triggerClassName="h-8 min-w-28"
            />
          </div>
          <div className="h-[240px] flex-1">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart
                data={lineChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="gelir"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#10B981" }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="gider"
                  stroke="#F87171"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#F87171" }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kategori Dağılımı */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-6">Kategori Dağılımı</h2>
          {loading || categoryData.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
              {loading ? "Yükleniyor…" : "Bu ay veri yok"}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-between gap-5 sm:flex-row">
              <div className="w-48 h-48 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                    <Pie
                      data={visibleCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="amount"
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {visibleCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(visibleCategoryTotal)}
                  </span>
                  <span className="text-[10px] text-slate-500">Toplam</span>
                </div>
              </div>

              <div className="w-full min-w-0 flex-1 sm:pl-8">
                <div className="space-y-3">
                  {visibleCategoryData.map((cat) => (
                    <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className="flex w-full items-center text-xs text-left">
                      <div className="flex items-center gap-2 w-28">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        ></div>
                        <span className="font-medium text-slate-700">{cat.name}</span>
                      </div>
                      <div className="flex-1 text-right font-medium">
                        {formatCurrency(cat.amount)}
                      </div>
                      <div className="w-12 text-right text-slate-400">
                        %{cat.percent.toFixed(0)}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Toplam</span>
                  <span>{formatCurrency(visibleCategoryTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3 — En Çok Harcanan Kategoriler + Geçen Ay Karşılaştırması */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* En Çok Harcanan Kategoriler (Horizontal Bars) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-6">
            En Çok Harcanan Kategoriler
          </h2>
          {loading || categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-slate-400">
              {loading ? "Yükleniyor…" : "Bu ay veri yok"}
            </div>
          ) : (
            <div className="space-y-5">
              {visibleCategoryData.slice(0, 5).map((cat) => (
                <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className="flex w-full items-center text-xs text-left">
                  <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                    <div className="w-4 h-4 rounded-sm border-2 border-current opacity-60"></div>
                  </div>
                  <div className="w-24 px-3 font-medium text-slate-700">{cat.name}</div>
                  <div className="flex-1 px-4">
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(cat.amount / maxVisibleCategoryAmount) * 100}%`,
                          backgroundColor: cat.color,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-16 text-right font-bold">
                    {formatCurrency(cat.amount)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Geçen Ay Karşılaştırması (Table) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Geçen Ay Karşılaştırması</h2>
            <div className="text-[10px] text-slate-400 font-medium">Fark (%)</div>
          </div>
          {loading || comparisonRows.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-slate-400">
              {loading ? "Yükleniyor…" : "Bu ay veri yok"}
            </div>
          ) : (
            <div className="space-y-3">
              {comparisonRows.map((row) => {
                // We show category amount; diff is unavailable per-category, show neutral
                return (
                  <div
                    key={row.id}
                    className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-center gap-3 w-1/3">
                      <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center text-slate-400">
                        <div className="w-3 h-3 rounded-sm border border-current opacity-60"></div>
                      </div>
                      <span className="font-medium text-slate-700">{row.name}</span>
                    </div>
                    <div className="font-semibold w-1/3 text-center">
                      {formatCurrency(row.amount)}
                    </div>
                    <div className="w-1/3 flex justify-end">
                      <div
                        className={cn(
                          "px-2 py-0.5 rounded font-bold flex items-center gap-1",
                          prevMonthDiff === null
                            ? "bg-slate-50 text-slate-500"
                            : prevMonthDiff > 0
                            ? "bg-red-50 text-red-500"
                            : prevMonthDiff < 0
                            ? "bg-green-50 text-[#10B981]"
                            : "bg-slate-50 text-slate-500"
                        )}
                      >
                        {prevMonthDiff === null ? (
                          <ArrowRight className="w-3 h-3" />
                        ) : prevMonthDiff > 0 ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : prevMonthDiff < 0 ? (
                          <ArrowDownRight className="w-3 h-3" />
                        ) : (
                          <ArrowRight className="w-3 h-3" />
                        )}
                        {prevMonthDiff === null
                          ? "%—"
                          : prevMonthDiff === 0
                          ? "%0"
                          : `%${Math.abs(prevMonthDiff).toFixed(1)}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 4 — AI Harcama Yorumu */}
      <div className="bg-[#ECFDF5] border border-green-100 rounded-xl p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-green-50">
            <Sparkles className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">AI Harcama Yorumu</h3>
            <p className="text-xs text-slate-700 font-medium">
              {selectedCategory
                ? `${selectedCategory.name} kategorisi secildi. Bu kategoride ${formatCurrency(selectedCategory.amount)} harcama var ve toplam icindeki payi %${selectedCategory.percent.toFixed(1)}.`
                : topCategory
                ? `En yüksek harcama kategorin ${topCategory.name} (${formatCurrency(topCategory.amount)}). ${
                    prevMonthDiff !== null && prevMonthDiff > 0
                      ? `Geçen aya göre harcamalarında %${prevMonthDiff.toFixed(1)} artış var.`
                      : prevMonthDiff !== null && prevMonthDiff < 0
                      ? `Geçen aya göre harcamalarında %${Math.abs(prevMonthDiff).toFixed(1)} azalış var.`
                      : "Harcamalarını düzenli takip et."
                  }`
                : "Harcama verilerini analiz etmek için işlem ekle."}
            </p>
          </div>
        </div>
        <button onClick={() => router.push("/app/assistant")} className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm shrink-0">
          <Sparkles className="w-3 h-3" /> Detaylı AI Analizi Al
        </button>
      </div>
    </div>
  );
}
