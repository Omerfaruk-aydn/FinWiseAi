"use client";

import * as React from "react";
import { 
  TrendingUp, 
  Search, 
  Filter, 
  Calendar, 
  RefreshCcw, 
  Plus, 
  Wallet,
  ArrowUpRight,
  Gift,
  MoreVertical,
  X,
  Sparkles,
  ChevronDown,
  Trash2,
  Edit2
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { normalizeCategoryKey } from "@/lib/category-utils";
import type { IncomeAnalysisOutput } from "@/lib/ai/schemas";
import { toast } from "sonner";
import { DatePickerField } from "@/components/ui/date-picker";

type Income = {
  id: string;
  title: string;
  amount: number;
  category: string;
  frequency: "MONTHLY" | "WEEKLY" | "YEARLY" | "ONE_TIME";
  date: string;
  note?: string | null;
};

type Category = {
  id: string;
  name: string;
};

export default function IncomePage() {
  const [incomes, setIncomes] = React.useState<Income[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const [filterDropdown, setFilterDropdown] = React.useState<"type" | "period" | null>(null);
  const [incomeTypeFilter, setIncomeTypeFilter] = React.useState<"ALL" | "RECURRING" | "ONE_TIME">("ALL");
  const [periodFilter, setPeriodFilter] = React.useState<"THIS_MONTH" | "LAST_30" | "ALL">("THIS_MONTH");
  const [showAnalysisModal, setShowAnalysisModal] = React.useState(false);
  const [analysisLoading, setAnalysisLoading] = React.useState(false);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);
  const [incomeAnalysis, setIncomeAnalysis] = React.useState<IncomeAnalysisOutput | null>(null);
  const [analysisSection, setAnalysisSection] = React.useState<"overview" | "insights" | "actions">("overview");

  const [formData, setFormData] = React.useState({
    id: "",
    title: "",
    amount: "",
    category: "",
    frequency: "MONTHLY",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  const fetchIncomes = async () => {
    try {
      const res = await fetch("/api/income");
      const data = await res.json();
      if (data.success) setIncomes(data.data);
    } catch {
      toast.error("Gelirler yüklenemedi.");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories?type=INCOME");
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch {
      toast.error("Gelir kategorileri yüklenemedi.");
    }
  };

  React.useEffect(() => {
    Promise.all([fetchIncomes(), fetchCategories()]).finally(() => setIsLoading(false));
  }, []);

  const categoryOptions = React.useMemo(() => {
    const seen = new Set<string>();
    const baseOptions = [
      ...categories,
      { id: "__income_salary__", name: "Maaş" },
      { id: "__income_investment__", name: "Yatırım" },
      { id: "__income_extra__", name: "Ek Gelir" },
      { id: "__income_other__", name: "Diğer" },
    ];

    return baseOptions.filter((category) => {
      const key = normalizeCategoryKey(category.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categories]);

  // Compute stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthIncomes = incomes.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  const totalIncome = thisMonthIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const recurringIncome = thisMonthIncomes.filter(i => i.frequency !== "ONE_TIME").reduce((acc, curr) => acc + curr.amount, 0);
  const oneTimeIncome = thisMonthIncomes.filter(i => i.frequency === "ONE_TIME").reduce((acc, curr) => acc + curr.amount, 0);

  // Group by category for PieChart
  const categoryTotals = thisMonthIncomes.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const colors = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6"];
  const pieData = Object.entries(categoryTotals).map(([name, value], idx) => ({
    name,
    value: value as number,
    percent: totalIncome > 0 ? (((value as number) / totalIncome) * 100).toFixed(1) : "0.0",
    color: colors[idx % colors.length]
  }));
  const hasPieData = pieData.length > 0;
  const hasSegmentedPieData = pieData.length > 1;

  const filteredIncomes = incomes.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const visibleIncomes = React.useMemo(() => {
    const now = new Date();
    const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return filteredIncomes.filter((income) => {
      const date = new Date(income.date);
      const matchesType =
        incomeTypeFilter === "ALL" ||
        (incomeTypeFilter === "RECURRING" && income.frequency !== "ONE_TIME") ||
        (incomeTypeFilter === "ONE_TIME" && income.frequency === "ONE_TIME");
      const matchesPeriod =
        periodFilter === "ALL" ||
        (periodFilter === "THIS_MONTH" && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) ||
        (periodFilter === "LAST_30" && date >= last30);

      return matchesType && matchesPeriod;
    });
  }, [filteredIncomes, incomeTypeFilter, periodFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailedAnalysis = async () => {
    setShowAnalysisModal(true);
    setAnalysisSection("overview");
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const res = await fetch("/api/ai/income-analysis", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Gelir analizi alınamadı.");
      }
      setIncomeAnalysis(json.data);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Gelir analizi alınamadı.");
      setIncomeAnalysis(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.amount || !formData.category) {
      toast.error("Lütfen zorunlu alanları doldurun.");
      return;
    }

    const method = formData.id ? "PATCH" : "POST";
    const url = formData.id ? `/api/income/${formData.id}` : "/api/income";
    const payload = {
      title: formData.title,
      amount: parseFloat(formData.amount),
      category: formData.category,
      frequency: formData.frequency,
      date: new Date(formData.date).toISOString(),
      note: formData.note
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(formData.id ? "Gelir güncellendi." : "Gelir eklendi.");
        setIsFormOpen(false);
        setFormData({ id: "", title: "", amount: "", category: "", frequency: "MONTHLY", date: new Date().toISOString().split("T")[0], note: "" });
        fetchIncomes();
      } else {
        toast.error("Gelir kaydedilemedi.");
      }
    } catch {
      toast.error("Gelir kaydedilemedi.");
    }
  };

  const handleEdit = (item: Income) => {
    setFormData({
      id: item.id,
      title: item.title,
      amount: item.amount.toString(),
      category: item.category,
      frequency: item.frequency,
      date: new Date(item.date).toISOString().split("T")[0],
      note: item.note || ""
    });
    setIsFormOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu geliri silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/income/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Gelir silindi.");
        fetchIncomes();
        setActiveDropdown(null);
      }
    } catch {
      toast.error("Gelir silinemedi.");
    }
  };

  const getFreqLabel = (f: string) => {
    switch (f) {
      case "MONTHLY": return "Aylık";
      case "WEEKLY": return "Haftalık";
      case "YEARLY": return "Yıllık";
      case "ONE_TIME": return "Tek seferlik";
      default: return f;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 font-sans text-slate-900 pb-8 h-full">
      {/* Left Column */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gelir Yönetimi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Aylık, haftalık veya tek seferlik gelirlerini takip et.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Gelir ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20"
            />
          </div>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterDropdown(filterDropdown === "type" ? null : "type")}
              className="flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 bg-white"
            >
              <Filter className="w-4 h-4 text-slate-400" />
              {incomeTypeFilter === "ALL" ? "Tüm Gelirler" : incomeTypeFilter === "RECURRING" ? "Tekrarlayan" : "Tek Seferlik"}
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            {filterDropdown === "type" && (
              <div className="absolute left-0 top-11 z-20 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                {[
                  { value: "ALL", label: "Tüm Gelirler" },
                  { value: "RECURRING", label: "Tekrarlayan" },
                  { value: "ONE_TIME", label: "Tek Seferlik" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setIncomeTypeFilter(option.value as typeof incomeTypeFilter);
                      setFilterDropdown(null);
                    }}
                    className={cn(
                      "flex w-full items-center rounded-md px-3 py-2 text-left text-xs font-medium hover:bg-slate-50",
                      incomeTypeFilter === option.value ? "bg-slate-100 text-slate-900" : "text-slate-600"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterDropdown(filterDropdown === "period" ? null : "period")}
              className="flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 bg-white"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              {periodFilter === "THIS_MONTH" ? "Bu Ay" : periodFilter === "LAST_30" ? "Son 30 Gün" : "Tüm Zamanlar"}
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            {filterDropdown === "period" && (
              <div className="absolute left-0 top-11 z-20 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                {[
                  { value: "THIS_MONTH", label: "Bu Ay" },
                  { value: "LAST_30", label: "Son 30 Gün" },
                  { value: "ALL", label: "Tüm Zamanlar" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setPeriodFilter(option.value as typeof periodFilter);
                      setFilterDropdown(null);
                    }}
                    className={cn(
                      "flex w-full items-center rounded-md px-3 py-2 text-left text-xs font-medium hover:bg-slate-50",
                      periodFilter === option.value ? "bg-slate-100 text-slate-900" : "text-slate-600"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              setFormData({ id: "", title: "", amount: "", category: "", frequency: "MONTHLY", date: new Date().toISOString().split("T")[0], note: "" });
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669]">
            <Plus className="w-4 h-4" /> Gelir Ekle
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
              <Wallet className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="text-xs font-medium text-slate-600 mb-1">Bu Ay Toplam Gelir</div>
            <div className="text-2xl font-bold text-[#10B981] mb-2">₺{totalIncome.toLocaleString('tr-TR')}</div>
            <div className="text-[10px] text-slate-400">Tüm gelirlerin toplamı</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
              <RefreshCcw className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="text-xs font-medium text-slate-600 mb-1">Tekrarlayan Gelir</div>
            <div className="text-2xl font-bold text-[#10B981] mb-2">₺{recurringIncome.toLocaleString('tr-TR')}</div>
            <div className="text-[10px] text-slate-400">Düzenli ve tekrarlayan gelirler</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
              <Gift className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="text-xs font-medium text-slate-600 mb-1">Ek Gelir</div>
            <div className="text-2xl font-bold text-[#10B981] mb-2">₺{oneTimeIncome.toLocaleString('tr-TR')}</div>
            <div className="text-[10px] text-slate-400">Tek seferlik ve ek gelirler</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="text-xs font-medium text-slate-600 mb-1">Geçen Aya Göre</div>
            <div className="text-2xl font-bold text-[#10B981] mb-2 flex items-center justify-center gap-1">
              -
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#10B981] bg-green-50 px-2 py-0.5 rounded border border-green-100">
              Veri bekleniyor
            </div>
          </div>
        </div>

        {/* Gelir Listesi + Dağılımı */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 items-start">
          {/* Gelir Listesi */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Gelir Listesi</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="pb-3 font-semibold">Başlık</th>
                    <th className="pb-3 font-semibold">Kategori</th>
                    <th className="pb-3 font-semibold text-right">Tutar</th>
                    <th className="pb-3 font-semibold text-center">Sıklık</th>
                    <th className="pb-3 font-semibold text-center">Tarih</th>
                    <th className="pb-3 font-semibold text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="py-4 text-center text-slate-500">Yükleniyor...</td></tr>
                  ) : visibleIncomes.length === 0 ? (
                    <tr><td colSpan={6} className="py-4 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                  ) : visibleIncomes.map(item => (
                    <tr key={item.id} className="border-b border-slate-50 last:border-0 relative">
                      <td className="py-3">
                        <div className="flex items-center gap-2 font-medium text-slate-800">
                          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 bg-green-50 text-[#10B981]">
                            <Wallet className="w-4 h-4" />
                          </div>
                          {item.title}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded text-[10px] font-bold border bg-green-50 text-[#10B981] border-green-100">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">₺{item.amount.toLocaleString('tr-TR')}</td>
                      <td className="py-3 text-center text-slate-500 font-medium">{getFreqLabel(item.frequency)}</td>
                      <td className="py-3 text-center text-slate-500">{new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric'})}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2 relative">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="px-2.5 py-1 text-[10px] font-bold border border-slate-200 rounded hover:bg-slate-50">Düzenle</button>
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                            className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></button>
                          
                          {activeDropdown === item.id && (
                            <div className="absolute top-8 right-0 w-28 bg-white border border-slate-200 shadow-lg rounded-lg z-10 py-1">
                              <button 
                                onClick={() => handleEdit(item)}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                                <Edit2 className="w-3.5 h-3.5" /> Düzenle
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 flex items-center gap-2 text-red-600">
                                <Trash2 className="w-3.5 h-3.5" /> Sil
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
              <span>{visibleIncomes.length} kayıt gösteriliyor</span>
            </div>
          </div>

          {/* Gelir Dağılımı */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm self-start">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Gelir Dağılımı</h2>
            <div className="flex flex-col">
              <div className="w-full h-40 relative mb-4">
                {hasSegmentedPieData ? (
                  <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={72}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    <Tooltip formatter={(value: number) => `₺${value.toLocaleString('tr-TR')}`} />
                  </PieChart>
                  </ResponsiveContainer>
                ) : hasPieData ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="h-36 w-36 rounded-full border-[26px]"
                      style={{ borderColor: pieData[0].color }}
                    />
                  </div>
                ) : null}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-bold text-slate-900">₺{totalIncome.toLocaleString('tr-TR')}</span>
                  <span className="text-[10px] text-slate-500">Toplam</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {pieData.map(cat => (
                  <div key={cat.name} className="flex items-center text-xs">
                    <div className="flex items-center gap-2 w-24 truncate">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></div>
                      <span className="font-medium text-slate-700 truncate" title={cat.name}>{cat.name}</span>
                    </div>
                    <div className="flex-1 text-right font-bold">₺{cat.value.toLocaleString('tr-TR')}</div>
                    <div className="w-12 text-right text-slate-400">%{cat.percent}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Gelir Yorumu */}
        <div className="bg-[#ECFDF5] border border-green-100 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-green-50">
              <Sparkles className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">AI Gelir Yorumu</h3>
              <p className="text-xs text-slate-700 font-medium">
                Gelirlerinin durumu incelendi. Tasarruf için daha fazla ek gelir yaratmayı düşünebilirsin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDetailedAnalysis}
            className="flex items-center gap-1.5 bg-white border border-green-200 text-[#10B981] hover:bg-green-50 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm shrink-0"
          >
            Detaylı Analiz <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {showAnalysisModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 px-4 py-6">
            <div className="flex w-full max-w-6xl max-h-[88vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Gelir Analizi</h3>
                  <p className="mt-1 text-sm text-slate-500">Bu analiz otomatik hesaplanmış verilere göre hazırlanır.</p>
                </div>
                <button type="button" onClick={() => setShowAnalysisModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                {analysisLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    AI analizi hazırlanıyor, gelir dağılımı ve riskler değerlendiriliyor...
                  </div>
                ) : analysisError ? (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    {analysisError}
                  </div>
                ) : incomeAnalysis ? (
                  <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="space-y-4">
                      <div className="rounded-2xl border border-green-100 bg-green-50/50 p-4">
                        <div className="text-xs font-semibold text-green-700">AI özeti</div>
                        <div className="mt-2 text-sm leading-6 text-slate-700">{incomeAnalysis.summary}</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-semibold text-slate-500">Ana değerlendirme</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{incomeAnalysis.diagnosis.mainIssue}</div>
                        <div className="mt-2 text-sm leading-6 text-slate-700">{incomeAnalysis.diagnosis.explanation}</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-semibold text-slate-500">Bölümler</div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {[
                            { key: "overview", label: "Özet" },
                            { key: "insights", label: "İçgörü" },
                            { key: "actions", label: "Aksiyon" },
                          ].map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setAnalysisSection(item.key as typeof analysisSection)}
                              className={cn(
                                "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                                analysisSection === item.key
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              )}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {incomeAnalysis.chart && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold text-slate-500">{incomeAnalysis.chart.title}</div>
                          <div className="mt-3 space-y-2">
                            {incomeAnalysis.chart.data.map((point) => {
                              const maxValue = Math.max(...incomeAnalysis.chart!.data.map((d) => d.value), 1);
                              const width = point.value > 0 ? Math.max(6, (point.value / maxValue) * 100) : 0;
                              return (
                                <div key={point.label} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs text-slate-600">
                                    <span>{point.label}</span>
                                    <span>{point.value.toLocaleString("tr-TR")} {incomeAnalysis.chart?.unit ?? ""}</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-slate-100">
                                    <div className="h-2 rounded-full bg-green-500" style={{ width: `${width}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </aside>

                    <section className="space-y-4">
                      {analysisSection === "overview" && (
                        <>
                          <div className="grid gap-3 md:grid-cols-2">
                            {incomeAnalysis.recommendations.slice(0, 2).map((recommendation) => (
                              <div key={recommendation.title} className="rounded-2xl border border-green-100 bg-green-50/40 p-4">
                                <div className="text-xs font-semibold text-green-700">{recommendation.title}</div>
                                <div className="mt-2 text-sm leading-6 text-slate-700">{recommendation.action}</div>
                              </div>
                            ))}
                          </div>
                          {incomeAnalysis.followUps?.length ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="text-xs font-semibold text-slate-500">Takip soruları</div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {incomeAnalysis.followUps.map((item) => (
                                  <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </>
                      )}

                      {analysisSection === "insights" && (
                        <div className="grid gap-3 md:grid-cols-2">
                          {incomeAnalysis.insights.map((insight) => (
                            <div key={insight.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="text-xs font-semibold text-slate-500">{insight.title}</div>
                              <div className="mt-2 text-sm leading-6 text-slate-700">{insight.description}</div>
                              <div className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">{insight.severity}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {analysisSection === "actions" && (
                        <>
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-xs font-semibold text-slate-500">Önerilen aksiyonlar</div>
                            <div className="mt-3 space-y-3">
                              {incomeAnalysis.actionItems.map((item) => (
                                <div key={item.title} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                                  <span className="mt-1 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                                    <div className="mt-1 text-sm leading-6 text-slate-700">{item.description}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            {incomeAnalysis.recommendations.slice(2, 4).map((recommendation) => (
                              <div key={recommendation.title} className="rounded-2xl border border-green-100 bg-green-50/40 p-4">
                                <div className="text-xs font-semibold text-green-700">{recommendation.title}</div>
                                <div className="mt-2 text-sm leading-6 text-slate-700">{recommendation.action}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </section>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Yeni Gelir Ekle */}
      {isFormOpen && (
        <div className="w-full lg:w-[320px] shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full sticky top-[84px]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">{formData.id ? "Geliri Düzenle" : "Yeni Gelir Ekle"}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Gelir başlığı</label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Örn. Maaş, Freelance iş, Temettü..." 
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Tutar</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₺</span>
                  <input 
                    type="number" 
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00" 
                    className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Kategori</label>
                <div className="relative">
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 text-sm text-slate-700 appearance-none focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 bg-white">
                    <option value="" disabled>Kategori seçin</option>
                    {categoryOptions.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {!categories.find(c => c.name === formData.category) && formData.category && (
                      <option value={formData.category}>{formData.category}</option>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Sıklık</label>
                <div className="relative">
                  <select 
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 text-sm text-slate-700 appearance-none focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 bg-white">
                    <option value="MONTHLY">Aylık</option>
                    <option value="WEEKLY">Haftalık</option>
                    <option value="YEARLY">Yıllık</option>
                    <option value="ONE_TIME">Tek seferlik</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Tarih</label>
                <DatePickerField
                  ariaLabel="Gelir tarihi"
                  value={formData.date}
                  onChange={(value) => setFormData((prev) => ({ ...prev, date: value }))}
                  placeholder="Tarih seçin"
                  triggerClassName="w-full pl-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Not</label>
                <textarea 
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Opsiyonel not ekleyin..." 
                  className="w-full h-24 p-3 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 resize-none"
                ></textarea>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 mt-auto bg-white rounded-b-xl">
              <button 
                onClick={handleSubmit}
                className="w-full h-11 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] transition-colors">
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

