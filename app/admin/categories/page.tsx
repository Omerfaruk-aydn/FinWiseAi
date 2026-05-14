"use client";

import * as React from "react";
import {
  Search,
  Filter,
  Plus,
  X,
  Pencil,
  Trash2,
  ShoppingCart,
  Utensils,
  Home,
  Car,
  Wallet,
  Calendar,
  Gift,
  TrendingUp,
  Briefcase,
  Heart,
  Dumbbell,
  GraduationCap,
  Plane,
  BarChart2,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FilterSelect } from "@/components/ui/filter-select";

type ApiCategory = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  isDefault: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { expenses: number };
};

const iconMap: Record<string, React.ReactNode> = {
  shopping_cart: <ShoppingCart className="w-4 h-4" />,
  utensils: <Utensils className="w-4 h-4" />,
  home: <Home className="w-4 h-4" />,
  car: <Car className="w-4 h-4" />,
  wallet: <Wallet className="w-4 h-4" />,
  briefcase: <Briefcase className="w-4 h-4" />,
  heart: <Heart className="w-4 h-4" />,
  dumbbell: <Dumbbell className="w-4 h-4" />,
  graduation_cap: <GraduationCap className="w-4 h-4" />,
  plane: <Plane className="w-4 h-4" />,
  gift: <Gift className="w-4 h-4" />,
  bar_chart: <BarChart2 className="w-4 h-4" />,
  trending_up: <TrendingUp className="w-4 h-4" />,
  calendar: <Calendar className="w-4 h-4" />,
};

const iconKeys = [
  "shopping_cart","utensils","home","car",
  "wallet","briefcase","heart","dumbbell",
  "graduation_cap","plane","gift","bar_chart",
];

const colorOptions = ["#10B981","#F59E0B","#3B82F6","#8B5CF6","#EF4444","#14B8A6","#94A3B8"];

function getIconNode(iconKey: string, color: string) {
  const icon = iconMap[iconKey];
  if (!icon) return <ShoppingCart className="w-4 h-4" style={{ color }} />;
  return React.cloneElement(icon as React.ReactElement<any>, { style: { color } });
}

type FormState = {
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  isDefault: boolean;
};

