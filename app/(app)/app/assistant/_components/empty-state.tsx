"use client";

import * as React from "react";
import {
  CreditCard,
  HeartPulse,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

type OverviewSummary = {
  monthlyExpenses: number;
  monthlyIncome: number;
  netCashflow: number;
  debtLoadRatio: number;
  healthScore: number;
  expenseChange: number;
  topCategoryName?: string;
  topCategoryAmount?: number;
};

type Suggestion = {
  text: string;
  icon: React.ReactNode;
  caption: string;
};

function formatCurrency(val: number): string {
  return "₺" + Math.round(val).toLocaleString("tr-TR");
}

function buildOpener(name: string | null, overview: OverviewSummary | null): string {
  const firstName = name?.split(" ")[0];
  if (!overview || overview.monthlyExpenses === 0) {
    return firstName
      ? `${firstName}, bugün finans tarafında neyi netleştirelim?`
      : "Bugün finans tarafında neyi netleştirelim?";
  }

  const trend =
    overview.expenseChange > 5
      ? `, geçen aya göre %${Math.round(overview.expenseChange)} daha yüksek`
      : overview.expenseChange < -5
        ? `, geçen aya göre %${Math.abs(Math.round(overview.expenseChange))} daha düşük`
        : "";

  return `${firstName ? `${firstName}, ` : ""}bu ay ${formatCurrency(overview.monthlyExpenses)} harcadın${trend}.`;
}

function buildSuggestions(overview: OverviewSummary | null): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (overview && overview.debtLoadRatio > 30) {
    suggestions.push({
      text: "Borçlarımı nasıl önceliklendirmeliyim?",
      caption: "Faiz, taksit ve risk sırasına göre",
      icon: <CreditCard className="w-4 h-4 text-red-500" />,
    });
  }

  if (overview && overview.netCashflow < 0) {
    suggestions.push({
      text: "Bu ay neden açık verdim?",
      caption: "Artan gider kalemlerini bul",
      icon: <TrendingDown className="w-4 h-4 text-orange-500" />,
    });
  } else if (overview && overview.netCashflow > 0) {
    suggestions.push({
      text: `${formatCurrency(overview.netCashflow)} biriktirebilir miyim?`,
      caption: "Nakit akışına göre hedef analizi",
      icon: <Wallet className="w-4 h-4 text-[#10B981]" />,
    });
  }

  if (overview?.topCategoryName) {
    suggestions.push({
      text: `${overview.topCategoryName} harcamam normal mi?`,
      caption: "Kategori harcamasını kıyasla",
      icon: <TrendingUp className="w-4 h-4 text-slate-500" />,
    });
  }

  if (overview && overview.healthScore < 70) {
    suggestions.push({
      text: "Finansal sağlık skorumu nasıl artırırım?",
      caption: "Skoru etkileyen alanları gör",
      icon: <HeartPulse className="w-4 h-4 text-[#10B981]" />,
    });
  }

  suggestions.push({
    text: "Bu hafta ne yapmalıyım?",
    caption: "Öncelikli 3 aksiyon çıkar",
    icon: <Target className="w-4 h-4 text-[#10B981]" />,
  });

  return suggestions.slice(0, 4);
}

export function AssistantEmptyState({
  userName,
  overview,
  onPick,
  disabled,
}: {
  userName: string | null;
  overview: OverviewSummary | null;
  onPick: (text: string) => void;
  disabled?: boolean;
}) {
  const opener = buildOpener(userName, overview);
  const suggestions = buildSuggestions(overview);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-10 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ECFDF5] text-[#059669] shadow-sm ring-1 ring-emerald-100">
        <Sparkles className="w-7 h-7" />
      </div>

      <div className="mb-6 max-w-xl">
        <h2 className="text-xl font-bold tracking-tight text-slate-950">
          {opener}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Harcamalarını, hedeflerini ve borçlarını birlikte analiz edebiliriz. Aşağıdan bir başlangıç seç veya kendi sorunu yaz.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(s.text)}
            disabled={disabled}
            type="button"
            className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#10B981]/40 hover:bg-[#FBFEFC] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-100 group-hover:bg-[#ECFDF5]">
              {s.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-snug text-slate-900">
                {s.text}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                {s.caption}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export type { OverviewSummary };
