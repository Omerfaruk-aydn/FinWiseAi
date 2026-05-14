import type { AgentType } from "@/lib/ai/orchestrator";

export type AgentMeta = {
  agent: AgentType;
  label: string;
  emoji: string;
  slashCommand: string;
  description: string;
  hint: string; // örnek mesaj
};

export const AGENT_META: AgentMeta[] = [
  {
    agent: "SpendingAnalysisAgent",
    label: "Harcama Analisti",
    emoji: "📊",
    slashCommand: "/harcama",
    description: "Harcama kategorilerini ve trendleri analiz et",
    hint: "Bu ay nereye çok harcadım?",
  },
  {
    agent: "BudgetPlannerAgent",
    label: "Bütçe Planlayıcı",
    emoji: "📋",
    slashCommand: "/bütçe",
    description: "Gelir ve gidere göre optimize bütçe oluştur",
    hint: "Bütçemi nasıl düzenlemeliyim?",
  },
  {
    agent: "GoalPlannerAgent",
    label: "Hedef Planlayıcı",
    emoji: "🎯",
    slashCommand: "/hedef",
    description: "Tasarruf hedefleri için plan yap",
    hint: "3 ayda 20.000₺ biriktirmek istiyorum",
  },
  {
    agent: "DebtRiskAgent",
    label: "Borç Analisti",
    emoji: "💳",
    slashCommand: "/borç",
    description: "Borç riskini değerlendir ve önceliklendirme öner",
    hint: "Borçlarımı nasıl önceliklendirmeliyim?",
  },
  {
    agent: "SubscriptionWasteAgent",
    label: "Abonelik Uzmanı",
    emoji: "🔄",
    slashCommand: "/abonelik",
    description: "Kullanılmayan veya fazla abonelikleri tespit et",
    hint: "Hangi aboneliklerimi iptal etmeliyim?",
  },
  {
    agent: "FinancialHealthAgent",
    label: "Finansal Sağlık",
    emoji: "❤️",
    slashCommand: "/sağlık",
    description: "Genel finansal sağlık durumunu değerlendir",
    hint: "Finansal sağlık skorumu analiz et",
  },
  {
    agent: "ActionPlanAgent",
    label: "Aksiyon Planı",
    emoji: "✅",
    slashCommand: "/plan",
    description: "Bu hafta için öncelikli aksiyon listesi oluştur",
    hint: "Bu hafta ne yapmalıyım?",
  },
  {
    agent: "ReportAgent",
    label: "Rapor",
    emoji: "📄",
    slashCommand: "/rapor",
    description: "Bu ay için kapsamlı finansal rapor hazırla",
    hint: "Bu ayın finansal özetini çıkar",
  },
  {
    agent: "ExplanationAgent",
    label: "Açıklama",
    emoji: "💡",
    slashCommand: "/açıkla",
    description: "Finansal kavramları sade dille açıkla",
    hint: "Faiz oranı nedir?",
  },
];

export function getAgentMeta(agent: AgentType | string): AgentMeta | undefined {
  return AGENT_META.find((m) => m.agent === agent);
}
