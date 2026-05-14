"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Target,
  Calendar,
  TrendingUp,
  Clock,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { AIInsightCard } from "@/components/ui/ai-insight-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { calculateGoalFeasibility } from "@/lib/finance/calculations";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  category?: string | null;
  note: string | null;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, "success" | "warning" | "muted" | "info"> =
  {
    ACTIVE: "info",
    COMPLETED: "success",
    PAUSED: "muted",
  };

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  COMPLETED: "Tamamlandı",
  PAUSED: "Duraklatıldı",
};

const PRIORITY_LABEL: Record<string, string> = {
  HIGH: "Yüksek",
  MEDIUM: "Orta",
  LOW: "Düşük",
};

const PRIORITY_BADGE: Record<string, "danger" | "warning" | "muted"> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "muted",
};

// ─── Big SVG Progress Ring ────────────────────────────────────────────────────

function BigProgressRing({
  percent,
  size = 120,
}: {
  percent: number;
  size?: number;
}) {
  const pct = Math.min(Math.round(percent), 100);
  const strokeW = 10;
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const stroke =
    pct >= 100
      ? "#10B981"
      : pct >= 60
      ? "#3B82F6"
      : pct >= 30
      ? "#F59E0B"
      : "#EF4444";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth={strokeW}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeW}
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        x={cx}
        y={cy + 6}
        textAnchor="middle"
        fontSize={size * 0.18}
        fontWeight="bold"
        fill="#0F172A"
      >
        {pct}%
      </text>
    </svg>
  );
}

// ─── Add Funds Form ───────────────────────────────────────────────────────────

const addFundsSchema = z.object({
  amount: z.coerce.number().positive("Tutar sıfırdan büyük olmalıdır."),
});
type AddFundsFormData = z.infer<typeof addFundsSchema>;

