"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Info,
  CheckCircle2,
  Circle,
  CreditCard,
  HeartPulse,
  BarChart2,
  ArrowDown,
  PieChart as PieChartIcon
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { FilterSelect } from "@/components/ui/filter-select";

interface OverviewStats {
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashflow: number;
  savingRate: number;
  debtLoadRatio: number;
  healthScore: number;
  healthStatusLabel: string;
  activeGoalsCount?: number;
}

interface OverviewChanges {
  incomeChange: number;
  expenseChange: number;
}

interface TopCategory {
  name: string;
  icon: string;
  color: string;
  amount: number;
  percent: number;
}

interface RecentTransaction {
  id: string;
  title: string;
  type: string;
  amount: number;
  date: string;
  category: string;
}

interface UpcomingPayment {
  id?: string;
  title: string;
  dueDate: string;
  amount: number;
  icon?: string;
}

interface TrendDataPoint {
  label: string;
  gelir: number;
  gider: number;
}

type DashboardTrendRange = "3" | "6" | "12" | "ALL";

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface MonthlyTrendPayload {
  label: string;
  totalIncome: number;
  totalExpenses: number;
}

interface RecentTransactionPayload {
  id: string;
  title: string;
  type: string;
  amount: number;
  date: string;
  category?: string | { name?: string | null } | null;
}

interface UpcomingPaymentPayload {
  id?: string;
  title: string;
  amount: number;
  dueDate?: string;
  nextBillingDate?: string;
  icon?: string;
}

interface OverviewPayload {
  stats?: OverviewStats;
  changes?: OverviewChanges;
  topCategories?: TopCategory[];
  recentTransactions?: RecentTransactionPayload[];
  upcomingPayments?: UpcomingPaymentPayload[];
  goals?: Array<{ progressPercent?: number }>;
}

interface ActionPlanItem {
  id: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
  priority: number;
  dueDate: string | null;
}

interface ActionPlanPayload {
  items?: ActionPlanItem[];
}

function isApiSuccess<T>(payload: unknown): payload is ApiSuccess<T> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as { success?: unknown }).success === true &&
    "data" in payload
  );
}

function unwrapApiData<T>(payload: unknown): T | null {
  return isApiSuccess<T>(payload) ? payload.data : (payload as T);
}

function formatDashboardDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OverviewStats>({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netCashflow: 0,
    savingRate: 0,
    debtLoadRatio: 0,
    healthScore: 0,
    healthStatusLabel: "",
  });
  const [changes, setChanges] = useState<OverviewChanges>({ incomeChange: 0, expenseChange: 0 });
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [trendRange, setTrendRange] = useState<DashboardTrendRange>("6");
  const [goalProgressAverage, setGoalProgressAverage] = useState(0);
  const [actionItems, setActionItems] = useState<ActionPlanItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewRes, trendRes, actionPlanRes] = await Promise.all([
          fetch("/api/analytics/overview"),
          fetch("/api/analytics/monthly-trend"),
          fetch("/api/ai/action-plan"),
        ]);

        if (overviewRes.ok) {
          const overview = unwrapApiData<OverviewPayload>(await overviewRes.json());
          if (overview?.stats) setStats(overview.stats);
          if (overview?.changes) setChanges(overview.changes);
          if (Array.isArray(overview?.topCategories)) setTopCategories(overview.topCategories);
          if (Array.isArray(overview?.recentTransactions)) {
            setRecentTransactions(
              overview.recentTransactions.map((tx) => ({
                id: tx.id,
                title: tx.title,
                type: tx.type.toLowerCase(),
                amount: tx.amount,
                date: formatDashboardDate(tx.date),
                category: typeof tx.category === "string" ? tx.category : tx.category?.name ?? "Diğer",
              }))
            );
          }
          if (Array.isArray(overview?.upcomingPayments)) {
            setUpcomingPayments(
              overview.upcomingPayments.map((payment) => ({
                id: payment.id,
                title: payment.title,
                amount: payment.amount,
                dueDate: formatDashboardDate(payment.dueDate ?? payment.nextBillingDate),
                icon: payment.icon,
              }))
            );
          }
          if (Array.isArray(overview?.goals)) {
            const totalProgress = overview.goals.reduce((sum, goal) => sum + (goal.progressPercent ?? 0), 0);
            setGoalProgressAverage(overview.goals.length > 0 ? totalProgress / overview.goals.length : 0);
          }
        }

        if (trendRes.ok) {
          const trendPayload = unwrapApiData<MonthlyTrendPayload[]>(await trendRes.json());
          const trendRaw = Array.isArray(trendPayload) ? trendPayload : [];
          setTrendData(
            trendRaw.map((d) => ({ label: d.label, gelir: d.totalIncome, gider: d.totalExpenses }))
          );
        }

        if (actionPlanRes.ok) {
          const actionPayload = unwrapApiData<ActionPlanPayload>(await actionPlanRes.json());
          setActionItems(Array.isArray(actionPayload?.items) ? actionPayload.items : []);
        }
      } catch {
        toast.error("Dashboard verileri yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categoryTotal = topCategories.reduce((sum, c) => sum + c.amount, 0);
  const visibleTrendData = trendRange === "ALL" ? trendData : trendData.slice(-Number(trendRange));
  const savingRate = Math.round(stats.savingRate);
  const savingRateProgress = Math.min(Math.max(savingRate, 0), 100);
  const healthScore = Math.round(stats.healthScore);
  const healthScoreProgress = Math.min(Math.max(healthScore, 0), 100);
  const incomeExpenseScore = stats.monthlyIncome > 0
    ? Math.round(Math.max(0, Math.min(100, 100 - (stats.monthlyExpenses / stats.monthlyIncome) * 100)))
    : 0;
  const savingScore = Math.round(Math.max(0, Math.min(100, (stats.savingRate / 30) * 100)));
  const debtScore = Math.round(Math.max(0, Math.min(100, 100 - stats.debtLoadRatio * 2.5)));
  const spendingScore = Math.round(Math.max(0, Math.min(100, 100 - (topCategories[0]?.percent ?? 0))));
  const goalScore = Math.round(Math.max(0, Math.min(100, goalProgressAverage)));
  const healthBreakdown = [
    { label: "Gelir-Gider", val: incomeExpenseScore, color: incomeExpenseScore < 40 ? "bg-red-500" : incomeExpenseScore < 70 ? "bg-yellow-500" : "bg-[#10B981]" },
    { label: "Tasarruf", val: savingScore, color: savingScore < 40 ? "bg-red-500" : savingScore < 70 ? "bg-yellow-500" : "bg-[#10B981]" },
    { label: "Borç Yükü", val: debtScore, color: debtScore < 40 ? "bg-red-500" : debtScore < 70 ? "bg-yellow-500" : "bg-[#10B981]" },
    { label: "Harcama Disiplini", val: spendingScore, color: spendingScore < 40 ? "bg-red-500" : spendingScore < 70 ? "bg-yellow-500" : "bg-[#10B981]" },
    { label: "Hedef İlerlemesi", val: goalScore, color: goalScore < 40 ? "bg-red-500" : goalScore < 70 ? "bg-yellow-500" : "bg-[#10B981]" },
  ];
  const weeklyInsight = topCategories.length > 0
    ? `${topCategories[0].name} bu ay en yüksek gider kategorin. ${actionItems.length > 0 ? `Bu hafta ${actionItems.filter((item) => item.status !== "COMPLETED").length} açık aksiyonun var.` : "Yeni aksiyon planı oluşturarak odak alanlarını netleştirebilirsin."}`
    : stats.monthlyIncome > 0
      ? "Bu ay kaydedilmiş gider görünmüyor. Harcama ekledikçe AI tespitleri burada güncellenecek."
      : "Finans verilerini ekledikçe haftalık AI tespitleri burada kişiselleşecek.";
  const dashboardActionItems = [...actionItems]
    .sort((a, b) => {
      if (a.status === "COMPLETED" && b.status !== "COMPLETED") return 1;
      if (a.status !== "COMPLETED" && b.status === "COMPLETED") return -1;
      return a.priority - b.priority;
    })
    .slice(0, 4);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 font-sans text-slate-900 pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finans Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Bu ayki gelir, gider, hedef ve finansal sağlık durumun.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm h-32 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-slate-100 rounded w-2/3"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1.2fr] gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-48 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-slate-100 rounded"></div>
          </div>
          <div className="bg-[#ECFDF5] border border-green-100 rounded-xl p-6 shadow-sm h-48 animate-pulse">
            <div className="h-4 bg-green-100 rounded w-1/2 mb-4"></div>
            <div className="h-24 bg-green-100 rounded"></div>
          </div>
        </div>
        <div className="text-center text-slate-500 text-sm py-4">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 font-sans text-slate-900">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finans Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bu ayki gelir, gider, hedef ve finansal sağlık durumun.
        </p>
      </div>

      {/* Row 1 — 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Aylık Gelir */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
              </div>
              Aylık Gelir
            </div>
            <div className="text-3xl font-bold text-[#10B981]">₺{stats.monthlyIncome.toLocaleString('tr-TR')}</div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded bg-[#ECFDF5] px-1.5 py-0.5 font-semibold text-[#10B981]">
              <ArrowRight className="w-3 h-3 -rotate-45" /> {changes.incomeChange >= 0 ? "+" : ""}{changes.incomeChange}%
            </span>
            <span className="text-slate-500">Geçen aya göre</span>
          </div>
        </div>

        {/* Aylık Gider */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-yellow-500" />
              </div>
              Aylık Gider
            </div>
            <div className="text-3xl font-bold text-red-500">₺{stats.monthlyExpenses.toLocaleString('tr-TR')}</div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded bg-yellow-50 px-1.5 py-0.5 font-semibold text-yellow-600">
              <ArrowRight className="w-3 h-3 -rotate-45" /> {changes.expenseChange >= 0 ? "+" : ""}{changes.expenseChange}%
            </span>
            <span className="text-slate-500">Geçen aya göre</span>
          </div>
        </div>

        {/* Net Nakit Akışı */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <WalletIcon className="w-4 h-4 text-blue-500" />
              </div>
              Net Nakit Akışı
            </div>
            <div className="text-3xl font-bold text-[#10B981]">₺{stats.netCashflow.toLocaleString('tr-TR')}</div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 font-medium text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span> {stats.netCashflow >= 0 ? "Pozitif" : "Negatif"}
            </span>
          </div>
        </div>

        {/* Tasarruf Oranı */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between overflow-hidden">
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                  <TargetIcon className="w-4 h-4 text-[#10B981]" />
                </div>
                Tasarruf Oranı
              </div>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">%{savingRate}</div>
            </div>
            <div className="text-xs text-slate-500 mt-4">Hedef: %30</div>
          </div>
          {/* Donut progress */}
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray={`${savingRateProgress}, 100`} />
            </svg>
          </div>
        </div>
      </div>

      {/* Row 2 — Finansal Sağlık + AI Tespit */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1.2fr] gap-4">
        {/* Finansal Sağlık Skoru */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center gap-5">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 mb-4">
              Finansal Sağlık Skoru <Info className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray={`${healthScoreProgress}, 100`} />
                </svg>
                <div className="absolute text-center flex flex-col items-center">
                  <span className="text-3xl font-bold text-slate-900 leading-none">{healthScore}<span className="text-sm font-normal text-slate-400">/100</span></span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-[#ECFDF5] text-[#10B981] text-xs font-semibold rounded-full">
                <HeartPulse className="w-3.5 h-3.5" /> {stats.healthStatusLabel || "İyi, geliştirilebilir"}
              </div>
            </div>
          </div>

          <div className="flex-[2] w-full flex flex-col justify-center gap-3">
            {healthBreakdown.map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-32 text-xs font-medium text-slate-600">{item.label}</div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }}></div>
                </div>
                <div className="w-10 text-right text-xs font-semibold text-slate-700">{item.val}/100</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Haftalık Tespit */}
        <div className="bg-[#ECFDF5] border border-green-100 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="font-semibold text-slate-900 mb-4 text-sm">AI Haftalık Tespit</div>
          <div className="flex gap-4 items-start mb-5">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 border border-green-50 shadow-sm">
              <BotIcon className="w-6 h-6 text-[#10B981]" />
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {weeklyInsight}
            </p>
          </div>
          <div className="mt-auto">
            <button
              onClick={() => router.push("/app/assistant")}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-lg py-2.5 text-sm font-semibold transition-colors"
            >
              Detaylı Analiz
            </button>
          </div>
        </div>
      </div>

      {/* Row 3 — Gelir / Gider Trendi + Kategori Dağılımı */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Gelir / Gider Trendi</h2>
            <FilterSelect<DashboardTrendRange>
              ariaLabel="Dashboard trend dönemi"
              value={trendRange}
              onChange={setTrendRange}
              options={[
                { value: "3", label: "Son 3 Ay" },
                { value: "6", label: "Son 6 Ay" },
                { value: "12", label: "Son 12 Ay" },
                { value: "ALL", label: "Tümü" },
              ]}
              triggerClassName="h-8 min-w-28"
            />
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={visibleTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGider" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip />
                <Area type="monotone" dataKey="gelir" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorGelir)" isAnimationActive={false} />
                <Area type="monotone" dataKey="gider" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorGider)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kategori Dağılımı */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-900 mb-6">Kategori Dağılımı</h2>
          <div className="flex flex-1 flex-col items-center justify-between gap-5 sm:flex-row">
            <div className="w-44 h-44 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie data={topCategories.map(c => ({ name: c.name, value: c.amount, color: c.color }))} cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={2} dataKey="value" stroke="none" isAnimationActive={false}>
                    {topCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white"></div>
              </div>
            </div>

            <div className="w-full min-w-0 flex-1 sm:pl-6">
              <div className="space-y-2.5">
                {topCategories.map(cat => (
                  <div key={cat.name} className="flex items-center text-xs">
                    <div className="flex w-28 items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                      <span className="truncate font-medium text-slate-700">{cat.name}</span>
                    </div>
                    <div className="flex-1 text-right font-medium">₺{cat.amount.toLocaleString('tr-TR')}</div>
                    <div className="w-12 text-right text-slate-500 tabular-nums">%{Math.round(cat.percent)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Toplam</span>
                <span>₺{categoryTotal.toLocaleString('tr-TR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4 — Yaklaşan Ödemeler | Haftalık Aksiyon Planı | Son İşlemler */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Yaklaşan Ödemeler */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Yaklaşan Ödemeler</h2>
            <Link href="/app/subscriptions" className="text-xs font-semibold text-[#10B981] hover:underline">Tümünü Gör</Link>
          </div>
          <div className="space-y-3 flex-1">
            {upcomingPayments.length > 0 ? (
              upcomingPayments.map((payment, index) => (
                <div key={payment.id ?? index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded border border-slate-100 flex items-center justify-center bg-slate-50">
                      <CreditCard className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{payment.title}</div>
                      <div className="text-xs text-slate-500">Son ödeme: {payment.dueDate}</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-red-500">₺{payment.amount.toLocaleString('tr-TR')}</div>
                </div>
              ))
            ) : (
              <div className="flex h-full min-h-[150px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center">
                <CreditCard className="mb-2 h-6 w-6 text-slate-300" />
                <div className="text-sm font-semibold text-slate-700">Yaklaşan ödeme yok</div>
                <p className="mt-1 text-xs text-slate-400">Aktif abonelik veya vadesi yaklaşan ödeme eklenince burada görünür.</p>
              </div>
            )}
          </div>
        </div>

        {/* Haftalık Aksiyon Planı */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"><SparklesIcon className="w-4 h-4 text-[#10B981]" /> Haftalık Aksiyon Planı</h2>
          </div>
          <div className="space-y-3 flex-1">
            {dashboardActionItems.length > 0 ? (
              dashboardActionItems.map((item) => {
                const isDone = item.status === "COMPLETED";
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-[#10B981]" />
                      ) : (
                        <Circle className="w-5 h-5 shrink-0 text-slate-300" />
                      )}
                      <span className={`truncate text-sm ${isDone ? "text-slate-600 line-through" : "text-slate-700"}`}>{item.title}</span>
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold ${isDone ? "text-[#10B981]" : item.status === "IN_PROGRESS" ? "text-orange-500" : "text-slate-400"}`}>
                      {isDone ? "Tamamlandı" : item.status === "IN_PROGRESS" ? "Sürüyor" : "Bekliyor"}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full min-h-[150px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center">
                <SparklesIcon className="mb-2 h-6 w-6 text-slate-300" />
                <div className="text-sm font-semibold text-slate-700">Aksiyon planı yok</div>
                <p className="mt-1 text-xs text-slate-400">AI aksiyonları oluşturulduğunda burada gerçek görevlerin görünür.</p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-2 border-t border-slate-50">
            <Link href="/app/action-plan" className="text-xs font-semibold text-[#10B981] hover:underline">Tüm aksiyonları gör</Link>
          </div>
        </div>

        {/* Son İşlemler */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5"><ListIcon className="w-4 h-4 text-slate-700" /> Son İşlemler</h2>
            <Link href="/app/transactions" className="text-xs font-semibold text-[#10B981] hover:underline">Tümünü Gör</Link>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] text-[11px] font-semibold text-slate-500 mb-2 border-b border-slate-100 pb-2">
            <div>İşlem</div>
            <div>Kategori</div>
            <div>Tarih</div>
            <div className="text-right">Tutar</div>
          </div>

          <div className="space-y-3 flex-1 overflow-hidden">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center text-xs">
                  <div className="font-medium text-slate-800">{tx.title}</div>
                  <div className="text-slate-500">{tx.category}</div>
                  <div className="text-slate-500">{tx.date}</div>
                  <div className={`text-right font-semibold ${tx.type === "income" ? "text-[#10B981]" : "text-red-500"}`}>
                    {tx.type === "income" ? "+" : "-"}₺{Math.abs(tx.amount).toLocaleString('tr-TR')}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full min-h-[150px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center">
                <ListIcon className="mb-2 h-6 w-6 text-slate-300" />
                <div className="text-sm font-semibold text-slate-700">İşlem kaydı yok</div>
                <p className="mt-1 text-xs text-slate-400">Gelir veya gider eklediğinde son işlemler burada görünür.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-2 border-t border-slate-50">
            <Link href="/app/transactions" className="text-xs font-semibold text-[#10B981] hover:underline">Tüm işlemleri gör</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
const WalletIcon = (props:any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
const TargetIcon = (props:any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
const BotIcon = (props:any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
const SparklesIcon = (props:any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>
const ListIcon = (props:any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
