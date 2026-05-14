"use client";

import * as React from "react";
import { 
  Target, Wallet, TrendingUp, Clock, Plus, Calendar, Sparkles, ChevronDown, CheckCircle2, AlertTriangle, ArrowUpRight, Pencil, Trash2, X
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DatePickerField } from "@/components/ui/date-picker";

type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";
  note?: string | null;
};

export default function GoalsPage() {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    title: "",
    targetAmount: "",
    currentAmount: "0",
    deadline: "",
    priority: "MEDIUM",
    status: "ACTIVE",
    note: ""
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/goals");
      const json = await res.json();
      if (json.success) setGoals(json.data);
    } catch {
      toast.error("Hedefler yüklenemedi.");
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
        targetAmount: Number(formData.targetAmount),
        currentAmount: Number(formData.currentAmount),
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        priority: formData.priority,
        status: formData.status,
        note: formData.note
      };

      const url = editingId ? `/api/goals/${editingId}` : "/api/goals";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success(editingId ? "Hedef güncellendi." : "Hedef eklendi.");
        setIsModalOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error?.message || "Bilinmeyen bir hata oluştu.");
      }
    } catch {
      toast.error("Hedef kaydedilemedi.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Emin misiniz?")) return;
    try {
      await fetch(`/api/goals/${id}`, { method: "DELETE" });
      toast.success("Hedef silindi.");
      fetchData();
    } catch {
      toast.error("Hedef silinemedi.");
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ title: "", targetAmount: "", currentAmount: "0", deadline: "", priority: "MEDIUM", status: "ACTIVE", note: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingId(goal.id);
    setFormData({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : "",
      priority: goal.priority,
      status: goal.status,
      note: goal.note || ""
    });
    setIsModalOpen(true);
  };

  React.useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId || isLoading || isModalOpen) return;

    const goal = goals.find((item) => item.id === editId);
    if (goal) openEditModal(goal);
  }, [goals, isLoading, isModalOpen]);

  const activeGoals = goals.filter(g => g.status === "ACTIVE");
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const avgProgress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  const chartData = goals.map(g => ({
    name: g.title,
    current: g.currentAmount,
    target: g.targetAmount
  }));

  const getRiskStatus = (goal: Goal) => {
    if (!goal.deadline) return { status: "Dengeli", risk: "medium" };
    const monthsLeft = Math.max(1, Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24 * 30)));
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const requiredPerMonth = remainingAmount / monthsLeft;
    
    // Very simple risk estimation
    if (requiredPerMonth <= 0) return { status: "Ulaşıldı", risk: "low" };
    if (requiredPerMonth > 10000) return { status: "Riskli", risk: "high" };
    if (requiredPerMonth > 3000) return { status: "Dengeli", risk: "medium" };
    return { status: "Ulaşılabilir", risk: "low" };
  };

  const riskiestGoal = [...goals]
    .sort((a, b) => {
      const aRisk = getRiskStatus(a).risk === "high" ? 0 : getRiskStatus(a).risk === "medium" ? 1 : 2;
      const bRisk = getRiskStatus(b).risk === "high" ? 0 : getRiskStatus(b).risk === "medium" ? 1 : 2;
      return aRisk - bRisk;
    })[0];
  const goalInsight = goals.length === 0
    ? "Hedef eklediginde AI fizibilite yorumu burada gorunecek."
    : riskiestGoal
      ? `${riskiestGoal.title} hedefi oncelikli takip edilmeli. Ortalama ilerleme %${avgProgress}; aylik birikim planini bu hedefe gore guncelle.`
      : "Hedeflerin dengeli ilerliyor.";

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 pb-8 h-full relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasarruf Hedefleri</h1>
          <p className="mt-1 text-sm text-slate-500">
            Birikim hedeflerini oluştur, ilerlemeyi takip et ve AI'dan gerçekçi plan al.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openAddModal} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] shadow-sm">
            <Plus className="w-4 h-4" /> Yeni Hedef Ekle
          </button>
        </div>
      </div>

      {/* Row 1 — 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
            <Target className="w-5 h-5 text-[#10B981]" />
          </div>
          <div className="text-xs font-medium text-slate-600 mb-1">Aktif Hedef</div>
          <div className="text-2xl font-bold text-slate-900 mb-2">{activeGoals.length}</div>
          <div className="text-[10px] text-slate-400">Devam eden hedef sayısı</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
            <Wallet className="w-5 h-5 text-[#10B981]" />
          </div>
          <div className="text-xs font-medium text-slate-600 mb-1">Toplam Hedef Tutarı</div>
          <div className="text-2xl font-bold text-slate-900 mb-2">₺{totalTarget.toLocaleString('tr-TR')}</div>
          <div className="text-[10px] text-slate-400">Tüm hedeflerin toplamı</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-xs font-medium text-slate-600 mb-1">Biriken Tutar</div>
          <div className="text-2xl font-bold text-slate-900 mb-2">₺{totalCurrent.toLocaleString('tr-TR')}</div>
          <div className="text-[10px] text-slate-400">Tüm hedeflerde biriken</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-xs font-medium text-slate-600 mb-1">Ortalama İlerleme</div>
          <div className="text-2xl font-bold text-slate-900 mb-2">%{avgProgress}</div>
          <div className="text-[10px] text-slate-400">Hedeflerin ortalama ilerlemesi</div>
        </div>
      </div>

      {/* Row 2 — Goals Cards + AI Insight */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
        {/* Goal Cards */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col self-start">
          {isLoading ? (
            <div className="text-sm text-slate-500">Yükleniyor...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map(goal => {
                const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
                const { status, risk } = getRiskStatus(goal);
                let timeLeft = "Belirsiz";
                if (goal.deadline) {
                  const monthsLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24 * 30));
                  timeLeft = monthsLeft > 0 ? `${monthsLeft} ay` : "Süresi doldu";
                }

                return (
                  <div key={goal.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col cursor-pointer hover:border-[#10B981] transition-colors relative overflow-hidden group">
                    <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(goal); }} className="text-slate-400 hover:text-slate-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(goal.id); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0 font-bold text-slate-600">
                        {goal.title.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm truncate pr-10">{goal.title}</h3>
                      </div>
                    </div>

                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Hedef</div>
                        <div className="text-sm font-bold text-slate-900">₺{goal.targetAmount.toLocaleString('tr-TR')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-medium">Birikim</div>
                        <div className="text-sm font-bold text-slate-900">₺{goal.currentAmount.toLocaleString('tr-TR')}</div>
                      </div>
                    </div>

                    <div className="relative pt-2 pb-6">
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", risk === "high" ? "bg-orange-500" : "bg-[#10B981]")} style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="absolute right-0 top-6 text-[10px] font-bold text-slate-700">{pct}%</div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5" /> {timeLeft}
                      </div>
                      <div className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border", 
                        risk === "low" ? "text-[#10B981] bg-green-50 border-green-100" : 
                        risk === "medium" ? "text-orange-500 bg-orange-50 border-orange-100" : 
                        "text-red-500 bg-red-50 border-red-100"
                      )}>
                        {risk === "low" ? <CheckCircle2 className="w-3 h-3" /> : risk === "medium" ? <div className="w-3 h-3 border border-current rounded-sm flex items-center justify-center text-[8px]">⚖</div> : <AlertTriangle className="w-3 h-3" />}
                        {status}
                      </div>
                    </div>
                  </div>
                );
              })}
              {goals.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                  Henüz hedef eklenmedi.
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Hedef Yorumu */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col self-start">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#10B981]" />
            <h2 className="text-sm font-bold text-slate-900">AI Hedef Yorumu</h2>
          </div>
          
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                <div className="text-2xl">🤖</div>
              </div>
            </div>
            
            <p className="text-xs text-slate-700 font-medium leading-relaxed mb-6 text-center">
              {goalInsight}
            </p>

            <div className="relative w-full aspect-square max-h-48 mx-auto mt-auto flex items-center justify-center">
              <Target className="w-32 h-32 text-green-100" />
              <ArrowUpRight className="w-16 h-16 text-[#10B981] absolute" />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500">Hedef Özeti</span>
              </div>
              <div className="space-y-2">
                {goals.slice(0, 3).map(g => {
                  const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
                  return (
                    <div key={g.id} className="flex items-center justify-between text-[10px]">
                      <span className="flex items-center gap-1.5 truncate pr-2"><span className="w-4 h-4 flex items-center justify-center bg-slate-100 rounded">{g.title.charAt(0)}</span> {g.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#10B981]" style={{ width: `${pct}%` }}></div></div>
                        <span className="font-bold text-slate-700 w-6 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 — Hedef İlerlemesi Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <h2 className="text-sm font-bold text-slate-900">Hedef İlerlemesi</h2>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#10B981] rounded-sm"></div> Birikim (Mevcut)</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Hedef Tutar</span>
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barGap={0}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(value) => `₺${(value/1000)}k`} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              
              <Bar dataKey="current" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40}>
                {chartData.map((entry, index) => (
                  <text key={`label-${index}`} x={0} y={0} dy={-10} fill="#0F172A" fontSize={10} fontWeight={700} textAnchor="middle">
                    ₺{entry.current.toLocaleString('tr-TR')}
                  </text>
                ))}
              </Bar>
              <Bar dataKey="target" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={40}>
                {chartData.map((entry, index) => (
                  <text key={`label-target-${index}`} x={0} y={0} dy={-10} fill="#64748B" fontSize={10} fontWeight={600} textAnchor="middle">
                    ₺{entry.target.toLocaleString('tr-TR')}
                  </text>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{editingId ? "Hedef Düzenle" : "Yeni Hedef Ekle"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hedef Adı</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="Örn: Yeni Araba" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hedef Tutar (₺)</label>
                  <input required type="number" step="0.01" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mevcut Birikim (₺)</label>
                  <input required type="number" step="0.01" value={formData.currentAmount} onChange={e => setFormData({...formData, currentAmount: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Son Tarih</label>
                  <DatePickerField
                    ariaLabel="Hedef son tarihi"
                    value={formData.deadline}
                    onChange={(value) => setFormData({ ...formData, deadline: value })}
                    placeholder="Tarih seçin"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Öncelik</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981]">
                    <option value="HIGH">Yüksek</option>
                    <option value="MEDIUM">Orta</option>
                    <option value="LOW">Düşük</option>
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
