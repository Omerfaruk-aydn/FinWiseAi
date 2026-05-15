"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  CreditCard, 
  Wallet,
  TrendingDown,
  AlertTriangle,
  Bot,
  Plus,
  MoreVertical,
  Calendar,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  CalendarDays,
  Info,
  Clock,
  Pencil,
  Trash2,
  X
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
import { toast } from "sonner";

type Debt = {
  id: string;
  title: string;
  type: "CREDIT_CARD" | "LOAN" | "MORTGAGE" | "OTHER";
  totalAmount: number;
  remainingAmount: number;
  minimumPayment: number;
  interestRate: number;
  dueDay?: number | null;
  note?: string | null;
};

export default function DebtsPage() {
  const router = useRouter();
  const [debts, setDebts] = React.useState<Debt[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [showAllRecommendations, setShowAllRecommendations] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [monthlyIncome, setMonthlyIncome] = React.useState(0);

  const [formData, setFormData] = React.useState({
    title: "",
    type: "CREDIT_CARD",
    totalAmount: "",
    remainingAmount: "",
    minimumPayment: "",
    interestRate: "0",
    dueDay: "",
    note: ""
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [debtRes, overviewRes] = await Promise.all([
        fetch("/api/debts"),
        fetch("/api/analytics/overview"),
      ]);
      const json = await debtRes.json();
      if (json.success) setDebts(json.data);
      if (overviewRes.ok) {
        const overviewJson = await overviewRes.json();
        setMonthlyIncome(overviewJson.data?.stats?.monthlyIncome ?? 0);
      }
    } catch (error) {
      toast.error("Borç verileri yüklenemedi.");
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
        type: formData.type,
        totalAmount: Number(formData.totalAmount),
        remainingAmount: Number(formData.remainingAmount),
        minimumPayment: Number(formData.minimumPayment),
        interestRate: Number(formData.interestRate),
        dueDay: formData.dueDay ? Number(formData.dueDay) : undefined,
        note: formData.note
      };

      const url = editingId ? `/api/debts/${editingId}` : "/api/debts";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success(editingId ? "Borç güncellendi." : "Borç eklendi.");
        setIsModalOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error?.message || "Bilinmeyen bir hata oluştu.");
      }
    } catch {
      toast.error("Borç kaydedilemedi.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Emin misiniz?")) return;
    try {
      await fetch(`/api/debts/${id}`, { method: "DELETE" });
      toast.success("Borç silindi.");
      fetchData();
    } catch {
      toast.error("Borç silinemedi.");
    }
  };

  const handleSaveRecommendations = async () => {
    try {
      const res = await fetch("/api/debts/recommendations", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);
      toast.success("Borç önerileri raporlara kaydedildi.");
      setShowAllRecommendations(false);
      router.push("/app/reports");
    } catch {
      toast.error("Öneriler kaydedilemedi.");
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ title: "", type: "CREDIT_CARD", totalAmount: "", remainingAmount: "", minimumPayment: "", interestRate: "0", dueDay: "", note: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (debt: Debt) => {
    setEditingId(debt.id);
    setFormData({
      title: debt.title,
      type: debt.type,
      totalAmount: debt.totalAmount.toString(),
      remainingAmount: debt.remainingAmount.toString(),
      minimumPayment: debt.minimumPayment.toString(),
      interestRate: debt.interestRate.toString(),
      dueDay: debt.dueDay?.toString() || "",
      note: debt.note || ""
    });
    setIsModalOpen(true);
  };

  const totalRemaining = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const debtLoadRatio = monthlyIncome > 0 ? Math.round((totalMinPayment / monthlyIncome) * 100) : 0;
  
  let riskLevel = "Düşük Risk";
  if (debtLoadRatio > 40) riskLevel = "Yüksek Risk";
  else if (debtLoadRatio > 20) riskLevel = "Orta Risk";
  const highestInterestDebt = [...debts].sort((a, b) => b.interestRate - a.interestRate)[0];
  const riskRecommendations = [
    highestInterestDebt ? `${highestInterestDebt.title} borcunda faiz oranı en yüksek; ekstra ödemeyi önce buraya yönlendir.` : "Aktif borç bulunmuyor.",
    totalMinPayment > 0 ? `Aylık minimum ödeme toplam ${totalMinPayment.toLocaleString("tr-TR")} TL; otomatik ödeme hatırlatıcısı kur.` : "Minimum ödeme yükümlülüğü yok.",
    debtLoadRatio > 40 ? "Borç yükü kritik seviyede; yeni taksit veya kredi kullanmadan önce planı daralt." : "Borç yükünü düşük tutmak için minimumun üzerinde ödeme yap.",
  ];
  const riskComment = debts.length === 0
    ? "Aktif borç kaydı bulunmuyor. Yeni borç eklediğinde risk analizi otomatik güncellenir."
    : debtLoadRatio > 40
      ? "Borç yükün gelirine göre yüksek. Öncelik yüksek faizli borçları azaltmak ve yeni borçlanmayı durdurmak olmalı."
      : debtLoadRatio > 20
        ? "Borç yükün izlenmesi gereken seviyede. Minimum ödemelerin üzerine çıkmak riski azaltır."
        : "Borç yükün kontrol edilebilir seviyede. Düzenli ödeme temposunu koru.";

  const chartData = [
    { name: "Şu An", mevcut: totalRemaining }
  ];

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 pb-8 h-full relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Borç Yönetimi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kredi kartı, kredi ve taksit borçlarını takip et, AI ile riskleri analiz et.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/app/assistant")} className="flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm bg-white">
            <Bot className="w-4 h-4" /> AI Risk Analizi
          </button>
          <button onClick={openAddModal} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] shadow-sm">
            <Plus className="w-4 h-4" /> Borç Ekle
          </button>
        </div>
      </div>

      {/* Row 1 — 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
            <Wallet className="w-5 h-5 text-[#10B981]" />
          </div>
          <div className="text-xs font-medium text-slate-600 mb-1">Toplam Borç</div>
          <div className="text-2xl font-bold text-[#10B981] mb-2">₺{totalRemaining.toLocaleString('tr-TR')}</div>
          <div className="text-[10px] text-slate-400">Toplam {debts.length} borç</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3">
            <CalendarDays className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-xs font-medium text-slate-600 mb-1">Aylık Minimum Ödeme</div>
          <div className="text-2xl font-bold text-orange-500 mb-2">₺{totalMinPayment.toLocaleString('tr-TR')}</div>
          <div className="text-[10px] text-slate-400">Bu ay ödenecek</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
            <TrendingDown className="w-5 h-5 text-[#10B981]" />
          </div>
          <div className="text-xs font-medium text-slate-600 mb-1">Borç Yükü Oranı</div>
          <div className="text-2xl font-bold text-slate-900 mb-2">%{debtLoadRatio}</div>
          <div className="text-[10px] text-slate-400">{monthlyIncome > 0 ? "Gerçek aylık gelire oranı" : "Gelir verisi bekleniyor"}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-xs font-medium text-slate-600 mb-1">Risk Durumu</div>
          <div className="text-2xl font-bold text-orange-500 mb-2">{riskLevel}</div>
          <div className="text-[10px] text-slate-400">Dikkatli yönetim önerilir</div>
        </div>
      </div>

      {/* Row 2 — Borç Listesi + AI Borç Risk Yorumu */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        {/* Borç Listesi */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Borç Listesi</h2>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-3 font-semibold">Borç Adı</th>
                  <th className="pb-3 font-semibold">Kalan Tutar</th>
                  <th className="pb-3 font-semibold">Ödeme</th>
                  <th className="pb-3 font-semibold">Vade Günü</th>
                  <th className="pb-3 font-semibold text-center">Risk</th>
                  <th className="pb-3 font-semibold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {debts.map(item => {
                  let risk = "Düşük Risk";
                  if (item.type === "CREDIT_CARD") risk = "Orta Risk";
                  if (item.interestRate > 20) risk = "Yüksek Risk";

                  const bg = risk === "Yüksek Risk" ? "bg-red-50 text-red-500" : risk === "Orta Risk" ? "bg-orange-50 text-orange-500" : "bg-green-50 text-[#10B981]";
                  
                  return (
                    <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                      <td className="py-3">
                        <div className="flex items-center gap-2 font-medium text-slate-800">
                          <div className={cn("w-8 h-8 rounded border border-current opacity-70 flex items-center justify-center shrink-0 bg-white", bg)}>
                            <CreditCard className="w-4 h-4" />
                          </div>
                          {item.title}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="font-bold text-slate-900">₺{item.remainingAmount.toLocaleString('tr-TR')}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">kalan</div>
                      </td>
                      <td className="py-3 font-medium text-slate-600">₺{item.minimumPayment.toLocaleString('tr-TR')} (min)</td>
                      <td className="py-3">
                        <div className="whitespace-pre-line text-slate-600 font-medium leading-relaxed">
                          {item.dueDay ? `Ayın ${item.dueDay}. günü` : "-"}
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full", 
                          risk === "Orta Risk" ? "text-orange-600 bg-orange-50" : 
                          risk === "Yüksek Risk" ? "text-red-600 bg-red-50" :
                          "text-[#10B981] bg-green-50"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", 
                            risk === "Orta Risk" ? "bg-orange-500" : 
                            risk === "Yüksek Risk" ? "bg-red-500" :
                            "bg-[#10B981]")}></span> {risk}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(item)} className="text-slate-400 hover:text-slate-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {debts.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                Henüz borç eklenmedi.
              </div>
            )}
          </div>
        </div>

        {/* AI Borç Risk Yorumu */}
        <div className="bg-[#ECFDF5] border border-green-100 rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden h-full">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-white rounded-tl-full opacity-30 z-0"></div>
          
          <div className="z-10 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-[#10B981]" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">AI Borç Risk Yorumu</h2>
            </div>

            <p className="text-xs text-slate-700 font-medium leading-relaxed mb-6">
              {riskComment}
            </p>
            
            <div className="space-y-3 mt-auto mb-6">
              <div className="text-xs font-bold text-slate-900 mb-2">Öneriler</div>
              <div className="flex items-start gap-2 text-xs font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                {riskRecommendations[0]}
              </div>
            </div>

            <button onClick={() => setShowAllRecommendations(true)} className="text-[10px] font-bold text-[#10B981] hover:underline flex items-center justify-between w-full mt-auto">
              Tüm önerileri gör <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showAllRecommendations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <h2 className="text-lg font-bold text-slate-900">AI Risk Onerileri</h2>
              <button onClick={() => setShowAllRecommendations(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-4">
              {riskRecommendations.map((recommendation) => (
                <div key={recommendation} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-xs font-medium text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" />
                  <span>{recommendation}</span>
                </div>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => router.push("/app/assistant")} className="h-10 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  Asistanda detaylandır
                </button>
                <button onClick={handleSaveRecommendations} className="h-10 rounded-lg bg-[#10B981] text-xs font-bold text-white hover:bg-[#059669]">
                  Raporlara Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? "Borç Düzenle" : "Yeni Borç Ekle"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Borç Adı</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="Örn: Kredi Kartı" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tür</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]">
                    <option value="CREDIT_CARD">Kredi Kartı</option>
                    <option value="LOAN">Kredi</option>
                    <option value="MORTGAGE">Konut Kredisi</option>
                    <option value="OTHER">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vade Günü</label>
                  <input type="number" min="1" max="31" value={formData.dueDay} onChange={e => setFormData({...formData, dueDay: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="Ayın kaçıncı günü?" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Toplam Tutar (₺)</label>
                  <input required type="number" step="0.01" value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kalan Tutar (₺)</label>
                  <input required type="number" step="0.01" value={formData.remainingAmount} onChange={e => setFormData({...formData, remainingAmount: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aylık Min. Ödeme (₺)</label>
                  <input required type="number" step="0.01" value={formData.minimumPayment} onChange={e => setFormData({...formData, minimumPayment: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Faiz Oranı (%)</label>
                  <input type="number" step="0.01" value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="0.00" />
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
