"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  HeartPulse,
  RefreshCcw,
  ArrowDownUp,
  Target,
  CreditCard,
  ShieldCheck,
  Flag,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { OwlIcon } from "@/components/brand/owl-icon";
import { FilterSelect } from "@/components/ui/filter-select";

interface HealthScoreResult {
  score: number;
  incomeExpenseRatio: number;
  savingRate: number;
  debtLoad: number;
  spendingDiscipline: number;
  goalProgress: number;
  statusLabel: string;
  statusColor: string;
  explanation: string;
}

interface HealthScoreHistoryItem {
  score: number;
  incomeExpenseRatio: number;
  savingRate: number;
  debtLoad: number;
  spendingDiscipline: number;
  goalProgress: number;
  createdAt: string;
}

type ComponentKey =
  | "incomeExpenseRatio"
  | "savingRate"
  | "debtLoad"
  | "spendingDiscipline"
  | "goalProgress";

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export default function HealthScorePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [result, setResult] = React.useState<HealthScoreResult | null>(null);
  const [trendData, setTrendData] = React.useState<Array<HealthScoreHistoryItem & { label: string }>>([]);
  const [selectedComponent, setSelectedComponent] = React.useState<string | null>(null);
  const [historyLimit, setHistoryLimit] = React.useState(6);

  const fetchHistory = React.useCallback(async () => {
    const getRes = await fetch(`/api/analytics/health-score?limit=${historyLimit}`);
    if (getRes.ok) {
      const getJson = await getRes.json();
      const history: HealthScoreHistoryItem[] = getJson.data ?? getJson;
      const mapped = [...history]
        .reverse()
        .map((item) => ({
          ...item,
          label: new Date(item.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }),
        }));
      setTrendData(mapped);
    }
  }, [historyLimit]);

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const postRes = await fetch("/api/analytics/health-score", { method: "POST" });

        if (postRes.ok) {
          const postJson = await postRes.json();
          const data = postJson.data ?? postJson;
          setResult(data);
        }

      } finally {
        setLoading(false);
      }
    }

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!loading) void fetchHistory();
  }, [fetchHistory, loading]);

  const score = result?.score ?? 0;
  const statusLabel = result?.statusLabel ?? "Hesaplanıyor...";
  const statusColor = result?.statusColor ?? "#10B981";
  const explanation = result?.explanation ?? "";

  // Component scores — already in their point range (0-25, 0-20, 0-20, 0-20, 0-15)
  const incomeExpenseScore = clamp(result?.incomeExpenseRatio ?? 0, 0, 25);
  const savingScore = clamp(result?.savingRate ?? 0, 0, 20);
  const debtScore = clamp(result?.debtLoad ?? 0, 0, 20);
  const spendingScore = clamp(result?.spendingDiscipline ?? 0, 0, 20);
  const goalScore = clamp(result?.goalProgress ?? 0, 0, 15);

  // Determine colors based on score thresholds
  function getComponentColor(score: number, max: number): { bg: string; text: string; dot: string } {
    const pct = (score / max) * 100;
    if (pct >= 70) return { bg: "bg-[#10B981]", text: "text-[#10B981]", dot: "bg-[#10B981]" };
    if (pct >= 40) return { bg: "bg-orange-500", text: "text-orange-500", dot: "bg-orange-500" };
    return { bg: "bg-red-500", text: "text-red-500", dot: "bg-red-500" };
  }

  function getComponentStat(score: number, max: number): string {
    const pct = (score / max) * 100;
    if (pct >= 80) return "İyi";
    if (pct >= 60) return "Orta-İyi";
    if (pct >= 40) return "Orta";
    return "İyileştirilmeli";
  }

  function getTrendValue(item: HealthScoreHistoryItem, key: ComponentKey): number {
    switch (key) {
      case "incomeExpenseRatio":
        return clamp(item.incomeExpenseRatio, 0, 25);
      case "savingRate":
        return clamp(item.savingRate, 0, 20);
      case "debtLoad":
        return clamp(item.debtLoad, 0, 20);
      case "spendingDiscipline":
        return clamp(item.spendingDiscipline, 0, 20);
      case "goalProgress":
        return clamp(item.goalProgress, 0, 15);
      default:
        return item.score;
    }
  }

  const breakdownItems = [
    { label: "Gelir-Gider Dengesi", icon: ArrowDownUp, score: incomeExpenseScore, max: 25 },
    { label: "Tasarruf Oranı", icon: Target, score: savingScore, max: 20 },
    { label: "Borç Yükü", icon: CreditCard, score: debtScore, max: 20 },
    { label: "Harcama Disiplini", icon: ShieldCheck, score: spendingScore, max: 20 },
    { label: "Hedef İlerlemesi", icon: Flag, score: goalScore, max: 15 },
  ];

  const componentCardDescs = [
    "Gelirlerin giderlerini karşılama performansı.",
    "Gelirlerinden ne kadarını tasarruf ettiğin.",
    "Toplam borçlarının gelirine oranı.",
    "Bütçene uyma ve gereksiz harcamalardan kaçınma.",
    "Finansal hedeflerine ulaşma hızın.",
  ];
  const strengthItems = breakdownItems
    .filter((item) => (item.score / item.max) * 100 >= 70)
    .map((item) => item.label);
  const improvementItems = breakdownItems
    .filter((item) => (item.score / item.max) * 100 < 70)
    .sort((a, b) => (a.score / a.max) - (b.score / b.max))
    .map((item) => item.label);
  const selectedBreakdown = breakdownItems.find((item) => item.label === selectedComponent);
  const selectedTrendData = trendData.slice(-historyLimit).map((item) => {
    const value =
      selectedComponent === "Gelir-Gider Dengesi"
        ? clamp(item.incomeExpenseRatio, 0, 25)
        : selectedComponent === "Tasarruf Oranı"
        ? clamp(item.savingRate, 0, 20)
        : selectedComponent === "Borç Yükü"
        ? clamp(item.debtLoad, 0, 20)
        : selectedComponent === "Harcama Disiplini"
        ? clamp(item.spendingDiscipline, 0, 20)
        : selectedComponent === "Hedef İlerlemesi"
        ? clamp(item.goalProgress, 0, 15)
        : item.score;

    return { label: item.label, value };
  });
  const trendSeries = selectedComponent
    ? trendData.slice(-historyLimit).map((item) => ({
        label: item.label,
        value: getTrendValue(
          item,
          selectedComponent as
            | "incomeExpenseRatio"
            | "savingRate"
            | "debtLoad"
            | "spendingDiscipline"
            | "goalProgress",
        ),
      }))
    : trendData.slice(-historyLimit).map((item) => ({ label: item.label, value: item.score }));
  const selectedTrendMax = selectedBreakdown?.max ?? 100;
  const coachActions = (improvementItems.length > 0 ? improvementItems : breakdownItems.map((item) => item.label))
    .slice(0, 3)
    .map((label, index) => `${index + 1}. ${label} için bu hafta somut bir iyileştirme adımı belirle.`);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 font-sans text-slate-900 pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finansal Sağlık Skoru</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gelir-gider dengesi, tasarruf oranı, borç yükü ve hedef ilerlemene göre hesaplanır.
          </p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center min-h-[200px]">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-[#10B981] animate-spin"></div>
              <span className="text-sm font-medium">Hesaplanıyor...</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-7 h-7 rounded bg-slate-100 shrink-0"></div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full"></div>
                  <div className="w-12 h-3 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finansal Sağlık Skoru</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gelir-gider dengesi, tasarruf oranı, borç yükü ve hedef ilerlemene göre hesaplanır.
        </p>
      </div>

      {/* Row 1 — Main Score + Breakdown List */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-4">
        {/* Circle Score Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-green-50 rounded-bl-full opacity-50 z-0"></div>

          <div className="flex items-start gap-8 z-10 w-full justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={statusColor} strokeWidth="3" strokeDasharray={`${score}, 100`} />
              </svg>
              <div className="absolute text-center flex flex-col items-center">
                <span className="text-4xl font-bold text-slate-900 leading-none">{score}<span className="text-base font-normal text-slate-400">/100</span></span>
              </div>
            </div>

            <div className="flex flex-col items-start text-left pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full mb-4" style={{ backgroundColor: `${statusColor}1A`, color: statusColor }}>
                <HeartPulse className="w-3.5 h-3.5" /> {statusLabel}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium max-w-[200px]">
                {explanation || "Finansal durumun analiz edildi. Detaylar için aşağıyı incele."}
              </p>
              <button
                onClick={() => router.push("/app/assistant")}
                className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Strateji Geliştir
              </button>
            </div>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-center">
          <div className="space-y-4">
            {breakdownItems.map((item) => {
              const colors = getComponentColor(item.score, item.max);
              const IconComp = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 w-48">
                    <div className="w-7 h-7 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <IconComp className={cn("w-4 h-4", colors.text)} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                  </div>
                  <div className="flex-1 px-6">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", colors.bg)} style={{ width: `${(item.score / item.max) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="w-12 text-right text-xs font-bold">
                    <span className={colors.text}>{Math.round(item.score)}</span> <span className="text-slate-400">/ {item.max}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2 — 5 Component Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {breakdownItems.map((card, idx) => {
          const colors = getComponentColor(card.score, card.max);
          const stat = getComponentStat(card.score, card.max);
          const IconComp = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => setSelectedComponent(card.label)}
              className={cn(
                "bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col text-left transition-colors hover:border-[#10B981]",
                selectedComponent === card.label && "border-[#10B981] bg-green-50/20"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center shrink-0">
                  <IconComp className={cn("w-4 h-4", colors.text)} />
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight">{card.label}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed mb-4 flex-1">{componentCardDescs[idx]}</p>

              <div className="mt-auto">
                <div className="text-lg font-bold mb-2">
                  <span className={colors.text}>{Math.round(card.score)}</span> <span className="text-sm font-medium text-slate-400">/ {card.max}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className={cn("h-full rounded-full", colors.bg)} style={{ width: `${(card.score / card.max) * 100}%` }}></div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600">
                  <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)}></span> {stat}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Row 3 — Güçlü Alanlar + İyileştirilmesi Gerekenler */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Güçlü Alanlar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Güçlü Alanlar
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <div className="w-4 h-4 rounded-full bg-[#10B981] flex items-center justify-center text-white shrink-0"><CheckCircle2 className="w-3 h-3" /></div>
              {strengthItems[0] ?? "Veri bekleniyor"}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <div className="w-4 h-4 rounded-full bg-[#10B981] flex items-center justify-center text-white shrink-0"><CheckCircle2 className="w-3 h-3" /></div>
              {strengthItems[1] ?? "Skor bileşenleri güçlenince burada görünür"}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <div className="w-4 h-4 rounded-full bg-[#10B981] flex items-center justify-center text-white shrink-0"><CheckCircle2 className="w-3 h-3" /></div>
              {strengthItems[2] ?? "Bileşen kartlarından detay seç"}
            </div>
          </div>
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center opacity-80">
            <div className="w-12 h-12 rounded-full border-2 border-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
            </div>
          </div>
        </div>

        {/* İyileştirilmesi Gereken Alanlar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> İyileştirilmesi Gereken Alanlar
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0">!</div>
              {improvementItems[0] ?? "Belirgin iyilestirme alani yok"}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0">!</div>
              {improvementItems[1] ?? "Skor dengeli gorunuyor"}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white shrink-0">!</div>
              {improvementItems[2] ?? "Takip etmeye devam et"}
            </div>
          </div>
          <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center opacity-80">
            <div className="w-12 h-12 rounded-full border-2 border-orange-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 4 — Skor Geçmişi + AI Yorum */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        {/* Skor Geçmişi */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{selectedComponent ?? "Skor"} Geçmişi</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Son {historyLimit} hesaplama</p>
            </div>
            <FilterSelect<"3" | "6" | "12">
              ariaLabel="Skor geçmişi dönemi"
              value={String(historyLimit) as "3" | "6" | "12"}
              onChange={(value) => setHistoryLimit(Number(value))}
              options={[
                { value: "3", label: "Son 3" },
                { value: "6", label: "Son 6" },
                { value: "12", label: "Son 12" },
              ]}
              triggerClassName="h-8 min-w-24"
            />
          </div>
          <div className="h-48 flex-1">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={selectedTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} dy={10} />
                <YAxis domain={[0, selectedTrendMax]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={{ r: 4, fill: "#10B981" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Skor Yorumu */}
        <div className="bg-[#ECFDF5] border border-green-100 rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-white rounded-tl-full opacity-20 z-0"></div>

          <div className="z-10 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <OwlIcon className="w-5 h-5 text-[#10B981]" />
              <h2 className="text-sm font-bold text-slate-900">AI Skor Yorumu</h2>
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed mb-6">
              {selectedBreakdown
                ? `${selectedBreakdown.label} secildi: ${Math.round(selectedBreakdown.score)} / ${selectedBreakdown.max} puan.`
                : explanation || "Finansal saglik bilesenlerin mevcut verilerle hesaplandi."}
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-800">
                <div className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">1</div>
                {coachActions[0]?.replace("1. ", "")}
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-800">
                <div className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">2</div>
                {coachActions[1]?.replace("2. ", "")}
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-800">
                <div className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">3</div>
                {coachActions[2]?.replace("3. ", "")}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
