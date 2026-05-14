"use client";

import * as React from "react";
import {
  Target,
  RefreshCcw,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Plus,
  ChevronRight,
  Calendar,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FilterSelect } from "@/components/ui/filter-select";
import { DatePickerField } from "@/components/ui/date-picker";

type ActionPlanItem = {
  id: string;
  title: string;
  description: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  dueDate: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
};

type ActionPlan = {
  id: string;
  title: string;
  summary: string | null;
  weekStart: string;
  weekEnd: string;
  items: ActionPlanItem[];
};

function StatusSelect({
  value,
  onChange,
}: {
  value: ActionPlanItem["status"];
  onChange: (value: ActionPlanItem["status"]) => void;
}) {
  return (
    <div onClick={(event) => event.stopPropagation()}>
      <FilterSelect<ActionPlanItem["status"]>
        ariaLabel="Görev durumu"
        value={value}
        onChange={onChange}
        options={[
          { value: "PENDING", label: "Yapılacak" },
          { value: "IN_PROGRESS", label: "Sürüyor" },
          { value: "COMPLETED", label: "Tamamlandı" },
          { value: "SKIPPED", label: "Atlandı" },
        ]}
        triggerClassName="h-7 min-w-28 rounded-md px-2 text-[10px]"
      />
    </div>
  );
}

const days = [
  { name: "Pzt" },
  { name: "Sal" },
  { name: "Çar" },
  { name: "Per" },
  { name: "Cum" },
  { name: "Cmt" },
  { name: "Paz" },
];

const statusText: Record<ActionPlanItem["status"], string> = {
  PENDING: "Yapılacak",
  IN_PROGRESS: "Devam ediyor",
  COMPLETED: "Tamamlandı",
  SKIPPED: "Atlandı",
};

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Süresi geçti";
  if (diff === 0) return "Son gün: Bugün";
  return `Son gün: ${diff} gün kaldı`;
}

function priorityRank(priority: ActionPlanItem["priority"]): number {
  if (priority === "HIGH") return 1;
  if (priority === "MEDIUM") return 2;
  return 3;
}

function priorityMeta(priority: ActionPlanItem["priority"]): { label: string; colorClass: string } {
  if (priority === "HIGH") return { label: "Yüksek Öncelik", colorClass: "text-red-600 bg-red-50" };
  if (priority === "MEDIUM") return { label: "Orta Öncelik", colorClass: "text-orange-600 bg-orange-50" };
  return { label: "Düşük Öncelik", colorClass: "text-slate-600 bg-slate-100" };
}


