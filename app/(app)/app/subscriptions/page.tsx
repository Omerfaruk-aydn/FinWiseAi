"use client";

import * as React from "react";
import { 
  Wallet,
  TrendingDown,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  X,
  PiggyBank
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DatePickerField } from "@/components/ui/date-picker";

type Subscription = {
  id: string;
  title: string;
  amount: number;
  billingCycle: "MONTHLY" | "YEARLY";
  nextBillingDate: string;
  category: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    title: "",
    amount: "",
    billingCycle: "MONTHLY",
    nextBillingDate: "",
    category: "Diğer",
    status: "ACTIVE"
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/subscriptions");
      const json = await res.json();
      if (json.success) setSubscriptions(json.data);
    } catch {
      toast.error("Abonelikler yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        amount: Number(formData.amount),
        billingCycle: formData.billingCycle,
        nextBillingDate: new Date(formData.nextBillingDate).toISOString(),
        category: formData.category,
        status: formData.status
      };

      const url = editingId ? `/api/subscriptions/${editingId}` : "/api/subscriptions";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success(editingId ? "Abonelik güncellendi." : "Abonelik eklendi.");
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error("Abonelik kaydedilemedi.");
      }
    } catch {
      toast.error("Abonelik kaydedilemedi.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Emin misiniz?")) return;
    try {
      await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      toast.success("Abonelik silindi.");
      fetchData();
    } catch {
      toast.error("Abonelik silinemedi.");
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ title: "", amount: "", billingCycle: "MONTHLY", nextBillingDate: "", category: "Diğer", status: "ACTIVE" });
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subscription) => {
    setEditingId(sub.id);
    setFormData({
      title: sub.title,
      amount: sub.amount.toString(),
      billingCycle: sub.billingCycle,
      nextBillingDate: sub.nextBillingDate ? new Date(sub.nextBillingDate).toISOString().split('T')[0] : "",
      category: sub.category,
      status: sub.status
    });
    setIsModalOpen(true);
  };

  const activeSubs = subscriptions.filter(s => s.status === "ACTIVE");
  const monthlyTotal = activeSubs.reduce((acc, curr) => acc + (curr.billingCycle === "YEARLY" ? curr.amount / 12 : curr.amount), 0);
  const yearlyTotal = monthlyTotal * 12;
  const monthlyCycleTotal = activeSubs.filter((sub) => sub.billingCycle === "MONTHLY").reduce((sum, sub) => sum + sub.amount, 0);
  const potentialSavings = Math.round(monthlyCycleTotal * 0.12);
  const topSubscription = [...activeSubs].sort((a, b) => {
    const aMonthly = a.billingCycle === "YEARLY" ? a.amount / 12 : a.amount;
    const bMonthly = b.billingCycle === "YEARLY" ? b.amount / 12 : b.amount;
    return bMonthly - aMonthly;
  })[0];
  const subscriptionInsight = activeSubs.length === 0
    ? "Aktif abonelik bulunmuyor. Abonelik eklediğinde analiz paneli otomatik güncellenir."
    : potentialSavings > 0
      ? `${activeSubs.length} aktif abonelik var. Aylık ödediğin servislerde yıllık plana geçiş veya iptal kontrolüyle yaklaşık ₺${potentialSavings.toLocaleString("tr-TR")} tasarruf potansiyeli var.`
      : "Aboneliklerin ağırlıklı olarak yıllık veya düşük maliyetli görünüyor. Yenileme tarihlerini takip etmek yeterli.";

  const chartData = [
    { name: "Bu Ay", value: Math.round(monthlyTotal) }
  ];

  const upcomingBills = [...subscriptions]
    .filter(s => s.status === "ACTIVE")
    .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime())
    .slice(0, 5)
    .map(sub => {
      const d = new Date(sub.nextBillingDate);
      const diff = Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return {
        id: sub.id,
        name: sub.title,
        date: d.toLocaleDateString('tr-TR'),
        amount: `₺${sub.amount}`,
        inDays: diff > 0 ? `${diff} gün kaldı` : (diff === 0 ? "Bugün" : "Gecikti"),
        color: diff <= 3 ? "text-red-500" : "text-[#10B981]",
        bg: diff <= 3 ? "bg-red-50" : "bg-green-50"
      };
    });

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 pb-8 h-full relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Abonelik Takibi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Aylık ve yıllık aboneliklerini takip et, gereksiz harcamaları fark et.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openAddModal} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] shadow-sm">
            <Plus className="w-4 h-4" /> Abonelik Ekle
          </button>
        </div>
      </div>

      {/* Row 1 — 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-1">Aktif Abonelik</div>
            <div className="text-2xl font-bold text-slate-900 leading-none mb-1">{activeSubs.length}</div>
            <div className="text-[10px] text-slate-400">Toplam aktif abonelik</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-1">Aylık Toplam</div>
            <div className="text-2xl font-bold text-slate-900 leading-none mb-1">₺{Math.round(monthlyTotal).toLocaleString('tr-TR')}</div>
            <div className="text-[10px] text-slate-400">Bu ay toplam maliyet</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-1">Yıllık Tahmini Maliyet</div>
            <div className="text-2xl font-bold text-slate-900 leading-none mb-1">₺{Math.round(yearlyTotal).toLocaleString('tr-TR')}</div>
            <div className="text-[10px] text-slate-400">12 aylık tahmini maliyet</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
            <PiggyBank className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-1">Potansiyel Tasarruf</div>
            <div className="text-2xl font-bold text-slate-900 leading-none mb-1">₺{potentialSavings.toLocaleString('tr-TR')}</div>
            <div className="text-[10px] text-slate-400">AI tahmini tasarruf</div>
          </div>
        </div>
      </div>

      {/* Row 2 — Aboneliklerim + AI Abonelik Analizi */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        {/* Aboneliklerim Grid */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Aboneliklerim</h2>
          {isLoading ? (
            <div className="text-sm text-slate-500">Yükleniyor...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptions.map(sub => (
                <div key={sub.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#10B981] transition-colors cursor-pointer relative group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-lg font-bold text-slate-700">
                        {sub.title.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{sub.title}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{sub.category}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-bold text-slate-900">₺{sub.amount} <span className="text-[10px] text-slate-500 font-medium">/ {sub.billingCycle === "MONTHLY" ? "aylık" : "yıllık"}</span></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[9px] text-slate-500 font-medium">Sonraki Faturalama</div>
                      <div className="text-[10px] font-semibold text-slate-800">{new Date(sub.nextBillingDate).toLocaleDateString('tr-TR')}</div>
                    </div>
                    <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", 
                      sub.status === "ACTIVE" ? "text-[#10B981] bg-green-50 border-green-100" :
                      sub.status === "PAUSED" ? "text-orange-500 bg-orange-50 border-orange-100" :
                      "text-slate-500 bg-slate-50 border-slate-200"
                    )}>
                      {sub.status === "ACTIVE" ? "Aktif" : sub.status === "PAUSED" ? "Duraklatıldı" : "İptal Edildi"}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(sub)} className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => handleDelete(sub.id)} className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-red-400 hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {subscriptions.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                  Henüz abonelik eklenmedi.
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Abonelik Analizi */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#10B981]" />
            <h2 className="text-sm font-bold text-slate-900">AI Abonelik Analizi</h2>
          </div>
          
          <div className="p-5 flex-1 flex flex-col gap-5">
            <div className="rounded-lg border border-green-100 bg-green-50/50 p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#10B981] bg-green-100 px-2 py-0.5 rounded w-max mb-3">
                <CheckCircle2 className="w-3 h-3" /> İyi Durumda
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {subscriptionInsight}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center shrink-0 border border-green-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 mb-1">{topSubscription ? `${topSubscription.title} maliyetini gözden geçir` : "Yıllık plana geçiş avantajını kontrol et"}</div>
                  <div className="text-[10px] text-slate-600 font-medium">Aylık ödemelerde yıllık plana geçiş veya iptal kontrolü yaklaşık %10-20 tasarruf sağlayabilir.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-6">Aylık Abonelik Maliyeti Trendi</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(value) => `₺${value}`} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} minPointSize={4} isAnimationActive={false}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(value: number) => `₺${value.toLocaleString("tr-TR")}`}
                    fill="#0F172A"
                    fontSize={10}
                    fontWeight={700}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <Info className="w-3.5 h-3.5" />
            Veriler mevcut aktif aboneliklerinize göre hesaplanmıştır.
          </div>
        </div>

        {/* Yaklaşan Faturalama */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-6">Yaklaşan Faturalama Takvimi</h2>
          <div className="space-y-4 flex-1">
            {upcomingBills.length > 0 ? upcomingBills.map(bill => (
              <div key={bill.id} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-3 w-1/3">
                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600 font-bold">{bill.name.charAt(0).toUpperCase()}</div>
                  <span className="text-slate-900 truncate">{bill.name}</span>
                </div>
                <div className="w-1/3 text-center text-slate-500 font-medium">{bill.date}</div>
                <div className="w-1/6 text-right text-slate-900">{bill.amount}</div>
                <div className="w-1/6 text-right flex justify-end">
                  <span className={cn("px-2 py-0.5 rounded-[4px] text-[10px] whitespace-nowrap", bill.color, bill.bg)}>
                    {bill.inDays}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-sm text-slate-500">Yaklaşan fatura bulunmuyor.</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? "Abonelik Düzenle" : "Yeni Abonelik Ekle"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Abonelik Adı</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="Örn: Netflix" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tutar (₺)</label>
                <input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="0.00" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ödeme Döngüsü</label>
                  <select value={formData.billingCycle} onChange={e => setFormData({...formData, billingCycle: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]">
                    <option value="MONTHLY">Aylık</option>
                    <option value="YEARLY">Yıllık</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="Kategori" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sonraki Ödeme Tarihi</label>
                  <DatePickerField
                    ariaLabel="Sonraki ödeme tarihi"
                    value={formData.nextBillingDate}
                    onChange={(value) => setFormData({ ...formData, nextBillingDate: value })}
                    placeholder="Tarih seçin"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durum</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]">
                    <option value="ACTIVE">Aktif</option>
                    <option value="PAUSED">Duraklatıldı</option>
                    <option value="CANCELLED">İptal Edildi</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-2 border-t border-slate-100">
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

const Info = (props:any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
