"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  HeartPulse,
  Info,
  Lightbulb,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIResponse } from "@/lib/ai/schemas";

export type OverviewStats = {
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashflow: number;
  debtLoadRatio: number;
  healthScore: number;
};

function formatCurrency(val: number): string {
  return "₺" + Math.round(val).toLocaleString("tr-TR");
}

const STATUS_BADGE: Record<
  AIResponse["diagnosis"]["status"],
  { label: string; className: string; icon: React.ReactNode }
> = {
  good: {
    label: "İyi durumda",
    className: "text-[#10B981] bg-[#ECFDF5] border-green-100",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  warning: {
    label: "Dikkat",
    className: "text-orange-600 bg-orange-50 border-orange-100",
    icon: <AlertCircle className="w-3 h-3" />,
  },
  risk: {
    label: "Risk",
    className: "text-red-600 bg-red-50 border-red-100",
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

const SEVERITY_TONE = {
  high: { dot: "bg-red-500", text: "text-red-600", label: "Yüksek" },
  medium: { dot: "bg-orange-500", text: "text-orange-600", label: "Orta" },
  low: { dot: "bg-[#10B981]", text: "text-[#059669]", label: "Düşük" },
} as const;

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

export function AssistantSidebar({
  latestResponse,
  overview,
  hasConversation,
}: {
  latestResponse: AIResponse | null;
  overview: OverviewStats | null;
  hasConversation: boolean;
}) {
  const numbers = latestResponse?.numbers ?? {};
  const monthlyIncome = numbers.monthlyIncome ?? overview?.monthlyIncome;
  const monthlyExpense = numbers.monthlyExpense ?? overview?.monthlyExpenses;
  const netCashflow =
    monthlyIncome !== undefined && monthlyExpense !== undefined
      ? monthlyIncome - monthlyExpense
      : overview?.netCashflow;
  const debtLoadRatio = numbers.debtLoadRatio ?? overview?.debtLoadRatio;
  const healthScore = Math.round(numbers.financialHealthScore ?? overview?.healthScore ?? 0);

  const sortedActions = React.useMemo(() => {
    if (!latestResponse) return [];
    const items =
      latestResponse.actionItems.length > 0
        ? latestResponse.actionItems.map((a) => ({
            title: a.title,
            description: a.description,
            priority: a.priority,
          }))
        : latestResponse.recommendations.map((r) => ({
            title: r.title,
            description: r.action,
            priority: (r.difficulty === "hard"
              ? "high"
              : r.difficulty === "medium"
                ? "medium"
                : "low") as "low" | "medium" | "high",
          }));
    return [...items].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  }, [latestResponse]);

  const status = latestResponse?.diagnosis.status ?? "good";
  const score = Math.min(Math.max(healthScore, 0), 100);
  const pendingHint = hasConversation ? "Yanıt hazırlanıyor..." : "Bir soru sor, brifing kişiselleşsin.";

  return (
    <aside className="order-3 w-full shrink-0 xl:order-none xl:w-[320px]">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-950">Finansal Brifing</h2>
              <p className="mt-1 text-xs text-slate-500">Son AI cevabına göre özet</p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                STATUS_BADGE[status].className,
              )}
            >
              {STATUS_BADGE[status].icon}
              {STATUS_BADGE[status].label}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <section className="flex items-center gap-4">
            <div
              className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(#10B981 ${score * 3.6}deg, #E2E8F0 0deg)` }}
            >
              <div className="flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full bg-white">
                <span className="text-2xl font-bold leading-none text-slate-950">{score || "—"}</span>
                <span className="mt-1 text-[10px] font-medium text-slate-500">Skor</span>
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <HeartPulse className="h-3.5 w-3.5 text-[#10B981]" />
                Sağlık Durumu
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {latestResponse?.summary ?? pendingHint}
              </p>
            </div>
          </section>

          <Section title="Metrikler" icon={<Wallet className="h-4 w-4" />}>
            <div className="space-y-2.5">
              <MetricLine
                icon={<TrendingUp className="h-3.5 w-3.5 text-[#10B981]" />}
                label="Aylık Gelir"
                value={monthlyIncome !== undefined ? formatCurrency(monthlyIncome) : "—"}
                valueClass="text-[#10B981]"
              />
              <MetricLine
                icon={<TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                label="Aylık Gider"
                value={monthlyExpense !== undefined ? formatCurrency(monthlyExpense) : "—"}
                valueClass="text-red-500"
              />
              <MetricLine
                icon={<Wallet className="h-3.5 w-3.5 text-[#10B981]" />}
                label="Net Kalan"
                value={netCashflow !== undefined ? formatCurrency(netCashflow) : "—"}
                valueClass={netCashflow !== undefined && netCashflow < 0 ? "text-red-500" : "text-[#10B981]"}
              />
              <MetricLine
                icon={<CreditCard className="h-3.5 w-3.5 text-orange-500" />}
                label="Borç Oranı"
                value={debtLoadRatio !== undefined ? `%${Math.round(debtLoadRatio)}` : "—"}
                valueClass={cn(
                  debtLoadRatio !== undefined && debtLoadRatio > 40
                    ? "text-red-500"
                    : debtLoadRatio !== undefined && debtLoadRatio > 25
                      ? "text-orange-500"
                      : "text-slate-700",
                )}
              />
            </div>
          </Section>

          <Section title="Öne Çıkanlar" icon={<Lightbulb className="h-4 w-4" />}>
            {latestResponse && latestResponse.insights.length > 0 ? (
              <div className="space-y-2">
                {latestResponse.insights.slice(0, 4).map((insight, idx) => {
                  const tone = SEVERITY_TONE[insight.severity];
                  return (
                    <div key={idx} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", tone.dot)} />
                        <span className="truncate text-xs font-semibold text-slate-700" title={insight.description}>
                          {insight.title}
                        </span>
                      </div>
                      <span className={cn("shrink-0 text-[10px] font-bold", tone.text)}>
                        {tone.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyHint icon={<Info className="w-3.5 h-3.5" />} text={pendingHint} />
            )}
          </Section>

          <Section title="Sıradaki Adımlar" icon={<Target className="h-4 w-4" />}>
            {sortedActions.length > 0 ? (
              <div className="space-y-3">
                {sortedActions.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <CheckCircle2
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        item.priority === "high"
                          ? "text-red-500"
                          : item.priority === "medium"
                            ? "text-orange-500"
                            : "text-[#10B981]",
                      )}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold leading-snug text-slate-800">{item.title}</div>
                      <div className="mt-0.5 leading-snug text-slate-500">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyHint icon={<Target className="w-3.5 h-3.5" />} text={pendingHint} />
            )}
          </Section>
        </div>
      </div>
    </aside>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-100 pt-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-900">
        <span className="text-slate-500">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function MetricLine({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 text-slate-600">
        {icon}
        {label}
      </div>
      <div className={cn("font-bold", valueClass)}>{value}</div>
    </div>
  );
}

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
      <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
