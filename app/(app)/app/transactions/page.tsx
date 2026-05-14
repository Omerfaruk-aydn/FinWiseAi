"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  TrendingDown,
  Search, 
  Filter, 
  Calendar, 
  Wallet,
  ArrowRightLeft,
  ArrowDownToLine,
  ChevronDown,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Clock,
  Plus,
  X,
  Edit2,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeCategoryKey } from "@/lib/category-utils";
import { toast } from "sonner";
import { FilterSelect } from "@/components/ui/filter-select";
import { DatePickerField } from "@/components/ui/date-picker";

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
};

type TransactionItem = {
  id: string;
  type: "INCOME" | "EXPENSE";
  title: string;
  amount: number;
  categoryId: string | null;
  category?: { id?: string; name?: string | null } | null;
  source?: string | null;
  date: string;
  note?: string | null;
};

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = React.useState<TransactionItem[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);
  const [typeFilter, setTypeFilter] = React.useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");
  const [periodFilter, setPeriodFilter] = React.useState<"ALL" | "THIS_MONTH" | "LAST_30">("THIS_MONTH");

  const [formData, setFormData] = React.useState({
    id: "",
    type: "EXPENSE",
    title: "",
    amount: "",
    categoryId: "",
    source: "Manuel",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions?limit=100");
      const data = await res.json();
      if (data.success) setTransactions(data.data);
    } catch {
      toast.error("İşlemler yüklenemedi.");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch {
      toast.error("Kategoriler yüklenemedi.");
    }
  };

  React.useEffect(() => {
    Promise.all([fetchTransactions(), fetchCategories()]).finally(() => setIsLoading(false));
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
  const thisMonthTransactions = transactions.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const thisMonthIncome = thisMonthTransactions.filter(i => i.type === "INCOME").reduce((acc, curr) => acc + curr.amount, 0);
  const thisMonthExpense = thisMonthTransactions.filter(i => i.type === "EXPENSE").reduce((acc, curr) => acc + curr.amount, 0);
  const netCashFlow = thisMonthIncome - thisMonthExpense;
  const dayNames = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"];
  const dayCounts = thisMonthTransactions.reduce<Record<number, number>>((acc, item) => {
    const day = new Date(item.date).getDay();
    acc[day] = (acc[day] ?? 0) + 1;
    return acc;
  }, {});
  const busiestDayIndex = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const busiestDay = busiestDayIndex === undefined ? "Veri yok" : dayNames[Number(busiestDayIndex)];
  const daysElapsed = Math.max(1, new Date().getDate());
  const averageDailyTransactions = thisMonthTransactions.length / daysElapsed;
  const filteredTransactions = transactions.filter((item) => {
    const textMatches =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Boolean(item.note?.toLowerCase().includes(searchTerm.toLowerCase()));
    const typeMatches = typeFilter === "ALL" || item.type === typeFilter;
    const categoryMatches = categoryFilter === "ALL" || item.categoryId === categoryFilter || item.category?.id === categoryFilter;
    const itemDate = new Date(item.date);
    const periodMatches =
      periodFilter === "ALL" ||
      (periodFilter === "THIS_MONTH" && itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear) ||
      (periodFilter === "LAST_30" && itemDate >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    return textMatches && typeMatches && categoryMatches && periodMatches;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.amount) {
      toast.error("Lütfen zorunlu alanları doldurun.");
      return;
    }

    const method = formData.id ? "PATCH" : "POST";
    const url = formData.id ? `/api/transactions/${formData.id}` : "/api/transactions";
    const payload = {
      type: formData.type,
      title: formData.title,
      amount: parseFloat(formData.amount),
      categoryId: formData.categoryId || undefined,
      source: formData.source,
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
        toast.success(formData.id ? "İşlem güncellendi." : "İşlem eklendi.");
        setIsFormOpen(false);
        setFormData({ id: "", type: "EXPENSE", title: "", amount: "", categoryId: "", source: "Manuel", date: new Date().toISOString().split("T")[0], note: "" });
        fetchTransactions();
      } else {
        toast.error("İşlem kaydedilemedi.");
      }
    } catch {
      toast.error("İşlem kaydedilemedi.");
    }
  };

  const handleEdit = (item: TransactionItem) => {
    setFormData({
      id: item.id,
      type: item.type,
      title: item.title,
      amount: item.amount.toString(),
      categoryId: item.categoryId || "",
      source: item.source || "Manuel",
      date: new Date(item.date).toISOString().split("T")[0],
      note: item.note || ""
    });
    setIsFormOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu işlemi silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTransactions();
        setActiveDropdown(null);
      }
    } catch {
      toast.error("İşlem silinemedi.");
    }
  };

  return (
    <div className="flex min-w-0 flex-col lg:flex-row gap-6 font-sans text-slate-900 pb-8 h-full overflow-x-hidden">
      {/* Main Column */}
      <div className="min-w-0 flex-1 flex flex-col gap-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">İşlem Geçmişi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tüm gelir ve gider hareketlerini tek yerden incele.
          </p>
        </div>

        {/* Toolbar */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
          <div className="relative min-w-0 xl:flex-1 xl:min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="İşlem ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20"
            />
          </div>
          
          <FilterSelect<"ALL" | "INCOME" | "EXPENSE">
            ariaLabel="İşlem tipi filtresi"
            value={typeFilter}
            onChange={(value) => { setTypeFilter(value); setCategoryFilter("ALL"); }}
            options={[
              { value: "ALL", label: "Gelir / Gider" },
              { value: "INCOME", label: "Gelir" },
              { value: "EXPENSE", label: "Gider" },
            ]}
            triggerClassName="h-10 w-full xl:w-36"
          />
          
          <FilterSelect
            ariaLabel="İşlem kategori filtresi"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: "ALL", label: "Tüm Kategoriler" },
              ...categoryOptions
                .filter((category) => typeFilter === "ALL" || category.type === typeFilter)
                .map((category) => ({ value: category.id, label: category.name })),
            ]}
            triggerClassName="h-10 w-full xl:w-44"
          />

          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
            <FilterSelect<"ALL" | "THIS_MONTH" | "LAST_30">
              ariaLabel="İşlem dönem filtresi"
              value={periodFilter}
              onChange={setPeriodFilter}
              options={[
                { value: "THIS_MONTH", label: "Bu Ay" },
                { value: "LAST_30", label: "Son 30 Gün" },
                { value: "ALL", label: "Tüm Zamanlar" },
              ]}
              triggerClassName="h-10 w-full pl-9 xl:w-40"
            />
          </div>

          <button 
            onClick={() => {
              setFormData({ id: "", type: "EXPENSE", title: "", amount: "", categoryId: "", source: "Manuel", date: new Date().toISOString().split("T")[0], note: "" });
              setIsFormOpen(true);
            }}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] xl:ml-auto">
            <Plus className="w-4 h-4" /> İşlem Ekle
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-[#10B981]">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-600 mb-1">Toplam İşlem</div>
              <div className="text-2xl font-bold text-slate-900">{thisMonthTransactions.length}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <div className="w-6 h-6 rounded-full border-2 border-[#10B981] flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-[#10B981]" />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-600 mb-1">Gelir İşlemleri</div>
              <div className="text-2xl font-bold text-slate-900">{thisMonthTransactions.filter(i => i.type === "INCOME").length}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <div className="w-6 h-6 rounded-full border-2 border-red-500 flex items-center justify-center">
                <TrendingDown className="w-3 h-3 text-red-500" />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-600 mb-1">Gider İşlemleri</div>
              <div className="text-2xl font-bold text-slate-900">{thisMonthTransactions.filter(i => i.type === "EXPENSE").length}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-[#10B981]" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-600 mb-1">Net Nakit Akışı</div>
              <div className="text-2xl font-bold text-slate-900">₺{netCashFlow.toLocaleString('tr-TR')}</div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Tüm İşlemler</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-5 py-3 font-semibold">Tür</th>
                  <th className="px-5 py-3 font-semibold">Başlık</th>
                  <th className="px-5 py-3 font-semibold">Kategori</th>
                  <th className="px-5 py-3 font-semibold">Tutar</th>
                  <th className="px-5 py-3 font-semibold text-center">Kaynak</th>
                  <th className="px-5 py-3 font-semibold text-center">Tarih</th>
                  <th className="px-5 py-3 font-semibold">Not</th>
                  <th className="px-5 py-3 font-semibold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="py-4 text-center text-slate-500">Yükleniyor...</td></tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr><td colSpan={8} className="py-4 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                ) : filteredTransactions.map(item => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 relative">
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold", 
                        item.type === "INCOME" ? "text-[#10B981] bg-green-50 border border-green-100" : "text-red-500 bg-red-50 border border-red-100"
                      )}>
                        {item.type === "INCOME" ? "Gelir" : "Gider"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{item.title}</td>
                    <td className="px-5 py-3.5 text-slate-600">{item.category?.name || "Diğer"}</td>
                    <td className="px-5 py-3.5 font-bold">
                      <span className={item.type === "INCOME" ? "text-[#10B981]" : "text-slate-900"}>
                        {item.type === "INCOME" ? "+" : "-"}₺{item.amount.toLocaleString('tr-TR')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-600">{item.source || "Manuel"}</td>
                    <td className="px-5 py-3.5 text-center text-slate-600">{new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long'})}</td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-[150px] truncate" title={item.note ?? undefined}>{item.note || "—"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2 relative">
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                          className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4 inline-block" /></button>
                        
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
          
          <div className="mt-auto px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Toplam {filteredTransactions.length} işlem</span>
          </div>
        </div>
      </div>

      {/* Right Column (30%) */}
      <div className="min-w-0 w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
        
        {isFormOpen && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">{formData.id ? "İşlemi Düzenle" : "Yeni İşlem Ekle"}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, type: "EXPENSE", categoryId: "" }))}
                  className={cn("flex-1 py-2 text-xs font-bold rounded-lg border transition-colors", formData.type === "EXPENSE" ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-slate-200 text-slate-600")}
                >
                  Gider
                </button>
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, type: "INCOME", categoryId: "" }))}
                  className={cn("flex-1 py-2 text-xs font-bold rounded-lg border transition-colors", formData.type === "INCOME" ? "bg-green-50 border-green-200 text-[#10B981]" : "bg-white border-slate-200 text-slate-600")}
                >
                  Gelir
                </button>
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
                    className="w-full h-10 pl-7 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Başlık</label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="İşlem başlığı" 
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Kategori</label>
                <div className="relative">
                  <select 
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full h-10 pl-3 pr-8 rounded-lg border border-slate-200 text-sm text-slate-700 appearance-none focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 bg-white">
                    <option value="" disabled>Kategori seçin</option>
                    {categoryOptions.filter(c => c.type === formData.type).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Tarih</label>
                <DatePickerField
                  ariaLabel="İşlem tarihi"
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
                  className="w-full h-20 p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20 resize-none"
                ></textarea>
              </div>

              <button 
                onClick={handleSubmit}
                className="w-full h-11 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] transition-colors mt-2">
                Kaydet
              </button>
            </div>
          </div>
        )}

        {/* Bu Ay Özet */}
        {!isFormOpen && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">Bu Ay Özet</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full border border-green-200 flex items-center justify-center text-[#10B981]">
                    <TrendingUp className="w-3 h-3" />
                  </div>
                  Gelir
                </div>
                <div className="font-bold text-[#10B981]">₺{thisMonthIncome.toLocaleString('tr-TR')}</div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full border border-red-200 flex items-center justify-center text-red-500">
                    <TrendingDown className="w-3 h-3" />
                  </div>
                  Gider
                </div>
                <div className="font-bold text-red-500">₺{thisMonthExpense.toLocaleString('tr-TR')}</div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-500">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  Net Durum
                </div>
                <div className="font-bold text-slate-900">₺{netCashFlow.toLocaleString('tr-TR')}</div>
              </div>
            </div>
          </div>
        )}

        {!isFormOpen && (
          <>
            {/* Info Cards */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">En yoğun gün</div>
                <div className="text-sm font-bold text-slate-900">{busiestDay}</div>
                <div className="text-[10px] text-slate-400">{thisMonthTransactions.length} aylik kayittan hesaplandi</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-[#10B981]" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Ortalama günlük işlem</div>
                <div className="text-sm font-bold text-slate-900">{averageDailyTransactions.toFixed(1)} islem</div>
              </div>
            </div>

            <button onClick={() => router.push("/app/reports")} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between hover:bg-slate-50 transition-colors w-full text-left">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <TrendingUp className="w-4 h-4 text-slate-400" /> Detaylı Raporu Görüntüle
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </>
        )}
      </div>

    </div>
  );
}