function AddFundsForm({
  goal,
  onSuccess,
}: {
  goal: Goal;
  onSuccess: (updated: Goal) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddFundsFormData>({ resolver: zodResolver(addFundsSchema) });

  async function onSubmit(data: AddFundsFormData) {
    try {
      const newAmount = goal.currentAmount + data.amount;
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount: newAmount }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`${formatCurrency(data.amount)} eklendi.`);
        reset();
        onSuccess(json.data);
      } else {
        toast.error(json.error?.message ?? "İşlem başarısız.");
      }
    } catch {
      toast.error("Bağlantı hatası.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row sm:items-end gap-3">
      <div className="flex-1 w-full">
        <Input
          label="Eklenecek Tutar (₺)"
          type="number"
          step="0.01"
          min={1}
          placeholder="500"
          {...register("amount")}
          error={errors.amount?.message}
        />
      </div>
      <Button type="submit" variant="primary" loading={isSubmitting} className="w-full sm:w-auto">
        Ekle
      </Button>
    </form>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  title,
  monthlyAmount,
  months,
  endDate,
  borderClass,
  icon,
}: {
  title: string;
  monthlyAmount: number;
  months: number;
  endDate: Date;
  borderClass: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border-2 bg-white p-4 space-y-2 ${borderClass}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
      </div>
      <div>
        <p className="text-xs text-muted">Aylık Katkı</p>
        <p className="text-base font-bold text-primary">
          {formatCurrency(monthlyAmount)}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted">Tahmini Süre</p>
        <p className="text-sm font-medium text-primary">{months} ay</p>
      </div>
      <div>
        <p className="text-xs text-muted">Bitiş Tarihi</p>
        <p className="text-sm font-medium text-primary">
          {endDate.toLocaleDateString("tr-TR", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const goalId = params.id;

  const [goal, setGoal] = React.useState<Goal | null>(null);
  const [loading, setLoading] = React.useState(true);

  async function fetchGoal() {
    try {
      // Try direct endpoint first; fall back to list + filter
      const res = await fetch(`/api/goals/${goalId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setGoal(json.data);
      } else {
        // Fallback: fetch list and filter
        const listRes = await fetch("/api/goals");
        const listJson = await listRes.json();
        if (listJson.success) {
          const found = (listJson.data as Goal[]).find(
            (g) => g.id === goalId
          );
          if (found) setGoal(found);
          else toast.error("Hedef bulunamadı.");
        } else {
          toast.error("Hedef bilgileri yüklenemedi.");
        }
      }
    } catch {
      toast.error("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchGoal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 rounded" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="rounded-xl border border-border bg-white shadow-sm p-8 text-center">
        <p className="text-sm text-muted">Hedef bulunamadı.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/app/goals")}
        >
          Hedeflere Dön
        </Button>
      </div>
    );
  }

  const progress =
    goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  // Feasibility
  const feasibility = calculateGoalFeasibility(goal, 0);

  // Monthly calculation for plans
  let baseMonthly = 1000;
  let baseMonths = remaining > 0 ? Math.ceil(remaining / baseMonthly) : 0;

  if (goal.deadline && remaining > 0) {
    const deadline = new Date(goal.deadline);
    const diffMs = deadline.getTime() - Date.now();
    const diffMonths = Math.max(
      Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)),
      1
    );
    baseMonths = diffMonths;
    baseMonthly = remaining / diffMonths;
  }

  const comfortMonthly = baseMonthly * 0.8;
  const comfortMonths =
    comfortMonthly > 0 ? Math.ceil(remaining / comfortMonthly) : 0;
  const fastMonthly = baseMonthly * 1.2;
  const fastMonths =
    fastMonthly > 0 ? Math.ceil(remaining / fastMonthly) : 0;

  const baseEnd = new Date();
  baseEnd.setMonth(baseEnd.getMonth() + baseMonths);
  const comfortEnd = new Date();
  comfortEnd.setMonth(comfortEnd.getMonth() + comfortMonths);
  const fastEnd = new Date();
  fastEnd.setMonth(fastEnd.getMonth() + fastMonths);

  // AI Insights
  const aheadOfSchedule =
    feasibility.progressPercent > 50 &&
    feasibility.monthsRemaining !== null &&
    feasibility.monthsRemaining < (baseMonths || 12) / 2;

  const aiInsights = [
    feasibility.isFeasible
      ? {
          text: `Bu hedefe ulaşmak mevcut hızda ${
            feasibility.monthsRemaining !== null
              ? feasibility.monthsRemaining + " ay içinde"
              : "planlandığı sürede"
          } mümkün görünüyor.`,
          type: "success" as const,
        }
      : {
          text: `Hedefe ulaşmak için aylık ${formatCurrency(
            feasibility.requiredMonthly
          )} birikim gerekiyor. Mevcut harcamaları gözden geçirin.`,
          type: "warning" as const,
        },
    {
      text: `İlerleme: %${feasibility.progressPercent.toFixed(1)} — ${
        feasibility.progressPercent < 25
          ? "Başlangıç aşamasında, düzenli birikim kritik."
          : feasibility.progressPercent < 75
          ? "İyi bir hız, devam edin!"
          : "Hedefe çok yakınsınız!"
      }`,
      type:
        feasibility.progressPercent >= 75
          ? ("success" as const)
          : ("info" as const),
    },
    ...(goal.deadline && !feasibility.isFeasible
      ? [
          {
            text: `Son tarih: ${formatDate(goal.deadline)}. Aylık ${formatCurrency(
              feasibility.shortfall ?? 0
            )} açık var.`,
            type: "warning" as const,
          },
        ]
      : []),
    ...(aheadOfSchedule
      ? [
          {
            text: "Planın önündesiniz! Fazla birikimi başka hedefe yönlendirebilirsiniz.",
            type: "success" as const,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/app/goals")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-h2 font-semibold text-primary">{goal.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_BADGE[goal.status]}>
                {STATUS_LABEL[goal.status]}
              </Badge>
              <Badge variant={PRIORITY_BADGE[goal.priority]}>
                {PRIORITY_LABEL[goal.priority]} Öncelik
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/app/goals?edit=${goal.id}`)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Düzenle
        </Button>
      </div>

      {/* Hero Card */}
      <div className="rounded-xl border border-border bg-white shadow-sm p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Big ring */}
          <BigProgressRing percent={progress} size={120} />

          {/* Stats */}
          <div className="flex-1 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">
                Mevcut Birikim
              </p>
              <p className="mt-1 text-lg font-bold text-accent">
                {formatCurrency(goal.currentAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">
                Hedef Tutar
              </p>
              <p className="mt-1 text-lg font-bold text-primary">
                {formatCurrency(goal.targetAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">
                Kalan
              </p>
              <p className="mt-1 text-lg font-bold text-primary">
                {formatCurrency(remaining)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">
                Hedef Tarihi
              </p>
              <p className="mt-1 text-sm font-semibold text-primary flex items-center gap-1">
                {goal.deadline ? (
                  <>
                    <Calendar className="h-3.5 w-3.5 text-muted" />
                    {formatDate(goal.deadline)}
                  </>
                ) : (
                  <span className="text-muted">Belirtilmemiş</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Note */}
        {goal.note && (
          <p className="mt-4 text-sm text-muted border-t border-border pt-4">
            {goal.note}
          </p>
        )}
      </div>

      {/* 3 Plan Cards */}
      {remaining > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PlanCard
            title="Mevcut Plan"
            monthlyAmount={Math.round(baseMonthly)}
            months={baseMonths}
            endDate={baseEnd}
            borderClass="border-border"
            icon={<Target className="h-4 w-4 text-muted" />}
          />
          <PlanCard
            title="Daha Rahat Plan"
            monthlyAmount={Math.round(comfortMonthly)}
            months={comfortMonths}
            endDate={comfortEnd}
            borderClass="border-blue-400"
            icon={<Clock className="h-4 w-4 text-blue-500" />}
          />
          <PlanCard
            title="Hızlandırılmış Plan"
            monthlyAmount={Math.round(fastMonthly)}
            months={fastMonths}
            endDate={fastEnd}
            borderClass="border-accent"
            icon={<Zap className="h-4 w-4 text-accent" />}
          />
        </div>
      )}

      {/* Full-width AI Insight */}
      <AIInsightCard
        title="AI Hedef Analizi"
        insights={aiInsights}
        ctaLabel="Strateji Geliştir"
        ctaHref="/app/assistant"
      />

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        {/* Left: Contributions */}
        <div className="rounded-xl border border-border bg-white shadow-sm p-5">
          <h2 className="mb-4 text-base font-semibold text-primary">
            Hedefe Eklenen Birikimler
          </h2>
          <p className="text-sm text-muted">
            Mevcut birikim toplamı: {formatCurrency(goal.currentAmount)}. Ayrı işlem geçmişi modeli bulunmadığı için son kayıtlı toplam gösteriliyor.
          </p>
          {/* Add funds form for active goals */}
          {goal.status === "ACTIVE" && (
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="mb-3 text-sm font-semibold text-primary">
                Bu Hedefe Para Ekle
              </h3>
              <AddFundsForm
                goal={goal}
                onSuccess={(updated) => setGoal(updated)}
              />
            </div>
          )}
        </div>

        {/* Right: Summary */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-xl border border-border bg-white shadow-sm p-5 space-y-4">
            <h2 className="text-base font-semibold text-primary">
              Hedef Özeti
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">İlerleme</span>
                <span className="font-semibold text-primary">
                  %{progress.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Durum</span>
                <Badge variant={STATUS_BADGE[goal.status]}>
                  {STATUS_LABEL[goal.status]}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Öncelik</span>
                <Badge variant={PRIORITY_BADGE[goal.priority]}>
                  {PRIORITY_LABEL[goal.priority]}
                </Badge>
              </div>
              {goal.category && (
                <div className="flex justify-between">
                  <span className="text-muted">Kategori</span>
                  <span className="font-medium text-primary">
                    {goal.category}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">Oluşturulma</span>
                <span className="font-medium text-primary">
                  {formatDate(goal.createdAt)}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="text-muted flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Biriken
                  </span>
                  <span className="font-semibold text-accent">
                    {formatCurrency(goal.currentAmount)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-muted flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" />
                    Hedef
                  </span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(goal.targetAmount)}
                  </span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-muted flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Kalan
                  </span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </div>
            </div>

            <Link href="/app/assistant">
              <Button variant="outline" className="w-full mt-2">
                AI Asistana Sor
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
