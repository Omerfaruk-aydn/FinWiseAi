"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  Wallet, 
  CreditCard,
  PiggyBank,
  CheckCircle2,
  TrendingDown,
  Target,
  ArrowRight,
  Sparkles,
  Info,
  ChevronRight,
  Flame,
  AlertTriangle,
  Plus,
  RefreshCcw,
  X,
  Home,
  ShoppingCart,
  Car,
  Utensils,
  Receipt,
  Circle
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from "recharts";
import { cn } from "@/lib/utils";
import { normalizeCategoryKey } from "@/lib/category-utils";
import { toast } from "sonner";

type BudgetCategoryItem = {
  categoryId: string;
  plannedAmount: number;
  actualAmount: number;
  category: { name: string; icon?: string | null; color: string };
};

type Budget = {
  month: number;
  year: number;
  totalIncome: number;
  plannedExpense: number;
  plannedSaving: number;
  categories: BudgetCategoryItem[];
};

type Category = {
  id: string;
  name: string;
};

function getBudgetCategoryIcon(icon: string | null | undefined, color: string) {
  const className = "w-4 h-4";

  switch (icon) {
    case "home":
      return <Home className={className} style={{ color }} />;
    case "shopping-cart":
      return <ShoppingCart className={className} style={{ color }} />;
    case "car":
      return <Car className={className} style={{ color }} />;
    case "utensils":
      return <Utensils className={className} style={{ color }} />;
    case "receipt":
      return <Receipt className={className} style={{ color }} />;
    case "credit-card":
      return <CreditCard className={className} style={{ color }} />;
    default:
      return <Circle className={className} style={{ color }} />;
  }
}