export default function ActionPlanPage() {
  const [plan, setPlan] = React.useState<ActionPlan | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = React.useState(false);
  const [isSavingTask, setIsSavingTask] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskDescription, setNewTaskDescription] = React.useState("");
  const [newTaskCategory, setNewTaskCategory] = React.useState("");
  const [newTaskPriority, setNewTaskPriority] = React.useState<ActionPlanItem["priority"]>("MEDIUM");
  const [newTaskStatus, setNewTaskStatus] = React.useState<ActionPlanItem["status"]>("PENDING");
  const [newTaskDueDate, setNewTaskDueDate] = React.useState("");

  React.useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch("/api/ai/action-plan");
        const json = await res.json();
        if (json.data) setPlan(json.data);
      } catch (error) {
        toast.error("Aksiyon planı yüklenirken bir sorun oluştu.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlan();
  }, []);

  async function handleCreatePlan() {
    setIsCreating(true);
    try {
      const res = await fetch("/api/ai/action-plan", { method: "POST" });
      const json = await res.json();
      if (json.data) {
        setPlan(json.data);
        toast.success("Yeni aksiyon planı başarıyla oluşturuldu.");
      } else {
        toast.error("Aksiyon planı oluşturulamadı.");
      }
    } catch (error) {
      toast.error("Aksiyon planı oluşturulurken bir sorun oluştu.");
    } finally {
      setIsCreating(false);
    }
  }

  async function updateItemStatus(itemId: string, status: ActionPlanItem["status"]) {
    if (!plan) return;

    const previousPlan = plan;
    setPlan({
      ...plan,
      items: plan.items.map((item) =>
        item.id === itemId ? { ...item, status } : item
      ),
    });

    try {
      const res = await fetch("/api/ai/action-plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_STATUS", itemId, status }),
      });

      if (!res.ok) throw new Error("Status update failed");
      toast.success("Görev durumu kaydedildi.");
    } catch {
      setPlan(previousPlan);
      toast.error("Görev durumu kaydedilemedi.");
    }
  }

  function openAddTaskModal(status: ActionPlanItem["status"]) {
    setNewTaskStatus(status);
    setNewTaskPriority(status === "COMPLETED" ? "LOW" : status === "IN_PROGRESS" ? "MEDIUM" : "HIGH");
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskCategory("");
    setNewTaskDueDate("");
    setIsAddTaskOpen(true);
  }

  async function handleAddTaskSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTaskTitle.trim()) {
      toast.error("Görev başlığı zorunludur.");
      return;
    }

    setIsSavingTask(true);
    try {
      const res = await fetch("/api/ai/action-plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_ITEM",
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
          category: newTaskCategory.trim(),
          priority: newTaskPriority,
          status: newTaskStatus,
          dueDate: newTaskDueDate ? `${newTaskDueDate}T12:00:00.000Z` : "",
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) throw new Error("Görev eklenemedi.");

      setPlan(json.data);
      setIsAddTaskOpen(false);
      toast.success("Görev eklendi.");
    } catch {
      toast.error("Görev eklenirken bir sorun oluştu.");
    } finally {
      setIsSavingTask(false);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>, status: ActionPlanItem["status"]) {
    event.preventDefault();
    const itemId = event.dataTransfer.getData("text/action-item-id");
    if (!itemId) return;

    const item = plan?.items.find((current) => current.id === itemId);
    if (!item || item.status === status) return;
    updateItemStatus(itemId, status);
  }

  const todoItems = plan?.items.filter(i => i.status === "PENDING") ?? [];
  const doingItems = plan?.items.filter(i => i.status === "IN_PROGRESS") ?? [];
  const doneItems = plan?.items.filter(i => i.status === "COMPLETED") ?? [];
  const skippedItems = plan?.items.filter(i => i.status === "SKIPPED") ?? [];
  const totalItems = plan?.items.length ?? 0;
  const completedCount = doneItems.length;
  const activeTotal = Math.max(totalItems - skippedItems.length, 0);
  const remainingCount = todoItems.length + doingItems.length;
  const progressPercent = activeTotal > 0 ? Math.round((completedCount / activeTotal) * 100) : 0;
  const focusItems = [...(plan?.items ?? [])]
    .filter((item) => item.status !== "COMPLETED" && item.status !== "SKIPPED")
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    .slice(0, 3);
  const weekStart = plan ? new Date(plan.weekStart) : null;
  const dayStatus = days.map((day, index) => {
    if (!weekStart) return { ...day, items: [] as ActionPlanItem[], status: "NONE" as const };
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    const items = (plan?.items ?? []).filter((item) => {
      if (!item.dueDate) return false;
      const due = new Date(item.dueDate);
      return due.getFullYear() === date.getFullYear() && due.getMonth() === date.getMonth() && due.getDate() === date.getDate();
    });
    const status = items.some((item) => item.status === "COMPLETED")
      ? "COMPLETED"
      : items.some((item) => item.status === "IN_PROGRESS")
        ? "IN_PROGRESS"
        : items.some((item) => item.status === "PENDING")
          ? "PENDING"
          : "NONE";
    return { ...day, items, status };
  });

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 pb-8 h-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Haftalık Aksiyon Planı</h1>
          <p className="mt-1 text-sm text-slate-500">
            AI finans koçunun bu hafta için önerdiği uygulanabilir görevler.
          </p>
        </div>
        <button onClick={handleCreatePlan} disabled={isCreating} className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-60">
           <RefreshCcw className={cn("w-4 h-4", isCreating && "animate-spin")} /> {isCreating ? "Oluşturuluyor..." : "AI İle Planı Yenile"}
        </button>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center shrink-0 border-[6px] border-green-100">
            <Target className="w-8 h-8 text-[#10B981]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1">Bu Haftanın Hedefi</div>
            {isLoading ? (
              <div className="h-6 w-64 bg-slate-100 rounded animate-pulse mb-3"></div>
            ) : plan ? (
              <h2 className="text-lg font-bold text-slate-900 mb-3">{plan.title}</h2>
            ) : (
              <h2 className="text-lg font-bold text-slate-900 mb-3">Henüz plan oluşturulmadı.</h2>
            )}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700">
                {completedCount} / {totalItems} <span className="font-medium text-slate-500">görev tamamlandı</span>
              </span>
              <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#10B981] transition-all" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleCreatePlan}
          disabled={isCreating}
          className="flex items-center gap-2 h-10 px-4 rounded-lg border border-[#10B981] text-[#10B981] text-sm font-bold hover:bg-green-50 shadow-sm transition-colors disabled:opacity-60"
        >
          <RefreshCcw className={cn("w-4 h-4", isCreating && "animate-spin")} />
          {isCreating ? "Plan oluşturuluyor..." : "Yeni Plan Oluştur"}
        </button>
      </div>

      {/* Row 1 — 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600 mb-1">Tamamlanan Görev</div>
            <div className="text-2xl font-bold text-slate-900">{completedCount}</div>
            <div className="text-[10px] text-slate-400">Bu hafta tamamlanan</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600 mb-1">Kalan Görev</div>
            <div className="text-2xl font-bold text-slate-900">{remainingCount}</div>
            <div className="text-[10px] text-slate-400">Tamamlanmayı bekleyen</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600 mb-1">Tahmini Etki</div>
            <div className="text-2xl font-bold text-slate-900">—</div>
            <div className="text-[10px] text-slate-400">Bu hafta tasarruf potansiyeli</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600 mb-1">Öncelikli Risk</div>
            {plan && todoItems.length > 0 ? (
              <>
                <div className="text-sm font-bold text-slate-900 leading-tight mb-0.5 truncate max-w-[140px]">{todoItems[0].title}</div>
                <div className="text-[10px] text-slate-400">En yüksek öncelikli görev</div>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-slate-900 leading-tight mb-0.5">—</div>
                <div className="text-[10px] text-slate-400">Risk tespit edilmedi</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 — Kanban + AI Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        {/* Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">

          {/* Column: Yapılacak */}
          <div className="flex flex-col gap-3" onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, "PENDING")}>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-slate-900">Yapılacak</h3>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{todoItems.length}</span>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm h-20 animate-pulse"></div>
            ) : !plan ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-4 flex items-center justify-center text-xs text-slate-400 font-medium h-20">
                Plan yok
              </div>
            ) : (
              todoItems.map(item => {
                const { label, colorClass } = priorityMeta(item.priority);
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/action-item-id", item.id)}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3 hover:border-slate-300 cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0 text-slate-500">
                          <Target className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 leading-snug">{item.title}</span>
                      </div>
                      <StatusSelect
                        value={item.status}
                        onChange={(value) => updateItemStatus(item.id, value)}
                      />
                    </div>
                    <div className={cn("text-[9px] font-bold px-2 py-0.5 rounded w-max", colorClass)}>
                      {label}
                    </div>
                    {item.dueDate && (
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 pt-2 border-t border-slate-100">
                        <Calendar className="w-3 h-3" /> {formatDueDate(item.dueDate)}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <button onClick={() => openAddTaskModal("PENDING")} className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs font-bold hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" /> Görev Ekle
            </button>
          </div>

          {/* Column: Devam Ediyor */}
          <div className="flex flex-col gap-3" onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, "IN_PROGRESS")}>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-slate-900">Devam Ediyor</h3>
              <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{doingItems.length}</span>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-4 h-20 animate-pulse"></div>
            ) : !plan ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-4 flex items-center justify-center text-xs text-slate-400 font-medium h-20">
                Plan yok
              </div>
            ) : (
              doingItems.map(item => {
                const { label, colorClass } = priorityMeta(item.priority);
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/action-item-id", item.id)}
                    className="bg-white rounded-xl border border-orange-200 shadow-sm p-4 flex flex-col gap-3 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded border border-slate-100 bg-orange-50 flex items-center justify-center shrink-0 text-orange-500">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 leading-snug">{item.title}</span>
                      </div>
                      <StatusSelect
                        value={item.status}
                        onChange={(value) => updateItemStatus(item.id, value)}
                      />
                    </div>
                    <div className={cn("text-[9px] font-bold px-2 py-0.5 rounded w-max", colorClass)}>
                      {label}
                    </div>
                    {item.dueDate && (
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 pt-2 border-t border-slate-100">
                        <Calendar className="w-3 h-3" /> {formatDueDate(item.dueDate)}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <button onClick={() => openAddTaskModal("IN_PROGRESS")} className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs font-bold hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" /> Görev Ekle
            </button>
          </div>

          {/* Column: Tamamlandı */}
          <div className="flex flex-col gap-3" onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, "COMPLETED")}>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-slate-900">Tamamlandı</h3>
              <span className="bg-green-50 text-[#10B981] text-[10px] font-bold px-2 py-0.5 rounded-full">{doneItems.length}</span>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-20 animate-pulse opacity-70"></div>
            ) : !plan ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-4 flex items-center justify-center text-xs text-slate-400 font-medium h-20">
                Plan yok
              </div>
            ) : (
              doneItems.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/action-item-id", item.id)}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 opacity-70 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center shrink-0 text-white mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 line-through mb-1 leading-snug">{item.title}</div>
                      {item.dueDate && (
                        <div className="text-[10px] font-medium text-slate-500">
                          Tamamlandı: {new Date(item.dueDate).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
                        </div>
                      )}
                    </div>
                  </div>
                      <StatusSelect
                        value={item.status}
                        onChange={(value) => updateItemStatus(item.id, value)}
                      />
                </div>
              ))
            )}

            <button onClick={() => openAddTaskModal("COMPLETED")} className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs font-bold hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" /> Görev Ekle
            </button>
          </div>

          {/* Column: Atlandı */}
          <div className="flex flex-col gap-3" onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, "SKIPPED")}>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold text-slate-900">Atlandı</h3>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{skippedItems.length}</span>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-20 animate-pulse opacity-70"></div>
            ) : !plan ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-4 flex items-center justify-center text-xs text-slate-400 font-medium h-20">
                Plan yok
              </div>
            ) : (
              skippedItems.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/action-item-id", item.id)}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 opacity-75 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-1 leading-snug">{item.title}</div>
                      {item.dueDate && (
                        <div className="text-[10px] font-medium text-slate-500">
                          Son gün: {new Date(item.dueDate).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
                        </div>
                      )}
                    </div>
                  </div>
                      <StatusSelect
                        value={item.status}
                        onChange={(value) => updateItemStatus(item.id, value)}
                      />
                </div>
              ))
            )}

            <button onClick={() => openAddTaskModal("SKIPPED")} className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs font-bold hover:bg-slate-50 hover:text-slate-700 transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" /> Görev Ekle
            </button>
          </div>
        </div>

        {/* AI Panel */}
        <div className="flex flex-col gap-4">
          {/* AI Finans Koçu */}
          <div className="bg-[#ECFDF5] border border-green-100 rounded-xl p-5 shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-white rounded-bl-full opacity-40 z-0"></div>

            <div className="z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#10B981]" />
                <h2 className="text-sm font-bold text-slate-900">AI Finans Koçu</h2>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl shrink-0">🤖</div>
                <p className="text-[11px] font-medium text-slate-700 leading-relaxed">
                  {plan?.summary ?? "Yeni bir plan oluşturarak AI koçunun önerilerini görebilirsin."}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 border border-green-100">
                    <Target className="w-3 h-3 text-[#10B981]" />
                  </div>
                  <p className="text-[10px] font-medium text-slate-700 leading-relaxed mt-0.5">Disiplinli küçük adımlar, büyük sonuçlar getirir.</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 border border-green-100">
                    <TrendingUp className="w-3 h-3 text-[#10B981]" />
                  </div>
                  <p className="text-[10px] font-medium text-slate-700 leading-relaxed mt-0.5">
                    {plan ? `${totalItems} görevden ${completedCount} tanesi tamamlandı.` : "Planını oluştur ve hedeflerine ulaş."}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 border border-green-100">
                    <Clock className="w-3 h-3 text-[#10B981]" />
                  </div>
                  <p className="text-[10px] font-medium text-slate-700 leading-relaxed mt-0.5">
                    {plan ? `${remainingCount} görev tamamlanmayı bekliyor.` : "Yeni plan oluşturmak için butona tıkla."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Önerilen Odak Alanlar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Önerilen Odak Alanlar</h3>
            <div className="space-y-3">
              {focusItems.length > 0 ? (
                focusItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-[#10B981] shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-slate-900">{item.title}</div>
                        <div className="text-[9px] font-medium text-slate-500">{priorityMeta(item.priority).label} / {statusText[item.status]}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs font-medium text-slate-500">
                  Plan oluştuğunda öncelikli görevlerin burada listelenir.
                </div>
              )}
            </div>
            <button onClick={handleCreatePlan} disabled={isCreating} className="w-full mt-4 flex items-center justify-between px-4 py-2.5 rounded-lg border border-[#10B981] bg-white text-[#10B981] text-xs font-bold hover:bg-green-50 transition-colors disabled:opacity-60">
              Detaylı AI Analizi <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 4 — Bottom Bar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-8 w-full pr-8 border-r border-slate-100">
            <div>
              <div className="text-sm font-bold text-slate-900 mb-1">Haftalık İlerleme</div>
              <div className="text-3xl font-bold text-[#10B981] leading-none mb-1">
                {completedCount} <span className="text-xl text-slate-400 font-medium">/ {totalItems}</span>
              </div>
              <div className="text-[10px] text-slate-500">görev tamamlandı</div>
            </div>

            <div className="flex-1 flex justify-between relative px-4">
              <div className="absolute top-4 left-8 right-8 h-0.5 bg-slate-100 -z-10"></div>
              {dayStatus.map((day, i) => (
                <div key={day.name} className="flex flex-col items-center gap-2">
                  <div className="text-[10px] font-bold text-slate-900">{day.name}</div>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    day.status === "COMPLETED" && "bg-[#10B981] text-white",
                    day.status === "IN_PROGRESS" && "bg-orange-100 text-orange-600",
                    day.status === "PENDING" && "bg-slate-200 text-slate-600",
                    day.status === "NONE" && "bg-slate-100 text-slate-400"
                  )}>
                    {i + 1}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500">{day.items.length > 0 ? `${day.items.length} görev` : "—"}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="pl-8 shrink-0 flex flex-col gap-2 text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981]"></span> Tamamlandı</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Devam Ediyor</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300"></span> Yapılacak</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="text-4xl">🏅</div>
          <div>
            <div className="text-sm font-bold text-slate-900 mb-1">Harika gidiyorsun! 💪</div>
            <p className="text-[10px] font-medium text-slate-500 leading-relaxed">İstikrarlı devam edersen hedeflerine çok daha hızlı ulaşacaksın.</p>
          </div>
        </div>
      </div>

      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Yeni Görev Ekle</h2>
                <p className="text-[11px] text-slate-500">Planına elle bir görev ekle.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTaskOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handleAddTaskSubmit} className="space-y-4 px-5 py-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Görev başlığı</label>
                <input
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#10B981]"
                  placeholder="Örn. Gereksiz abonelikleri iptal et"
                  maxLength={120}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Açıklama</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(event) => setNewTaskDescription(event.target.value)}
                  className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#10B981]"
                  placeholder="Görevin neden önemli olduğunu kısa biçimde yaz."
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Öncelik</label>
                  <select
                    value={newTaskPriority}
                    onChange={(event) => setNewTaskPriority(event.target.value as ActionPlanItem["priority"])}
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#10B981]"
                  >
                    <option value="HIGH">Yüksek</option>
                    <option value="MEDIUM">Orta</option>
                    <option value="LOW">Düşük</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Durum</label>
                  <select
                    value={newTaskStatus}
                    onChange={(event) => setNewTaskStatus(event.target.value as ActionPlanItem["status"])}
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#10B981]"
                  >
                    <option value="PENDING">Yapılacak</option>
                    <option value="IN_PROGRESS">Devam ediyor</option>
                    <option value="COMPLETED">Tamamlandı</option>
                    <option value="SKIPPED">Atlandı</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tarih</label>
                  <DatePickerField
                    ariaLabel="Görev tarihi"
                    value={newTaskDueDate}
                    onChange={setNewTaskDueDate}
                    placeholder="Tarih seçin"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kategori</label>
                <input
                  value={newTaskCategory}
                  onChange={(event) => setNewTaskCategory(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#10B981]"
                  placeholder="Örn. Abonelikler, tasarruf, borç"
                  maxLength={80}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSavingTask}
                  className="h-10 rounded-lg bg-[#10B981] px-4 text-sm font-bold text-white hover:bg-[#059669] disabled:opacity-60"
                >
                  {isSavingTask ? "Kaydediliyor..." : "Görevi Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