const defaultForm: FormState = {
  name: "",
  type: "EXPENSE",
  icon: "shopping_cart",
  color: "#10B981",
  isDefault: true,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = React.useState<ApiCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryTypeFilter, setCategoryTypeFilter] = React.useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<10 | 20 | 50>(10);
  const [showPanel, setShowPanel] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(defaultForm);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (json.success) setCategories(json.data);
    } catch {
      toast.error("Kategoriler yüklenemedi.");
    }
    setLoading(false);
  }

  const filteredCategories = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return categories.filter((c) => {
      const matchesSearch = !term || c.name.toLowerCase().includes(term);
      const matchesType = categoryTypeFilter === "ALL" || c.type === categoryTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [categories, categoryTypeFilter, searchTerm]);

  const totalPages = Math.max(Math.ceil(filteredCategories.length / pageSize), 1);
  const pagedCategories = React.useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredCategories.slice(startIndex, startIndex + pageSize);
  }, [filteredCategories, page, pageSize]);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Stat calculations
  const totalCount = categories.length;
  const expenseCount = categories.filter(c => c.type === "EXPENSE").length;
  const incomeCount = categories.filter(c => c.type === "INCOME").length;
  const defaultCount = categories.filter(c => c.isDefault).length;

  function handleEditClick(cat: ApiCategory) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      isDefault: cat.isDefault,
    });
    setShowPanel(true);
  }

  function handleAddNew() {
    setEditingId(null);
    setForm(defaultForm);
    setShowPanel(true);
  }

  function handleCancel() {
    setShowPanel(false);
    setEditingId(null);
    setForm(defaultForm);
  }

  async function handleDelete(cat: ApiCategory) {
    if (!confirm(`"${cat.name}" kategorisini silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setCategories(prev => prev.filter(c => c.id !== cat.id));
      } else {
        toast.error(json.error?.message ?? "Kategori silinemedi.");
      }
    } catch {
      toast.error("Kategori silinemedi.");
    }
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        // Edit mode
        const res = await fetch(`/api/admin/categories/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            type: form.type,
            icon: form.icon,
            color: form.color,
            isDefault: form.isDefault,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setCategories(prev => prev.map(c => c.id === editingId ? { ...c, ...json.data } : c));
          setEditingId(null);
          setForm(defaultForm);
          setShowPanel(false);
        }
      } else {
        // Create mode
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            type: form.type,
            icon: form.icon,
            color: form.color,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setCategories(prev => [...prev, json.data]);
          setForm(defaultForm);
          setShowPanel(false);
        } else {
          toast.error(json.error?.message ?? "Kategori oluşturulamadı.");
        }
      }
    } catch {
      toast.error("Kategori kaydedilemedi.");
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 font-sans text-slate-900 pb-8 h-full">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategori Yönetimi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gelir ve gider kategorilerini yönet, varsayılan finans kategorilerini düzenle.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Kategori ara..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20"
            />
          </div>

          <FilterSelect
            value={categoryTypeFilter}
            onChange={(value) => { setCategoryTypeFilter(value); setPage(1); }}
            options={[
              { value: "ALL", label: "Gelir / Gider" },
              { value: "EXPENSE", label: "Sadece Gider" },
              { value: "INCOME", label: "Sadece Gelir" },
            ]}
            ariaLabel="Kategori türü filtresi"
            triggerClassName="w-40 px-3"
          />

          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] ml-auto shadow-sm"
          >
            <Plus className="w-4 h-4" /> Kategori Ekle
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4 text-center justify-center flex-col">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-1 text-[#10B981]">
              <LayersIcon className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-slate-700 mb-1">Toplam Kategori</div>
            <div className="text-2xl font-bold text-slate-900 leading-none mb-1">
              {loading ? "—" : totalCount}
            </div>
            <div className="text-[10px] text-slate-400">Tüm kategoriler</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4 text-center justify-center flex-col">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-1 text-red-500">
              <ShoppingBagIcon className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-slate-700 mb-1">Gider Kategorisi</div>
            <div className="text-2xl font-bold text-slate-900 leading-none mb-1">
              {loading ? "—" : expenseCount}
            </div>
            <div className="text-[10px] text-slate-400">Toplam gider kategorisi</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4 text-center justify-center flex-col">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-1 text-[#10B981]">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-slate-700 mb-1">Gelir Kategorisi</div>
            <div className="text-2xl font-bold text-slate-900 leading-none mb-1">
              {loading ? "—" : incomeCount}
            </div>
            <div className="text-[10px] text-slate-400">Toplam gelir kategorisi</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4 text-center justify-center flex-col">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-1 text-purple-500">
              <StarIcon className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-slate-700 mb-1">Varsayılan</div>
            <div className="text-2xl font-bold text-slate-900 leading-none mb-1">
              {loading ? "—" : defaultCount}
            </div>
            <div className="text-[10px] text-slate-400">Varsayılan kategoriler</div>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-5 py-4 font-semibold w-16">İkon</th>
                  <th className="px-5 py-4 font-semibold">Kategori Adı</th>
                  <th className="px-5 py-4 font-semibold">Tür</th>
                  <th className="px-5 py-4 font-semibold">Renk</th>
                  <th className="px-5 py-4 font-semibold">Varsayılan</th>
                  <th className="px-5 py-4 font-semibold text-center">Kullanım Sayısı</th>
                  <th className="px-5 py-4 font-semibold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-xs">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : pagedCategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-xs">
                      Kategori bulunamadı.
                    </td>
                  </tr>
                ) : (
                  pagedCategories.map(item => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                          {getIconNode(item.icon, item.color)}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-800">{item.name}</td>
                      <td className="px-5 py-3">
                        <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold",
                          item.type === "EXPENSE" ? "text-red-600 bg-red-50" : "text-[#10B981] bg-green-50"
                        )}>
                          {item.type === "EXPENSE" ? "Gider" : "Gelir"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 font-medium text-slate-600">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                          {item.color}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold",
                          item.isDefault ? "text-[#10B981] bg-green-50" : "text-slate-500 bg-slate-100"
                        )}>
                          {item.isDefault ? "Evet" : "Hayır"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center text-slate-500 font-medium">{item._count.expenses}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="w-7 h-7 rounded border border-red-200 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-auto px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">
              {loading ? "—" : `${filteredCategories.length} / ${totalCount} kategori`}
            </span>
            <div className="flex items-center gap-1">
              <button
                className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button className="w-6 h-6 rounded bg-[#10B981] text-white text-xs font-bold flex items-center justify-center border border-[#10B981]">
                {page}
              </button>
              <button
                className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <FilterSelect
              value={String(pageSize) as "10" | "20" | "50"}
              onChange={(value) => {
                setPageSize(Number(value) as 10 | 20 | 50);
                setPage(1);
              }}
              options={[
                { value: "10", label: "10 / sayfa" },
                { value: "20", label: "20 / sayfa" },
                { value: "50", label: "50 / sayfa" },
              ]}
              ariaLabel="Kategori sayfa boyutu"
              triggerClassName="w-28 px-2"
            />
          </div>
        </div>
      </div>

      {/* Right Column (Sidebar) - Yeni / Düzenle Kategori */}
      {showPanel && (
        <div className="w-full lg:w-[320px] shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full sticky top-[84px]">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {editingId ? "Kategori Düzenle" : "Yeni Kategori"}
              </h2>
              <button className="text-slate-400 hover:text-slate-600" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-6 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Kategori adı</label>
                <input
                  type="text"
                  placeholder="Kategori adı giriniz"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Tür</label>
                <FilterSelect
                  value={form.type}
                  onChange={(value) => setForm((f) => ({ ...f, type: value as "INCOME" | "EXPENSE" }))}
                  options={[
                    { value: "EXPENSE", label: "Gider" },
                    { value: "INCOME", label: "Gelir" },
                  ]}
                  ariaLabel="Kategori türü"
                  triggerClassName="w-full justify-between px-3"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">İkon</label>
                <div className="grid grid-cols-4 gap-2">
                  {iconKeys.map((key) => (
                    <button
                      key={key}
                      onClick={() => setForm(f => ({ ...f, icon: key }))}
                      className={cn("w-10 h-10 rounded-lg border flex items-center justify-center transition-colors",
                        form.icon === key
                          ? "border-[#10B981] bg-green-50 text-[#10B981]"
                          : "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                      )}
                    >
                      {React.cloneElement(iconMap[key] as React.ReactElement<any>, { className: "w-4 h-4" })}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">Renk</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setForm(f => ({ ...f, color }))}
                      className={cn("w-6 h-6 rounded-full", form.color === color && "ring-2 ring-offset-2 ring-[#10B981]")}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="text-xs font-bold text-slate-800 mb-0.5">Varsayılan mı?</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight w-48">
                    Bu kategori yeni kullanıcılar için varsayılan olarak seçilecektir.
                  </div>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
                  className={cn("w-10 h-5 rounded-full relative transition-colors", form.isDefault ? "bg-[#10B981]" : "bg-slate-300")}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all",
                    form.isDefault ? "right-0.5" : "left-0.5"
                  )}></div>
                </button>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 mt-auto bg-white rounded-b-xl flex flex-col gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="w-full h-10 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button
                onClick={handleCancel}
                className="w-full h-10 rounded-lg border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const LayersIcon = (props:any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
const ShoppingBagIcon = (props:any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
const StarIcon = (props:any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