export default function BudgetPage() {
  const router = useRouter();
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isCompareOpen, setIsCompareOpen] = React.useState(false);

  const [formData, setFormData] = React.useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    totalIncome: "",
    plannedExpense: "",
    plannedSaving: "",
    categoryLimits: [] as { categoryId: string, plannedAmount: string }[]
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        fetch("/api/budget"),
        fetch("/api/categories?type=EXPENSE")
      ]);
      const bJson = await bRes.json();
      const cJson = await cRes.json();
      
      if (bJson.success) setBudgets(bJson.data);
      if (cJson.success) setCategories(cJson.data);
    } catch {
      toast.error("Bütçe verileri yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const categoryOptions = React.useMemo(() => {
    const seen = new Set<string>();
    return categories.filter((category) => {
      const key = normalizeCategoryKey(category.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categories]);

  const currentBudget = budgets.length > 0 ? budgets[0] : null;
  const previousBudget = budgets.length > 1 ? budgets[1] : null;

  const openModal = () => {
    if (currentBudget) {
      setFormData({
        month: currentBudget.month,
        year: currentBudget.year,
        totalIncome: currentBudget.totalIncome.toString(),
        plannedExpense: currentBudget.plannedExpense.toString(),
        plannedSaving: currentBudget.plannedSaving.toString(),
        categoryLimits: currentBudget.categories.map((c) => ({
          categoryId: c.categoryId,
          plannedAmount: c.plannedAmount.toString()
        }))
      });
    } else {
      setFormData({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        totalIncome: "",
        plannedExpense: "",
        plannedSaving: "",
        categoryLimits: []
      });
    }
    setIsModalOpen(true);
  };

  const handleAddCategoryLimit = () => {
    if (categories.length === 0) return;
    setFormData(prev => ({
      ...prev,
      categoryLimits: [...prev.categoryLimits, { categoryId: categories[0].id, plannedAmount: "" }]
    }));
  };

  const handleCategoryLimitChange = (index: number, field: string, value: string) => {
    const newLimits = [...formData.categoryLimits];
    newLimits[index] = { ...newLimits[index], [field]: value };
    setFormData({ ...formData, categoryLimits: newLimits });
  };

  const handleRemoveCategoryLimit = (index: number) => {
    const newLimits = [...formData.categoryLimits];
    newLimits.splice(index, 1);
    setFormData({ ...formData, categoryLimits: newLimits });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        month: Number(formData.month),
        year: Number(formData.year),
        totalIncome: Number(formData.totalIncome),
        plannedExpense: Number(formData.plannedExpense),
        plannedSaving: Number(formData.plannedSaving),
        categories: formData.categoryLimits.map(c => ({
          categoryId: c.categoryId,
          plannedAmount: Number(c.plannedAmount)
        }))
      };

      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success("Bütçe kaydedildi.");
        setIsModalOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error?.message || "Bilinmeyen bir hata oluştu.");
      }
    } catch {
      toast.error("Bütçe kaydedilemedi.");
    }
  };

  const handleSaveComparison = async () => {
    try {
      const res = await fetch("/api/budget/compare", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);
      toast.success("Bütçe karşılaştırması raporlara kaydedildi.");
      setIsCompareOpen(false);
      router.push("/app/reports");
    } catch {
      toast.error("Karşılaştırma kaydedilemedi.");
    }
  };

  const planData = currentBudget?.categories?.map((c) => ({
    name: c.category.name,
    icon: getBudgetCategoryIcon(c.category.icon, c.category.color),
    planned: c.plannedAmount,
    actual: c.actualAmount,
    color: c.category.color
  })) || [];
  const plannedExpense = currentBudget?.plannedExpense ?? 0;

  const pieData = planData.filter((p) => p.planned > 0).map((p) => ({
    name: p.name,
    value: p.planned,
    percent: plannedExpense > 0 ? Math.round((p.planned / plannedExpense) * 100) : 0,
    color: p.color
  }));

  const totalUsed = currentBudget?.categories?.reduce((sum, c) => sum + c.actualAmount, 0) || 0;
  const usePercentage = plannedExpense > 0 ? Math.round((totalUsed / plannedExpense) * 100) : 0;
  const displayPercentage = Math.min(100, usePercentage);
  const budgetSuggestion = usePercentage > 100
    ? "Limit aşımı var. En çok aşan kategoriyi azaltarak planı tekrar dengele."
    : usePercentage > 80
      ? "Bütçe kullanım oranı yüksek. Ay sonuna kadar esnek harcamaları sınırla."
      : "Bütçen planına uygun ilerliyor. Tasarruf hedefini koruyabilirsin.";

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 pb-8 h-full relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bütçe Planlayıcı</h1>
          <p className="mt-1 text-sm text-slate-500">
            Aylık gelirine göre kategori bazlı bütçe limitleri oluştur ve gerçekleşen harcamaları takip et.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => {
              if (!previousBudget) {
                toast.info("Karşılaştırma için önceki ay bütçesi bulunmuyor.");
                return;
              }
              setIsCompareOpen(true);
            }}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 bg-white shadow-sm whitespace-nowrap"
          >
            <RefreshCcw className="w-4 h-4 text-slate-400" /> Geçen Ayı Karşılaştır
          </button>
          <button onClick={openModal} className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] shadow-sm whitespace-nowrap">
            <Sparkles className="w-4 h-4" /> Bütçe Oluştur / Düzenle
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 w-full animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-slate-100 rounded-xl"></div>
            <div className="h-32 bg-slate-100 rounded-xl"></div>
            <div className="h-32 bg-slate-100 rounded-xl"></div>
          </div>
          <div className="h-64 bg-slate-100 rounded-xl mt-6"></div>
        </div>
      ) : !currentBudget ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm flex flex-col items-center justify-center">
          <Wallet className="w-12 h-12 text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Henüz bütçe oluşturmadınız</h2>
          <p className="text-sm text-slate-500 mb-6 max-w-md">Gelir ve giderlerinizi yönetmek için bu ayın bütçesini oluşturmaya başlayın.</p>
          <button onClick={openModal} className="px-6 py-2.5 rounded-lg bg-[#10B981] text-white font-bold hover:bg-[#059669] transition-colors">
            İlk Bütçemi Oluştur
          </button>
        </div>
      ) : (
        <>
          {/* Row 1 — 4 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-[#10B981]" />
              </div>
              <div className="text-xs font-medium text-slate-600 mb-1">Planlanan Gelir</div>
              <div className="text-2xl font-bold text-[#10B981] mb-2">₺{currentBudget.totalIncome.toLocaleString('tr-TR')}</div>
              <div className="text-[10px] text-slate-400">Aylık toplam gelir hedefin</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                <CreditCard className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-xs font-medium text-slate-600 mb-1">Planlanan Gider</div>
              <div className="text-2xl font-bold text-slate-900 mb-2">₺{currentBudget.plannedExpense.toLocaleString('tr-TR')}</div>
              <div className="text-[10px] text-slate-400">Toplam gider limitin</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
                <PiggyBank className="w-5 h-5 text-[#10B981]" />
              </div>
              <div className="text-xs font-medium text-slate-600 mb-1">Planlanan Tasarruf</div>
              <div className="text-2xl font-bold text-[#10B981] mb-2">₺{currentBudget.plannedSaving.toLocaleString('tr-TR')}</div>
              <div className="text-[10px] text-slate-400">Hedef tasarrufun</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
              <div className="flex-1 flex flex-col justify-center gap-2 pr-4">
                <div className="text-xs font-medium text-slate-600">Bütçe Kullanımı</div>
                <div className="text-sm font-semibold text-slate-800">{usePercentage > 100 ? 'Limit Aşıldı ⚠️' : usePercentage > 80 ? 'Dikkatli Ol ⚠️' : 'İyi durumdasın 👍'}</div>
                <div className="text-[10px] text-slate-400 font-medium">₺{totalUsed.toLocaleString('tr-TR')} / ₺{currentBudget.plannedExpense.toLocaleString('tr-TR')}</div>
              </div>
              <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={usePercentage > 100 ? "#EF4444" : "#10B981"} strokeWidth="3.5" strokeDasharray={`${displayPercentage}, 100`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn("text-sm font-bold", usePercentage > 100 ? "text-red-500" : "text-slate-900")}>%{usePercentage}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 — Planlanan vs Gerçekleşen + AI Bütçe Önerisi */}
          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
            {/* Planlanan vs Gerçekleşen */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col overflow-x-auto">
              <div className="flex items-center gap-1.5 mb-6">
                <h2 className="text-sm font-bold text-slate-900">Planlanan vs Gerçekleşen</h2>
                <Info className="w-4 h-4 text-slate-400" />
              </div>
              
              <div className="grid min-w-[520px] grid-cols-[minmax(120px,1fr)_80px_minmax(120px,1.5fr)_80px_82px] text-xs font-semibold text-slate-500 mb-4 pb-2 border-b border-slate-100">
                <div>Kategori</div>
                <div className="text-right">Planlanan</div>
                <div></div>
                <div className="text-right">Gerçekleşen</div>
                <div className="text-right">Kullanım</div>
              </div>

              <div className="space-y-5">
                {planData.map((item) => {
                  const pct = item.planned > 0 ? (item.actual / item.planned) * 100 : 0;
                  const isOver = pct > 100;
                  return (
                    <div key={item.name} className="grid min-w-[520px] grid-cols-[minmax(120px,1fr)_80px_minmax(120px,1.5fr)_80px_82px] items-center text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <div className="text-slate-400">{item.icon}</div>
                        {item.name}
                      </div>
                      <div className="text-right font-medium">₺{item.planned.toLocaleString('tr-TR')}</div>
                      <div className="px-4">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", isOver ? "bg-red-500" : "bg-[#10B981]")} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                        </div>
                      </div>
                      <div className="text-right font-bold text-slate-800">₺{item.actual.toLocaleString('tr-TR')}</div>
                      <div className="text-right flex items-center justify-end gap-1">
                        <span className={cn("font-bold", isOver ? "text-red-500" : "text-[#10B981]")}>{Math.round(pct)}%</span>
                        {isOver && <span className="text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-bold whitespace-nowrap">Aşım</span>}
                      </div>
                    </div>
                  );
                })}
                {planData.length === 0 && (
                  <div className="text-center text-slate-500 py-4 text-sm">Kategori limiti bulunmuyor.</div>
                )}
              </div>
            </div>

            {/* AI Bütçe Önerisi */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#10B981]" />
                <h2 className="text-sm font-bold text-slate-900">AI Bütçe Önerisi</h2>
              </div>
              <div className="p-5 space-y-4 flex-1">
                <button
                  type="button"
                  onClick={() => router.push("/app/assistant")}
                  className="flex w-full items-start justify-between p-3 rounded-lg border border-green-100 bg-white shadow-sm cursor-pointer hover:border-green-200 transition-colors text-left"
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 mb-0.5">{usePercentage > 100 ? "Limit aşımı tespit edildi" : usePercentage > 80 ? "Bütçe kullanım oranı yüksek" : "Bütçen planına uygun ilerliyor"}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{budgetSuggestion}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 mt-2" />
                </button>
              </div>
              <div className="px-5 py-3 bg-[#ECFDF5] border-t border-green-100 text-[10px] font-medium text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#10B981]" /> AI önerileri kişisel finans verilerine göre oluşturulmuştur.
              </div>
            </div>
          </div>

          {/* Row 3 — Bütçe Dağılımı + Limit Aşımı Uyarıları */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Bütçe Dağılımı */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold text-slate-900">Bütçe Dağılımı (Planlanan)</h2>
                <div className="text-xs font-bold text-slate-500 px-4">Tutar</div>
                <div className="text-xs font-bold text-slate-500 pl-4 pr-2">Oran</div>
              </div>
              <div className="flex flex-1 flex-col items-center gap-5 sm:flex-row sm:gap-8">
                <div className="w-48 h-48 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none" isAnimationActive={false}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-slate-500 font-medium mb-0.5">Toplam</span>
                    <span className="text-base font-bold text-slate-900 leading-none">₺{currentBudget.plannedExpense.toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                <div className="w-full min-w-0 flex-1 space-y-3">
                  {pieData.map((cat) => (
                    <div key={cat.name} className="flex items-center text-xs">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></div>
                        <span className="font-medium text-slate-700">{cat.name}</span>
                      </div>
                      <div className="w-24 text-right font-medium text-slate-900">₺{cat.value.toLocaleString('tr-TR')}</div>
                      <div className="w-16 text-right font-medium text-slate-500">%{cat.percent}</div>
                    </div>
                  ))}
                  {pieData.length === 0 && <div className="text-sm text-slate-500">Veri yok.</div>}
                </div>
              </div>
            </div>

            {/* Limit Aşımı Uyarıları */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-bold text-slate-900">Limit Aşımı Uyarıları</h2>
              </div>
              
              <div className="space-y-4 flex-1">
                {planData.filter((p) => p.planned > 0 && p.actual > p.planned).length > 0 ? (
                  planData.filter((p) => p.planned > 0 && p.actual > p.planned).map((p) => (
                    <div key={p.name} className="flex items-center justify-between p-4 rounded-lg border border-red-100 bg-red-50/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center text-red-500 font-bold shrink-0">
                          {p.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-900">{p.name}</span>
                            <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">Limit Aşımı</span>
                            <span className="text-xs font-semibold text-slate-600">₺{p.actual.toLocaleString('tr-TR')} / ₺{p.planned.toLocaleString('tr-TR')}</span>
                          </div>
                          <div className="text-[10px] text-slate-600 font-medium">
                            Limitin <span className="font-bold text-slate-900">₺{(p.actual - p.planned).toLocaleString('tr-TR')}</span> üzerinde harcama yaptın.
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 py-8 text-sm">Hiçbir kategoride limit aşımı yok.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {isCompareOpen && currentBudget && previousBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <h2 className="text-lg font-bold text-slate-900">Geçen Ay Karşılaştırması</h2>
              <button onClick={() => setIsCompareOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3 p-4 text-sm">
              {[
                ["Planlanan gelir", currentBudget.totalIncome, previousBudget.totalIncome],
                ["Planlanan gider", currentBudget.plannedExpense, previousBudget.plannedExpense],
                ["Planlanan tasarruf", currentBudget.plannedSaving, previousBudget.plannedSaving],
              ].map(([label, current, previous]) => {
                const currentValue = Number(current);
                const previousValue = Number(previous);
                const diff = currentValue - previousValue;
                return (
                  <div key={String(label)} className="rounded-lg border border-slate-200 p-3">
                    <div className="mb-2 font-bold text-slate-900">{label}</div>
                    <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                      <span>Bu ay: ₺{currentValue.toLocaleString("tr-TR")}</span>
                      <span>Geçen ay: ₺{previousValue.toLocaleString("tr-TR")}</span>
                    </div>
                    <div className={cn("mt-2 text-xs font-bold", diff >= 0 ? "text-[#10B981]" : "text-red-500")}>
                      Fark: {diff >= 0 ? "+" : "-"}₺{Math.abs(diff).toLocaleString("tr-TR")}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4">
              <button onClick={() => setIsCompareOpen(false)} className="h-9 rounded-lg px-4 text-xs font-bold text-slate-600 hover:bg-slate-50">
                Kapat
              </button>
              <button onClick={handleSaveComparison} className="h-9 rounded-lg bg-[#10B981] px-4 text-xs font-bold text-white hover:bg-[#059669]">
                Raporlara Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Bütçe {currentBudget ? "Düzenle" : "Oluştur"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ay</label>
                  <input required type="number" min="1" max="12" value={formData.month} onChange={e => setFormData({...formData, month: Number(e.target.value)})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Yıl</label>
                  <input required type="number" min="2020" max="2100" value={formData.year} onChange={e => setFormData({...formData, year: Number(e.target.value)})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Toplam Gelir</label>
                  <input required type="number" step="0.01" value={formData.totalIncome} onChange={e => setFormData({...formData, totalIncome: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Planlanan Gider</label>
                  <input required type="number" step="0.01" value={formData.plannedExpense} onChange={e => setFormData({...formData, plannedExpense: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Planlanan Tasarruf</label>
                  <input required type="number" step="0.01" value={formData.plannedSaving} onChange={e => setFormData({...formData, plannedSaving: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="0.00" />
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Kategori Limitleri</h3>
                  <button type="button" onClick={handleAddCategoryLimit} className="text-xs font-bold text-[#10B981] flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Ekle
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.categoryLimits.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <select required value={c.categoryId} onChange={(e) => handleCategoryLimitChange(idx, "categoryId", e.target.value)} className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]">
                        <option value="">Kategori Seçin</option>
                        {categoryOptions.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <input required type="number" step="0.01" value={c.plannedAmount} onChange={(e) => handleCategoryLimitChange(idx, "plannedAmount", e.target.value)} className="w-32 h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="Tutar (₺)" />
                      <button type="button" onClick={() => handleRemoveCategoryLimit(idx)} className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formData.categoryLimits.length === 0 && <div className="text-xs text-slate-500">Kategori limiti bulunmuyor.</div>}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-2 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">İptal</button>
                <button type="submit" className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-[#10B981] hover:bg-[#059669]">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
