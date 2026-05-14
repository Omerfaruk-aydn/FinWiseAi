"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BarChart3, FileText, Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import type { AIResponse } from "@/lib/ai/schemas";
import { cn } from "@/lib/utils";

type ActionKind = "budget" | "goal" | "report";

type OverviewStats = {
  monthlyIncome?: number;
  monthlyExpenses?: number;
  netCashflow?: number;
};

async function getOverviewStats(): Promise<OverviewStats> {
  const res = await fetch("/api/analytics/overview");
  if (!res.ok) return {};
  const json = await res.json();
  return json.data?.stats ?? json.stats ?? {};
}

function positiveOrFallback(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

export function AIResultActions({ response }: { response: AIResponse }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<ActionKind | null>(null);

  const handleApplyBudget = async () => {
    setPending("budget");
    try {
      const stats = await getOverviewStats();
      const now = new Date();
      const monthlyIncome = positiveOrFallback(
        response.numbers.monthlyIncome,
        positiveOrFallback(stats.monthlyIncome, 0),
      );
      const monthlyExpense = positiveOrFallback(
        response.numbers.monthlyExpense,
        positiveOrFallback(stats.monthlyExpenses, 0),
      );
      const plannedSaving = positiveOrFallback(
        response.numbers.estimatedSaving,
        Math.max(0, monthlyIncome - monthlyExpense),
      );
      const plannedExpense = monthlyExpense > 0
        ? monthlyExpense
        : Math.max(0, monthlyIncome - plannedSaving);

      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          totalIncome: monthlyIncome,
          plannedExpense,
          plannedSaving,
        }),
      });

      if (!res.ok) throw new Error("Bütçe uygulanamadı.");
      toast.success("AI önerisi bu ayın bütçesine uygulandı.");
      router.push("/app/budget");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bütçe uygulanamadı.");
    } finally {
      setPending(null);
    }
  };

  const handleCreateGoal = async () => {
    setPending("goal");
    try {
      const stats = await getOverviewStats();
      const targetAmount = positiveOrFallback(
        response.numbers.requiredSavingForGoal,
        positiveOrFallback(
          response.numbers.estimatedSaving,
          positiveOrFallback(stats.netCashflow, 10000),
        ),
      );
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 90);

      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: response.diagnosis.mainIssue || "AI Tasarruf Hedefi",
          targetAmount: Math.round(targetAmount),
          currentAmount: 0,
          deadline: deadline.toISOString(),
          priority: response.diagnosis.status === "risk" ? "HIGH" : "MEDIUM",
          note: response.summary,
        }),
      });

      if (!res.ok) throw new Error("Hedef oluşturulamadı.");
      toast.success("AI önerisinden yeni hedef oluşturuldu.");
      router.push("/app/goals");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Hedef oluşturulamadı.");
    } finally {
      setPending(null);
    }
  };

  const handleCreateReport = async () => {
    setPending("report");
    try {
      const now = new Date();
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "MONTHLY",
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        }),
      });

      if (!res.ok) throw new Error("Rapor oluşturulamadı.");
      toast.success("AI raporu oluşturuldu.");
      router.push("/app/reports");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rapor oluşturulamadı.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        Bu cevaptan işlem yap
      </div>
      <div className="flex flex-wrap gap-2">
        <ActionButton
          label="Bütçeye uygula"
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          loading={pending === "budget"}
          disabled={pending !== null}
          onClick={handleApplyBudget}
        />
        <ActionButton
          label="Hedef oluştur"
          icon={<Target className="h-3.5 w-3.5" />}
          loading={pending === "goal"}
          disabled={pending !== null}
          onClick={handleCreateGoal}
        />
        <ActionButton
          label="Rapora dönüştür"
          icon={<FileText className="h-3.5 w-3.5" />}
          loading={pending === "report"}
          disabled={pending !== null}
          onClick={handleCreateReport}
        />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 shadow-sm transition",
        "hover:border-[#10B981]/40 hover:bg-[#ECFDF5] hover:text-[#059669]",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}
