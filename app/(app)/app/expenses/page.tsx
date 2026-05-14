"use client";

import * as React from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Search, 
  Filter, 
  Calendar, 
  Plus, 
  Wallet,
  MoreVertical,
  X,
  CreditCard,
  ShoppingBag,
  Utensils,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  Trash2,
  Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeCategoryKey } from "@/lib/category-utils";
import { toast } from "sonner";
import { FilterSelect } from "@/components/ui/filter-select";
import { DatePickerField } from "@/components/ui/date-picker";

type Category = {
  id: string;
  name: string;
};

type BudgetCategory = {
  plannedAmount: number;
  actualAmount: number;
  category: {
    id: string;
    name: string;
    icon?: string | null;
    color: string;
  };
};

type Budget = {
  id: string;
  month: number;
  year: number;
  plannedExpense: number;
  plannedSaving: number;
  categories: BudgetCategory[];
};

type Expense = {
  id: string;
  title: string;
  amount: number;
  categoryId: string | null;
  category?: { name?: string | null } | null;
  paymentMethod: "CASH" | "CARD" | "TRANSFER";
  isRecurring: boolean;
  date: string;
  note?: string | null;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [periodFilter, setPeriodFilter] = React.useState<"THIS_MONTH" | "LAST_30" | "ALL">("THIS_MONTH");
  const [paymentFilter, setPaymentFilter] = React.useState<"ALL" | "CASH" | "CARD" | "TRANSFER">("ALL");
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    id: "",
    title: "",
    amount: "",
    categoryId: "",
    paymentMethod: "CARD",
    isRecurring: false,
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      if (data.success) setExpenses(data.data);
    } catch {
      toast.error("Giderler yüklenemedi.");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories?type=EXPENSE");
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch {
      toast.error("Gider kategorileri yüklenemedi.");
    }
  };

  const fetchBudgets = async () => {
    try {
      const res = await fetch("/api/budget");
      const data = await res.json();
      if (data.success) setBudgets(data.data);
    } catch {
      toast.error("Bütçe verileri yüklenemedi.");
    }
  };

  React.useEffect(() => {
    Promise.all([fetchExpenses(), fetchCategories(), fetchBudgets()]).finally(() => setIsLoading(false));
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

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthExpenses = expenses.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalExpense = thisMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const currentBudget = React.useMemo(() => {
    const currentMonthNumber = currentMonth + 1;
    return (
      budgets.find((budget) => budget.month === currentMonthNumber && budget.year === currentYear) ?? null
    );
  }, [budgets, currentMonth, currentYear]);

  const categoryTotals = thisMonthExpenses.reduce((acc, curr) => {
    const cat = curr.category?.name || "Diğer";
    acc[cat] = (acc[cat] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const topCategory = Object.entries(categoryTotals).sort(([,a], [,b]) => (b as number) - (a as number))[0] as [string, number] | undefined;
  const topCategoryName = topCategory ? topCategory[0] : "-";
  const topCategoryPercent = totalExpense > 0 && topCategory ? Math.round((topCategory[1] / totalExpense) * 100) : 0;
  const budgetLimitRows = React.useMemo(() => {
    if (!currentBudget) return [];
    return currentBudget.categories
      .filter((item) => item.plannedAmount > 0 && item.actualAmount > item.plannedAmount)
      .map((item) => ({
        name: item.category.name,
        icon: item.category.icon,
        color: item.category.color,
        current: item.actualAmount,
        limit: item.plannedAmount,
        pct: Math.round((item.actualAmount / item.plannedAmount) * 100),
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [currentBudget]);

  const limitExceededCount = budgetLimitRows.length;
  const budgetRemaining = currentBudget ? Math.max(currentBudget.plannedExpense - totalExpense, 0) : null;

  const filteredExpenses = expenses.filter((item) => {
    const itemDate = new Date(item.date);
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || item.categoryId === categoryFilter;
    const matchesPayment = paymentFilter === "ALL" || item.paymentMethod === paymentFilter;
    const matchesPeriod =
      periodFilter === "ALL" ||
      (periodFilter === "THIS_MONTH" && itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear) ||
      (periodFilter === "LAST_30" && itemDate >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    return matchesSearch && matchesCategory && matchesPayment && matchesPeriod;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.amount || !formData.categoryId) {
      toast.error("Lütfen zorunlu alanları doldurun.");
      return;
    }

    const method = formData.id ? "PATCH" : "POST";
    const url = formData.id ? `/api/expenses/${formData.id}` : "/api/expenses";
    const payload = {
      title: formData.title,
      amount: parseFloat(formData.amount),
      categoryId: formData.categoryId,
      paymentMethod: formData.paymentMethod,
      isRecurring: formData.isRecurring,
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
        toast.success(formData.id ? "Gider güncellendi." : "Gider eklendi.");
        setIsFormOpen(false);
        setFormData({ id: "", title: "", amount: "", categoryId: "", paymentMethod: "CARD", isRecurring: false, date: new Date().toISOString().split("T")[0], note: "" });
        fetchExpenses();
      } else {
        toast.error("Gider kaydedilemedi.");
      }
    } catch {
      toast.error("Gider kaydedilemedi.");
    }
  };

  const handleEdit = (item: Expense) => {
    setFormData({
      id: item.id,
      title: item.title,
      amount: item.amount.toString(),
      categoryId: item.categoryId || "",
      paymentMethod: item.paymentMethod,
      isRecurring: item.isRecurring,
      date: new Date(item.date).toISOString().split("T")[0],
      note: item.note || ""
    });
    setIsFormOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu gideri silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Gider silindi.");
        fetchExpenses();
        setActiveDropdown(null);
      }
    } catch {
      toast.error("Gider silinemedi.");
    }
  };

  const getMethodLabel = (m: string) => {
    switch (m) {
      case "CASH": return "Nakit";
      case "CARD": return "Kredi Kartı";
      case "TRANSFER": return "Havale/EFT";
      default: return m;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 font-sans text-slate-900 pb-8 h-full">
      {/* Left Column (70%) */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gider Yönetimi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Harcama kayıtlarını ekle, kategorilere ayır ve bütçe limitlerini takip et.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Gider ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            <FilterSelect
              ariaLabel="Gider kategori filtresi"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: "ALL", label: "Tüm Kategoriler" },
                ...categoryOptions.map((category) => ({ value: category.id, label: category.name })),
              ]}
              triggerClassName="h-10 w-48 pl-9"
            />
          </div>
          
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            <FilterSelect<"THIS_MONTH" | "LAST_30" | "ALL">
              ariaLabel="Gider dönem filtresi"
              value={periodFilter}
              onChange={setPeriodFilter}
              options={[
                { value: "THIS_MONTH", label: "Bu Ay" },
                { value: "LAST_30", label: "Son 30 Gün" },
                { value: "ALL", label: "Tüm Zamanlar" },
              ]}
              triggerClassName="h-10 w-40 pl-9"
            />
          </div>

          <div className="relative ml-auto">
            <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
            <FilterSelect<"ALL" | "CASH" | "CARD" | "TRANSFER">
              ariaLabel="Ödeme yöntemi filtresi"
              value={paymentFilter}
              onChange={setPaymentFilter}
              options={[
                { value: "ALL", label: "Tüm Ödeme Yöntemleri" },
                { value: "CARD", label: "Kredi Kartı" },
                { value: "CASH", label: "Nakit" },
                { value: "TRANSFER", label: "Havale/EFT" },
              ]}
              triggerClassName="h-10 w-56 pl-9"
            />
          </div>

          <button 
            onClick={() => {
              setFormData({ id: "", title: "", amount: "", categoryId: "", paymentMethod: "CARD", isRecurring: false, date: new Date().toISOString().split("T")[0], note: "" });
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669]">
            <Plus className="w-4 h-4" /> Gider Ekle
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
              <Wallet className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="text-xs font-medium text-slate-600 mb-1">Bu Ay Toplam Gider</div>
            <div className="text-2xl font-bold text-[#10B981] mb-2">₺{totalExpense.toLocaleString('tr-TR')}</div>
            <div className="text-[10px] text-slate-400">Mayıs ayı harcamalarınız</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-xs font-medium text-slate-600 mb-1">En Yüksek Kategori</div>
            <div className="text-2xl font-bold text-slate-900 mb-2">{topCategoryName}</div>
            <div className="text-[10px] text-slate-400">Toplam giderin %{topCategoryPercent}</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-xs font-medium text-slate-600 mb-1">Limit Aşımı</div>
            <div className="text-2xl font-bold text-red-500 mb-2">
              {currentBudget ? `${limitExceededCount} kategori` : "—"}
            </div>
            <div className="text-[10px] text-slate-400">
              {currentBudget ? "Bütçe limitini aşan kategoriler" : "Bu ay için bütçe kaydı yok"}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="text-xs font-medium text-slate-600 mb-1">Bütçe Kalanı</div>
            <div className="text-2xl font-bold text-[#10B981] mb-2">
              {budgetRemaining === null ? "—" : `₺${budgetRemaining.toLocaleString("tr-TR")}`}
            </div>
            <div className="text-[10px] text-slate-400">Planlanan gidere göre kalan tutar</div>
          </div>
        </div>

        {/* Gider Listesi + Kategori Limitleri */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 items-start">
          {/* Gider Listesi */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Gider Listesi</h2>
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="pb-3 font-semibold">Gider</th>
                    <th className="pb-3 font-semibold">Kategori</th>
                    <th className="pb-3 font-semibold">Tutar</th>
                    <th className="pb-3 font-semibold">Ödeme Yöntemi</th>
                    <th className="pb-3 font-semibold">Tarih</th>
                    <th className="pb-3 font-semibold">Tekrarlayan</th>
                    <th className="pb-3 font-semibold text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={7} className="py-4 text-center text-slate-500">Yükleniyor...</td></tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr><td colSpan={7} className="py-4 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                  ) : filteredExpenses.map(item => (
                    <tr key={item.id} className="border-b border-slate-50 last:border-0 relative">
                      <td className="py-3">
                        <div className="flex items-center gap-2 font-medium text-slate-800">
                          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 bg-slate-100 text-slate-600">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          {item.title}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded text-[10px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
                          {item.category?.name || "Diğer"}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-slate-900">₺{item.amount.toLocaleString('tr-TR')}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <CreditCard className="w-3.5 h-3.5" /> {getMethodLabel(item.paymentMethod)}
                        </div>
                      </td>
                      <td className="py-3 text-slate-500 font-medium">
                        {new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long'})}
                      </td>
                      <td className="py-3">
                        {item.isRecurring ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#10B981] px-2 py-0.5 rounded-full bg-green-50">
                            Evet
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Hayır</span>
                        )}
                      </td>
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
              <span>{filteredExpenses.length} kayıt gösteriliyor</span>
            </div>
          </div>

          {/* Kategori Limitleri + AI Uyarısı */}
          <div className="flex flex-col gap-4 self-start">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
              <h2 className="text-sm font-bold text-slate-900 mb-6">Kategori Limitleri</h2>
              {currentBudget ? (
                budgetLimitRows.length > 0 ? (
                  <div className="space-y-4">
                    {budgetLimitRows.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 w-1/3">
                          <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 bg-slate-50">
                            {item.icon ? (
                              <div className="text-xs font-bold" style={{ color: item.color }}>
                                {item.name.charAt(0).toUpperCase()}
                              </div>
                            ) : (
                              <ShoppingBag className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div className="font-medium text-slate-800">{item.name}</div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center px-4">
                          <div className="flex justify-between items-center mb-1 text-[10px]">
                            <span className="text-slate-700 font-semibold">
                              ₺{item.current.toLocaleString("tr-TR")} / ₺{item.limit.toLocaleString("tr-TR")}
                            </span>
                            <span className="font-bold text-red-500">
                              {item.pct}% • Limit aşıldı
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-red-500"
                              style={{ width: `${Math.min(item.pct, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    Bu bütçede limit aşımı görünmüyor.
                  </div>
                )
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Bu ay için bütçe kaydı bulunmuyor. Limitleri görmek için önce bütçe oluşturun.
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link
                  href="/app/budget"
                  className="text-[10px] font-bold text-[#10B981] hover:underline flex items-center justify-between w-full"
                >
                  Bütçe sayfasına git <span className="text-slate-400">&gt;</span>
                </Link>
              </div>
            </div>

            {/* Bütçe Uyarısı */}
            <div className={cn(
              "rounded-xl p-5 shadow-sm flex flex-col border",
              limitExceededCount > 0 ? "bg-orange-50 border-orange-100" : "bg-green-50 border-green-100"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn(
                  "w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border",
                  limitExceededCount > 0 ? "border-orange-100" : "border-green-100"
                )}>
                  <AlertTriangle className={cn("w-4 h-4", limitExceededCount > 0 ? "text-orange-500" : "text-[#10B981]")} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {limitExceededCount > 0 ? "Bütçe Uyarısı" : "Bütçe Durumu"}
                </h3>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed mb-4">
                {currentBudget
                  ? limitExceededCount > 0
                    ? `Bütçede ${limitExceededCount} kategori limit aşımına ulaştı. Önceliği en yüksek aşım oranına sahip kategorilere ver.`
                    : "Bu ay bütçe limitlerin içinde görünüyorsun. Harcama disiplinini koru."
                  : "Bütçe oluşturulduğunda limit aşımı ve uyarı özeti burada görünecek."}
              </p>
              <Link
                href="/app/budget"
                className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 w-max px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <TrendingUp className="w-3.5 h-3.5" /> Bütçeyi Aç
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Yeni Gider Ekle */}
      {isFormOpen && (
        <div className="w-full lg:w-[320px] shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full sticky top-[84px]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">{formData.id ? "Gideri Düzenle" : "Yeni Gider Ekle"}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">
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
                <label className="text-xs font-bold text-slate-800">Gider başlığı</label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Örn. Migros alışverişi" 
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Kategori</label>
                <FilterSelect
                  ariaLabel="Gider kategorisi"
                  value={formData.categoryId}
                  onChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
                  options={[
                    ...categoryOptions.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  placeholder="Kategori seçin"
                  triggerClassName="h-10 w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Ödeme yöntemi</label>
                <FilterSelect<"CARD" | "CASH" | "TRANSFER">
                  ariaLabel="Ödeme yöntemi"
                  value={formData.paymentMethod as "CARD" | "CASH" | "TRANSFER"}
                  onChange={(value) => setFormData((prev) => ({ ...prev, paymentMethod: value }))}
                  options={[
                    { value: "CARD", label: "Kredi Kartı" },
                    { value: "CASH", label: "Nakit" },
                    { value: "TRANSFER", label: "Havale/EFT" },
                  ]}
                  triggerClassName="h-10 w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Tarih</label>
                <DatePickerField
                  ariaLabel="Gider tarihi"
                  value={formData.date}
                  onChange={(value) => setFormData((prev) => ({ ...prev, date: value }))}
                  placeholder="Tarih seçin"
                  triggerClassName="w-full pl-9"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-bold text-slate-800">Tekrarlayan</label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Bu gider tekrarlıyor</span>
                  <label className="w-8 h-4 bg-slate-200 rounded-full relative cursor-pointer flex items-center">
                    <input 
                      type="checkbox" 
                      name="isRecurring"
                      checked={formData.isRecurring}
                      onChange={handleInputChange}
                      className="sr-only" 
                    />
                    <div className={cn("w-3.5 h-3.5 rounded-full absolute shadow-sm transition-transform", formData.isRecurring ? "bg-[#10B981] transform translate-x-4" : "bg-white left-0.5")}></div>
                    <div className={cn("w-full h-full rounded-full transition-colors", formData.isRecurring ? "bg-green-100" : "bg-slate-200")}></div>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
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
