// AI Agent İmplementasyonları

import { generateAIJSON, generateAIResponse, cleanJSONText } from "./provider";
import {
  SPENDING_ANALYSIS_PROMPT,
  INCOME_ANALYSIS_PROMPT,
  BUDGET_PLANNER_PROMPT,
  GOAL_PLANNER_PROMPT,
  DEBT_RISK_PROMPT,
  SUBSCRIPTION_WASTE_PROMPT,
  FINANCIAL_HEALTH_PROMPT,
  ACTION_PLAN_PROMPT,
  REPORT_PROMPT,
  EXPLANATION_PROMPT,
  DISCLAIMER,
} from "./prompts";
import {
  AIResponseSchema,
  IncomeAnalysisOutputSchema,
  ActionPlanOutputSchema,
  BudgetPlanOutputSchema,
  ReportOutputSchema,
  type AIResponse,
  type IncomeAnalysisOutput,
  type ActionPlanOutput,
  type BudgetPlanOutput,
  type ReportOutput,
} from "./schemas";

export interface AgentInput {
  userId: string;
  userMessage?: string;
  financialData: FinancialContext;
}

export interface FinancialContext {
  monthlyIncome: number;
  monthlyExpenses: number;
  netCashflow: number;
  savingRate: number;
  debtLoadRatio: number;
  healthScore?: number;
  healthScoreBreakdown?: {
    score: number;
    incomeExpenseRatio: number;
    savingRate: number;
    debtLoad: number;
    spendingDiscipline: number;
    goalProgress: number;
  };
  currency: string;
  currentMonth: number;
  currentYear: number;
  topExpenseCategories: Array<{
    categoryName: string;
    amount: number;
    percent: number;
  }>;
  recentIncomes?: Array<{
    title: string;
    amount: number;
    category: string;
    frequency: string;
    date: string;
  }>;
  recentExpenses?: Array<{
    title: string;
    amount: number;
    category: string;
    paymentMethod: string;
    isRecurring: boolean;
    date: string;
  }>;
  recentTransactions?: Array<{
    title: string;
    amount: number;
    type: string;
    category: string;
    date: string;
  }>;
  debts: Array<{
    id: string;
    title: string;
    type: string;
    remainingAmount: number;
    minimumPayment: number;
    interestRate: number;
  }>;
  goals: Array<{
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string | null;
    progressPercent: number;
  }>;
  subscriptions: Array<{
    id: string;
    title: string;
    amount: number;
    billingCycle: string;
    monthlyAmount: number;
  }>;
  recentInsights?: string;
  profile?: {
    incomeFrequency: string;
    financialGoalType: string;
    riskTolerance: string;
    hasDebt: boolean;
    onboardingCompleted: boolean;
  };
}

export interface IncomeAnalysisContext {
  currency: string;
  currentMonth: number;
  currentYear: number;
  monthlyIncome: number;
  recurringIncome: number;
  oneTimeIncome: number;
  averageMonthlyIncome: number;
  monthlyGrowthRate: number;
  topIncomeShare: number;
  topIncomeSources: Array<{
    name: string;
    amount: number;
    percent: number;
  }>;
  incomeByCategory: Array<{
    name: string;
    amount: number;
    percent: number;
  }>;
  recentIncomeEntries: Array<{
    title: string;
    amount: number;
    category: string;
    frequency: string;
    date: string;
  }>;
}

function extractRequestedItemCount(message?: string): number | null {
  if (!message) return null;
  const lower = message.toLocaleLowerCase("tr-TR");
  const digitMatch = lower.match(/\b([1-9])\s*(?:madde|maddelik|adım|adim|aksiyon|görev|gorev|plan)\b/);
  if (digitMatch) return Math.min(8, Math.max(1, Number(digitMatch[1])));
  if (/\b(üç|uc)\s*(?:madde|maddelik|adım|adim|aksiyon|görev|gorev|plan)\b/.test(lower)) return 3;
  if (/\b(iki)\s*(?:madde|maddelik|adım|adim|aksiyon|görev|gorev|plan)\b/.test(lower)) return 2;
  if (/\b(beş|bes)\s*(?:madde|maddelik|adım|adim|aksiyon|görev|gorev|plan)\b/.test(lower)) return 5;
  return null;
}

function getCurrentDateContext(): string {
  const today = new Date();
  const todayLabel = today.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return [
    "Tarih Bağlamı:",
    `- Bugün: ${todayLabel}`,
    `- ISO Tarih: ${today.toISOString().slice(0, 10)}`,
    `- Güncel Yıl: ${today.getFullYear()}`,
  ].join("\n");
}

function buildContextString(ctx: FinancialContext): string {
  const profileContext = ctx.profile
    ? `- Onboarding: ${ctx.profile.onboardingCompleted ? "Tamamlandi" : "Tamamlanmadi"}
- Gelir Sikligi: ${ctx.profile.incomeFrequency}
- Ana Finansal Hedef: ${ctx.profile.financialGoalType}
- Risk Tercihi: ${ctx.profile.riskTolerance}
- Borc Beyani: ${ctx.profile.hasDebt ? "Borc var" : "Borc yok"}`
    : "- Profil verisi yok";

  return `${getCurrentDateContext()}
KULLANICININ FİNANSAL VERİLERİ (${ctx.currentMonth}/${ctx.currentYear}):

Profil:
${profileContext}

Gelir/Gider:
- Aylık Gelir: ${ctx.monthlyIncome.toFixed(0)} ${ctx.currency}
- Aylık Gider: ${ctx.monthlyExpenses.toFixed(0)} ${ctx.currency}
- Net Nakit Akışı: ${ctx.netCashflow.toFixed(0)} ${ctx.currency}
- Tasarruf Oranı: %${ctx.savingRate.toFixed(1)}
- Borç Ödeme Oranı: %${ctx.debtLoadRatio.toFixed(1)}
${ctx.healthScore !== undefined ? `- Finansal Sağlık Skoru: ${ctx.healthScore}/100` : ""}

En Yüksek Harcama Kategorileri:
${ctx.topExpenseCategories.map((c) => `- ${c.categoryName}: ${c.amount.toFixed(0)} ${ctx.currency} (%${c.percent.toFixed(1)})`).join("\n") || "- Veri yok"}

Son Gelir Kayıtları:
${ctx.recentIncomes?.length
  ? ctx.recentIncomes
      .map((i) => `- ${i.date}: ${i.title} / ${i.category} / ${i.frequency} / ${i.amount.toFixed(0)} ${ctx.currency}`)
      .join("\n")
  : "- Veri yok"}

Son Gider Kayıtları:
${ctx.recentExpenses?.length
  ? ctx.recentExpenses
      .map((e) => `- ${e.date}: ${e.title} / ${e.category} / ${e.paymentMethod} / ${e.isRecurring ? "Tekrarlayan" : "Tek seferlik"} / ${e.amount.toFixed(0)} ${ctx.currency}`)
      .join("\n")
  : "- Veri yok"}

Son İşlemler:
${ctx.recentTransactions?.length
  ? ctx.recentTransactions
      .map((t) => `- ${t.date}: ${t.type} / ${t.title} / ${t.category} / ${t.amount.toFixed(0)} ${ctx.currency}`)
      .join("\n")
  : "- Veri yok"}

Borç Kayıtları:
${ctx.debts.length > 0
  ? ctx.debts
      .map(
        (d) =>
          `- ${d.title} (${d.type}): Kalan ${d.remainingAmount.toFixed(0)} ${ctx.currency}, Min. Ödeme ${d.minimumPayment.toFixed(0)} ${ctx.currency}, Faiz %${d.interestRate}`
      )
      .join("\n")
  : "- Aktif borç yok"}

Tasarruf Hedefleri:
${ctx.goals.length > 0
  ? ctx.goals
      .map(
        (g) =>
          `- ${g.title}: Hedef ${g.targetAmount.toFixed(0)} ${ctx.currency}, Mevcut ${g.currentAmount.toFixed(0)} ${ctx.currency} (%${g.progressPercent.toFixed(0)} tamamlandı)${g.deadline ? `, Son: ${g.deadline}` : ""}`
      )
      .join("\n")
  : "- Aktif hedef yok"}

Abonelikler:
${ctx.subscriptions.length > 0
  ? ctx.subscriptions
      .map(
        (s) =>
          `- ${s.title}: ${s.monthlyAmount.toFixed(0)} ${ctx.currency}/ay (${s.billingCycle})`
      )
      .join("\n")
  : "- Abonelik yok"}
`.trim();
}

function parseAndValidateResponse(rawJson: unknown): AIResponse {
  const parsed = AIResponseSchema.safeParse(rawJson);
  if (parsed.success) return parsed.data;
  throw new Error("AI yanıtı doğrulanamadı.");
}

function parseAndValidateIncomeResponse(rawJson: unknown): IncomeAnalysisOutput {
  const parsed = IncomeAnalysisOutputSchema.safeParse(rawJson);
  if (parsed.success) return parsed.data;
  throw new Error("Gelir analizi doğrulanamadı.");
}

function buildDeterministicIncomeAnalysisFallback(
  input: IncomeAnalysisContext
): IncomeAnalysisOutput {
  const currency = input.currency || "TRY";
  const topSource = input.topIncomeSources[0];
  const topCategory = input.incomeByCategory[0];
  const recurringShare = input.monthlyIncome > 0 ? (input.recurringIncome / input.monthlyIncome) * 100 : 0;
  const oneTimeShare = input.monthlyIncome > 0 ? (input.oneTimeIncome / input.monthlyIncome) * 100 : 0;
  const growth = input.monthlyGrowthRate;
  const status: "good" | "warning" | "risk" =
    input.monthlyIncome <= 0
      ? "risk"
      : growth >= 10 && recurringShare >= 60
        ? "good"
        : growth >= 0
          ? "warning"
          : "risk";

  const summary =
    input.monthlyIncome > 0
      ? `Aylık gelir ${formatMoneyForAI(input.monthlyIncome, currency)} seviyesinde. Düzenli gelir oranı ${formatPercentForAI(recurringShare)} ile güçlü görünürken, tek seferlik gelir payı ${formatPercentForAI(oneTimeShare)}. Gelir akışını daha dengeli hale getirmek için en büyük kaynak ve kategori payını sıkı takip etmek gerekir.`
      : "Kayıtlı gelir verisi bulunmadığı için gelir akışını değerlendirmek için önce düzenli kayıt tutmak gerekir. En azından gelir kaynaklarını ve kategorileri netleştirmek, sonraki analizlerin doğruluğunu artırır.";

  return {
    summary,
    diagnosis: {
      status,
      mainIssue:
        input.monthlyIncome <= 0
          ? "Kayıtlı gelir verisi yetersiz."
          : topSource
            ? `En güçlü kaynak ${topSource.name} üzerinden yoğunlaşma var.`
            : "Gelir kaynakları yeterince ayrışmıyor.",
      explanation:
        input.monthlyIncome > 0
          ? `Bu ay toplam gelir ${formatMoneyForAI(input.monthlyIncome, currency)}. Düzenli gelir ${formatMoneyForAI(input.recurringIncome, currency)}, tek seferlik gelir ${formatMoneyForAI(input.oneTimeIncome, currency)}. Aylık büyüme oranı ${formatPercentForAI(growth)}. En büyük gelir kaynağı varsa bu kaynak planlamada ana referans olmalı; tek kaynağa bağımlılığı azaltmak için ikinci bir gelir hattı oluşturmak da faydalı olur.`
          : "Gelir analizi için yeterli kayıt olmadığı için sistem yalnızca kayıt eksikliğini gösterebilir. Gelirlerin kategori ve kaynak bazında düzenli girilmesi, sonraki analizlerin güvenilirliğini artırır.",
    },
    insights: [
      {
        title: "Gelir istikrarı",
        description:
          recurringShare >= 60
            ? "Gelirin büyük kısmı düzenli kaynaklardan geliyor; bu, planlama açısından güçlü bir işaret."
            : "Düzenli gelir payını artırmak, aylık planlamayı daha öngörülebilir hale getirir.",
        severity: recurringShare >= 60 ? "low" : "medium",
      },
      {
        title: "Kaynak yoğunlaşması",
        description:
          topSource
            ? `${topSource.name} gelir akışında öne çıkıyor. Bu kaynağın değişmesi toplam geliri doğrudan etkileyebilir.`
            : "Gelir kaynakları net ayrışmadığı için analiz sınırlı kalıyor.",
        severity: topSource && topSource.percent >= 70 ? "high" : "medium",
      },
      {
        title: "Tek seferlik gelir payı",
        description:
          oneTimeShare > 0
            ? `Tek seferlik gelir payı ${formatPercentForAI(oneTimeShare)}. Bu gelir, düzenli bütçe planında ihtiyatla kullanılmalı.`
            : "Tek seferlik gelir görünmüyor; bu, gelir akışını daha tahmin edilebilir yapar.",
        severity: oneTimeShare >= 40 ? "medium" : "low",
      },
    ],
    recommendations: [
      {
        title: "Ana gelir kaynağını izole et",
        action: topSource
          ? `${topSource.name} gelirini ayrı takip ederek aylık dalgalanma riskini görünür hale getir.`
          : "Her gelir kaynağını ayrı satırda takip etmeye başla.",
        estimatedImpact: "Gelir bağımlılığı daha net görünür.",
        difficulty: "easy",
      },
      {
        title: "Düzenli gelir oranını yükselt",
        action:
          recurringShare < 60
            ? "Mümkünse düzenli gelir sağlayan bir ikinci kanal ekle ve tek seferlik gelire olan bağımlılığı azalt."
            : "Mevcut düzenli gelir akışını koru ve otomatik takip oluştur.",
        estimatedImpact: "Aylık bütçe daha öngörülebilir olur.",
        difficulty: "medium",
      },
      {
        title: "Tek seferlik gelirleri ayrıştır",
        action:
          oneTimeShare > 0
            ? "Tek seferlik gelirleri harcama planına doğrudan karıştırma; önce birikim veya tampon hesabına ayır."
            : "Tek seferlik gelir oluşursa ayrı bir kategoriye kaydet.",
        estimatedImpact: "Yanlış bütçe varsayımı azalır.",
        difficulty: "easy",
      },
      {
        title: "Gelir kategorilerini temiz tut",
        action:
          topCategory
            ? `${topCategory.name} kategorisini standartlaştır ve aynı gelir türünü farklı isimlerle kaydetme.`
            : "Gelir kategorilerini az ama net tut.",
        estimatedImpact: "Analiz kalitesi artar.",
        difficulty: "easy",
      },
    ],
    numbers: {
      monthlyIncome: input.monthlyIncome,
      recurringIncome: input.recurringIncome,
      oneTimeIncome: input.oneTimeIncome,
      averageMonthlyIncome: input.averageMonthlyIncome,
      monthlyGrowthRate: input.monthlyGrowthRate,
      topIncomeShare: input.topIncomeShare,
    },
    actionItems: [
      {
        title: "Bu haftanın gelir kaynaklarını netleştir",
        description: "Her gelir kaynağını tek tek gözden geçir ve aynı kaynağı farklı isimlerle kaydetmediğinden emin ol.",
        dueInDays: 2,
        priority: "high",
      },
      {
        title: "Düzenli gelir takibi aç",
        description: "Aylık tekrar eden gelirleri ayrı izlemeye başla ve toplam gelir içindeki payını kontrol et.",
        dueInDays: 3,
        priority: "medium",
      },
      {
        title: "Tek seferlik gelirleri ayır",
        description: "Düzensiz gelir geldiğinde bunu doğrudan harcama bütçesine değil, ayrı bir hesaba kaydet.",
        dueInDays: 4,
        priority: "medium",
      },
    ],
    chart: {
      type: "bar",
      title: "Gelir Kaynakları",
      unit: getCurrencySymbol(currency),
      data: input.topIncomeSources.slice(0, 6).map((source) => ({
        label: source.name,
        value: source.amount,
      })),
    },
    followUps: [
      "Gelirlerimi daha dengeli nasıl artırırım?",
      "Bu ayki gelir dağılımını tabloyla göster",
      "Düzenli gelirlerimi nasıl güçlendiririm?",
    ],
    disclaimer: DISCLAIMER,
  };
}

function getCurrencySymbol(currency?: string): string {
  const normalized = (currency || "TRY").toUpperCase();
  const symbols: Record<string, string> = {
    TRY: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };

  return symbols[normalized] ?? normalized;
}

function formatMoneyForAI(amount: number, currency?: string): string {
  const safeAmount = Number.isFinite(amount) ? Math.abs(amount) : 0;
  const value = new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 0,
  }).format(safeAmount);

  return `${value} ${getCurrencySymbol(currency)}`;
}

function formatPercentForAI(value: number): string {
  return `%${new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0)}`;
}

function formatCashflowForAI(amount: number, currency?: string): string {
  if (amount > 0) return `${formatMoneyForAI(amount, currency)} fazla veriyor`;
  if (amount < 0) return `${formatMoneyForAI(amount, currency)} açık veriyor`;
  return "tam dengede görünüyor";
}

export function buildFinancialHealthFallbackResponse(
  input: AgentInput,
  scoreBreakdown: {
    score: number;
    incomeExpenseRatio: number;
    savingRate: number;
    debtLoad: number;
    spendingDiscipline: number;
    goalProgress: number;
  }
): AIResponse {
  const data = input.financialData;
  const currency = data.currency || "TRY";
  const score = Math.round(scoreBreakdown.score);
  const status: "good" | "warning" | "risk" = score >= 70 ? "good" : score >= 50 ? "warning" : "risk";
  const topCategory = data.topExpenseCategories[0];
  const cashflowRisk = data.netCashflow < 0 || scoreBreakdown.incomeExpenseRatio < 13;
  const savingRisk = scoreBreakdown.savingRate < 10;
  const goalRisk = scoreBreakdown.goalProgress < 7;
  const debtRisk = scoreBreakdown.debtLoad < 12;
  const strongest =
    scoreBreakdown.debtLoad >= 16
      ? "borç kontrolü"
      : scoreBreakdown.spendingDiscipline >= scoreBreakdown.incomeExpenseRatio
      ? "harcama disiplini"
      : "gelir-gider dengesi";
  const weakest = cashflowRisk
    ? "gelir-gider dengesi"
    : savingRisk
      ? "tasarruf oranı"
      : goalRisk
        ? "hedef ilerlemesi"
        : debtRisk
          ? "borç kontrolü"
          : "harcama disiplini";
  const topExpenseText = topCategory
    ? `${topCategory.categoryName} ${formatMoneyForAI(topCategory.amount, currency)} ile giderlerin yaklaşık ${formatPercentForAI(topCategory.percent)} kısmını oluşturuyor`
    : "kategori bazlı gider dağılımı için yeterli kayıt görünmüyor";
  const cashflowText = formatCashflowForAI(data.netCashflow, currency);
  const stabilizationTarget =
    data.netCashflow < 0
      ? Math.abs(data.netCashflow)
      : Math.max(data.monthlyExpenses - data.monthlyIncome * 0.7, 0);

  return {
    summary:
      status === "good"
        ? `Finansal sağlık skorun ${score}/100. En güçlü alanın ${strongest}; aylık gelir ${formatMoneyForAI(data.monthlyIncome, currency)}, gider ${formatMoneyForAI(data.monthlyExpenses, currency)} ve nakit akışın ${cashflowText}. Skoru daha da yükseltmek için ana odak ${weakest} olmalı.`
        : status === "warning"
          ? `Finansal sağlık skorun ${score}/100 ve orta seviyede. Aylık gelir ${formatMoneyForAI(data.monthlyIncome, currency)}, gider ${formatMoneyForAI(data.monthlyExpenses, currency)}; nakit akışın ${cashflowText}. En güçlü alan ${strongest}, ama ${weakest} tarafı skoru aşağı çekiyor.`
          : `Finansal sağlık skorun ${score}/100 ve riskli bölgede. Aylık gelir ${formatMoneyForAI(data.monthlyIncome, currency)}, gider ${formatMoneyForAI(data.monthlyExpenses, currency)}; nakit akışın ${cashflowText}. Önce ${weakest} düzeltilmeli, ardından hedef katkısı planlanmalı.`,
    diagnosis: {
      status,
      mainIssue:
        cashflowRisk
          ? "Gelir-gider dengesi nakit akışını zorluyor."
          : `Geliştirilmesi gereken ana alan: ${weakest}.`,
      explanation:
        `Skor ${score}/100. Gelir-gider dengesi ${scoreBreakdown.incomeExpenseRatio}/25, tasarruf oranı ${scoreBreakdown.savingRate}/20, borç kontrolü ${scoreBreakdown.debtLoad}/20, harcama disiplini ${scoreBreakdown.spendingDiscipline}/20 ve hedef ilerlemesi ${scoreBreakdown.goalProgress}/15 puan. ${topExpenseText}. Bu yüzden öneriler önce nakit akışını gerçekçi seviyeye çekmeye, sonra hedef katkısını sürdürülebilir hale getirmeye odaklanır.`,
    },
    insights: [
      {
        title: "Güçlü yön",
        description:
          strongest === "borç kontrolü"
            ? "Aktif borç baskısı düşük görünüyor; bu, skoru koruyan önemli bir avantaj."
            : `${strongest} tarafı diğer bileşenlere göre daha güçlü görünüyor.`,
        severity: "low",
      },
      {
        title: "Ana risk",
        description:
          cashflowRisk
            ? `Nakit akışı ${cashflowText}; bu durum hedef katkısı yapmayı zorlaştırır.`
            : `${weakest} toplam skoru aşağı çeken ana alan.`,
        severity: status === "good" ? "medium" : "high",
      },
      {
        title: "Gider yoğunlaşması",
        description:
          topCategory
            ? `${topCategory.categoryName} kategorisi en büyük gider alanı. İlk optimizasyon burada daha yüksek etki üretir.`
            : "Kategori bazlı gider dağılımı net olmadığı için önce gider kayıtlarını kategorilerle tamamlamak gerekir.",
        severity: topCategory && topCategory.percent >= 50 ? "high" : "medium",
      },
    ],
    recommendations: cashflowRisk
      ? [
          {
            title: "Açığı kapat",
            action: stabilizationTarget > 0
              ? `Önce aylık baskıyı azaltmak için giderleri yaklaşık ${formatMoneyForAI(stabilizationTarget, currency)} düşür veya aynı tutarda ek gelir planla.`
              : "Önce gelir-gider dengesini haftalık takip et ve yeni gider eklemeden mevcut akışı koru.",
            estimatedImpact: data.netCashflow < 0 ? "Nakit akışı negatife düşmez." : "Gider oranı daha sağlıklı seviyeye iner.",
            difficulty: "medium",
          },
          {
            title: "En büyük gideri kontrol et",
            action: topCategory
              ? `${topCategory.categoryName} için bu ay üst limit belirle ve yeni harcamaları haftalık takip et.`
              : "Giderlerini kategoriyle kaydet ve ilk hafta en büyük 3 kalemi çıkar.",
            estimatedImpact: "En yüksek etkili harcama alanı görünür hale gelir.",
            difficulty: "easy",
          },
          {
            title: "Hedef katkısını geçici olarak gerçekçi yap",
            action: "Nakit akışı pozitife dönene kadar hedef katkısını artırmak yerine sabit ve küçük bir tutarla koru.",
            estimatedImpact: "Hedef bozulmadan bütçe baskısı azalır.",
            difficulty: "easy",
          },
        ]
      : [
          {
            title: "Hedef katkısını netleştir",
            action: "Aylık fazla tutarın sürdürülebilir bir bölümünü otomatik olarak hedef hesabına aktar.",
            estimatedImpact: "Hedef ilerlemesi düzenli hale gelir.",
            difficulty: "medium",
          },
          {
            title: "En büyük gideri izle",
            action: topCategory
              ? `${topCategory.categoryName} harcamalarını haftalık kontrol et ve ay sonu hedef limit koy.`
              : "Kategori bazlı gider takibini tamamla.",
            estimatedImpact: "Tasarruf oranı korunur.",
            difficulty: "easy",
          },
          {
            title: "Takip rutini kur",
            action: "Gelir, gider ve hedef ilerlemesini her hafta aynı gün kontrol et.",
            estimatedImpact: "Sapmalar erken fark edilir.",
            difficulty: "easy",
          },
        ],
    numbers: {
      financialHealthScore: score,
    },
    actionItems: [
      {
        title: cashflowRisk ? "Aylık açığı kapat" : "Bu hafta giderleri gözden geçir",
        description: cashflowRisk
          ? "Gelirden fazla giden kısmı kapatmak için azaltılacak veya ertelenecek giderleri işaretle."
          : "Sabit gider kalemlerini çıkar ve azaltılabilir olanları işaretle.",
        dueInDays: 3,
        priority: "high",
      },
      {
        title: topCategory ? `${topCategory.categoryName} limitini belirle` : "Kategori takibini tamamla",
        description: topCategory
          ? `${topCategory.categoryName} için bu ay aşılmayacak bir üst limit yaz.`
          : "Giderlerini kategoriyle kaydet ve en büyük kalemleri görünür hale getir.",
        dueInDays: 5,
        priority: "medium",
      },
      {
        title: "Haftalık kontrol planı yap",
        description: "Gelir, gider ve hedef ilerlemesini her hafta aynı gün kontrol et.",
        dueInDays: 7,
        priority: "medium",
      },
    ],
    chart: {
      type: "bar",
      title: "Finansal Sağlık Bileşenleri",
      unit: "puan",
      data: [
        { label: "Gelir-Gider", value: scoreBreakdown.incomeExpenseRatio },
        { label: "Tasarruf", value: scoreBreakdown.savingRate },
        { label: "Borç Kontrolü", value: scoreBreakdown.debtLoad },
        { label: "Harcama", value: scoreBreakdown.spendingDiscipline },
        { label: "Hedefler", value: scoreBreakdown.goalProgress },
      ],
    },
    followUps: [
      "Bu ay en çok hangi giderim arttı?",
      "Hedefime ulaşmak için ne kadar ayırmalıyım?",
      "Hangi harcamayı önce kısmalıyım?",
    ],
    disclaimer: DISCLAIMER,
  };
}

// ============================================================
// SPENDING ANALYSIS AGENT
// ============================================================
export function buildSpendingAnalysisPrompt(input: AgentInput): { prompt: string; systemPrompt: string } {
  const contextStr = buildContextString(input.financialData);
  const userQuery = input.userMessage ?? "Bu ayki harcamalarımı analiz et.";
  const isCuttingQuestion = /kıs|kis|azalt|düşür|dusur|önce|once|hangi harcama|hangi gider/i.test(userQuery);
  const prompt = `${contextStr}

KULLANICI SORUSU: ${userQuery}

Yukarıdaki verilere dayanarak harcama analizini yap ve aşağıdaki JSON formatında yanıt ver:
{
  "summary": "kısa özet (1-2 cümle)",
  "diagnosis": {
    "status": "good|warning|risk",
    "mainIssue": "en önemli sorun veya pozitif durum",
    "explanation": "detaylı açıklama"
  },
  "insights": [
    {"title": "...", "description": "...", "severity": "low|medium|high"}
  ],
  "recommendations": [
    {"title": "...", "action": "...", "estimatedImpact": "...", "difficulty": "easy|medium|hard"}
  ],
  "numbers": {
    "monthlyIncome": sayı,
    "monthlyExpense": sayı,
    "estimatedSaving": sayı
  },
  "actionItems": [
    {"title": "...", "description": "...", "dueInDays": sayı, "priority": "low|medium|high"}
  ],
  "chart": {
    "type": "bar",
    "title": "Kategori Bazlı Harcama",
    "unit": "₺",
    "data": [
      {"label": "Kategori Adı", "value": sayı}
    ]
  },
  "followUps": ["takip sorusu 1", "takip sorusu 2", "takip sorusu 3"],
  "disclaimer": "${DISCLAIMER}"
}

chart alanında verilen harcama kategorilerini (topExpenseCategories) kullan. followUps alanında konuya özgü 3 Türkçe takip sorusu üret.`;
  const systemPrompt = `${SPENDING_ANALYSIS_PROMPT}

KALITE BEKLENTISI:
- Kullanici belirli bir kategori soruyorsa cevabin cogunu o kategoriye ayir.
- Kullanici "hangi harcamayi/gideri once kismaliyim" gibi oncelik sorarsa summary su yapida olsun: "Once X kategorisine odaklanin. Cunku ... . Bu hafta 1) ... 2) ... 3) ...". Tek cumlelik cevap verme.
- Oncelik sorularinda ilk cümle doğrudan en kritik kategoriye işaret etsin; sonucu uzatmadan, karar verdiren bir giriş yap.
- Market sorusunda arac hedefi, borc veya ilgisiz hedef tavsiyesine kayma.
- Summary 3-5 cumle, diagnosis.explanation 4-7 cumle olsun ve birbirini tekrar etmesin.
- En az 3 insight, 4 recommendation ve 3 action item uret.
- Veride olmayan tutar, oran, kategori limiti veya kullanici davranisi uydurma.
- Oneriler somut olsun: haftalik sepet limiti, alisveris listesi, birim fiyat kontrolu, yemek plani, gereksiz urunleri eleme, kategori takibi gibi adimlar kullan.
- Action item'lar bu hafta uygulanabilir, kucuk ve olculebilir olsun.
- Genel tavsiye yasak: podcast dinle, kitap oku, finansal okuryazarlik arastir gibi uygulama verisine bagli olmayan maddeler yazma.
- Her recommendation ve action item farklı bir açıdan değer katsın; aynı fikri başka kelimelerle tekrarlama.
${isCuttingQuestion ? "- Bu cevap kisa ama dolu olmali: oncelik, neden, 3 somut adim ve beklenen etki mutlaka olsun." : ""}`;
  return { prompt, systemPrompt };
}

export async function SpendingAnalysisAgent(input: AgentInput): Promise<AIResponse> {
  const { prompt, systemPrompt } = buildSpendingAnalysisPrompt(input);
  const rawJson = await generateAIJSON<unknown>(prompt, systemPrompt);
  return parseAndValidateResponse(rawJson);
}

// ============================================================
// INCOME ANALYSIS AGENT
// ============================================================
export function buildIncomeAnalysisPrompt(input: IncomeAnalysisContext): { prompt: string; systemPrompt: string } {
  const prompt = `${getCurrentDateContext()}
KULLANICININ GELİR VERİLERİ (${input.currentMonth}/${input.currentYear}):

- Aylık Toplam Gelir: ${input.monthlyIncome.toFixed(0)} ${input.currency}
- Düzenli Gelir: ${input.recurringIncome.toFixed(0)} ${input.currency}
- Tek Seferlik Gelir: ${input.oneTimeIncome.toFixed(0)} ${input.currency}
- Ortalama Aylık Gelir: ${input.averageMonthlyIncome.toFixed(0)} ${input.currency}
- Aylık Büyüme Oranı: %${input.monthlyGrowthRate.toFixed(1)}
- En Büyük Gelir Kaynağı Payı: %${input.topIncomeSources[0]?.percent.toFixed(1) ?? "0.0"}

Gelir Kaynakları:
${input.topIncomeSources.map((source) => `- ${source.name}: ${source.amount.toFixed(0)} ${input.currency} (%${source.percent.toFixed(1)})`).join("\n") || "- Veri yok"}

Kategori Dağılımı:
${input.incomeByCategory.map((cat) => `- ${cat.name}: ${cat.amount.toFixed(0)} ${input.currency} (%${cat.percent.toFixed(1)})`).join("\n") || "- Veri yok"}

Son Gelir Kayıtları:
${input.recentIncomeEntries.map((entry) => `- ${entry.date}: ${entry.title} / ${entry.category} / ${entry.frequency} / ${entry.amount.toFixed(0)} ${input.currency}`).join("\n") || "- Veri yok"}

Bu gelir verilerine dayanarak profesyonel bir gelir analizi üret. JSON formatında yanıt ver:
{
  "summary": "kısa özet",
  "diagnosis": {
    "status": "good|warning|risk",
    "mainIssue": "en önemli gözlem",
    "explanation": "detaylı açıklama"
  },
  "insights": [
    {"title": "...", "description": "...", "severity": "low|medium|high"}
  ],
  "recommendations": [
    {"title": "...", "action": "...", "estimatedImpact": "...", "difficulty": "easy|medium|hard"}
  ],
  "numbers": {
    "monthlyIncome": sayı,
    "recurringIncome": sayı,
    "oneTimeIncome": sayı,
    "averageMonthlyIncome": sayı,
    "monthlyGrowthRate": sayı,
    "topIncomeShare": sayı
  },
  "actionItems": [
    {"title": "...", "description": "...", "dueInDays": sayı, "priority": "low|medium|high"}
  ],
  "chart": {
    "type": "bar",
    "title": "Gelir Kaynakları",
    "unit": "₺",
    "data": [
      {"label": "Kaynak", "value": sayı}
    ]
  },
  "followUps": ["...", "...", "..."],
  "disclaimer": "${DISCLAIMER}"
}`;

  const systemPrompt = `${INCOME_ANALYSIS_PROMPT}

KALITE BEKLENTISI:
- Cevap ayni sablon cumleleri tekrarlamasin; gelir istikrari, kaynak cesitliligi, tek kaynaga bagimlilik ve duzenli/tek seferlik gelir dengesini ayri ayri yorumla.
- En az 3 insight, 4 recommendation ve 3 action item uret.
- Veride olmayan gelir kaynagi, tutar veya artis orani uydurma.
- Kullaniciya uygulanabilir, profesyonel ve olculebilir oneriler ver.`;
  return { prompt, systemPrompt };
}

export async function IncomeAnalysisAgent(input: IncomeAnalysisContext): Promise<IncomeAnalysisOutput> {
  const { prompt, systemPrompt } = buildIncomeAnalysisPrompt(input);
  try {
    const rawJson = await generateAIJSON<unknown>(prompt, systemPrompt);
    const parsed = IncomeAnalysisOutputSchema.safeParse(rawJson);
    if (parsed.success) return parsed.data;
  } catch {
    // fall through to deterministic fallback
  }

  return buildDeterministicIncomeAnalysisFallback(input);
}

// ============================================================
// BUDGET PLANNER AGENT
// ============================================================
export async function BudgetPlannerAgent(input: AgentInput): Promise<BudgetPlanOutput> {
  const contextStr = buildContextString(input.financialData);
  const { monthlyIncome, currency } = input.financialData;

  const prompt = `${contextStr}

Kullanıcının ${monthlyIncome.toFixed(0)} ${currency} aylık geliri için kişiselleştirilmiş bütçe planı oluştur.

JSON formatında yanıt ver:
{
  "summary": "bütçe planı özeti",
  "totalPlannedExpense": sayı,
  "plannedSaving": sayı,
  "categories": [
    {
      "categoryId": "kira",
      "categoryName": "Kira",
      "plannedAmount": sayı,
      "reasoning": "neden bu limit?"
    }
  ],
  "tips": ["ipucu 1", "ipucu 2"]
}`;

  const rawJson = await generateAIJSON<unknown>(prompt, BUDGET_PLANNER_PROMPT);
  const parsed = BudgetPlanOutputSchema.safeParse(rawJson);
  if (parsed.success) return parsed.data;
  throw new Error("Butce plani dogrulanamadi.");

}

// ============================================================
// GOAL PLANNER AGENT
// ============================================================
export function buildGoalPlannerPrompt(input: AgentInput, goalId?: string): { prompt: string; systemPrompt: string } {
  const contextStr = buildContextString(input.financialData);
  const targetGoal = goalId
    ? input.financialData.goals.find((g) => g.id === goalId)
    : input.financialData.goals[0];

  const goalContext = targetGoal
    ? `Analiz edilecek hedef: ${targetGoal.title} - Hedef: ${targetGoal.targetAmount} ${input.financialData.currency}, Mevcut: ${targetGoal.currentAmount} ${input.financialData.currency}`
    : "Tüm aktif hedefler";

  const prompt = `${contextStr}

${goalContext}

Net aylık nakit akışı: ${input.financialData.netCashflow.toFixed(0)} ${input.financialData.currency}

Bu hedefin fizibilite analizini yap. JSON formatında yanıt ver:
{
  "summary": "özet",
  "diagnosis": {"status": "good|warning|risk", "mainIssue": "...", "explanation": "..."},
  "insights": [{"title": "...", "description": "...", "severity": "low|medium|high"}],
  "recommendations": [{"title": "...", "action": "...", "estimatedImpact": "...", "difficulty": "easy|medium|hard"}],
  "numbers": {"monthlyIncome": sayı, "requiredSavingForGoal": sayı},
  "actionItems": [{"title": "...", "description": "...", "dueInDays": sayı, "priority": "low|medium|high"}],
  "disclaimer": "${DISCLAIMER}"
}`;
  return { prompt, systemPrompt: GOAL_PLANNER_PROMPT };
}

export async function GoalPlannerAgent(
  input: AgentInput,
  goalId?: string
): Promise<AIResponse> {
  const { prompt, systemPrompt } = buildGoalPlannerPrompt(input, goalId);
  const rawJson = await generateAIJSON<unknown>(prompt, systemPrompt);
  return parseAndValidateResponse(rawJson);
}

// ============================================================
// DEBT RISK AGENT
// ============================================================
export function buildDebtRiskPrompt(input: AgentInput): { prompt: string; systemPrompt: string } {
  const contextStr = buildContextString(input.financialData);
  const prompt = `${contextStr}

Kullanıcının borç durumunu analiz et. Çığ ve kartopu yöntemlerini karşılaştır ve hangisinin daha uygun olduğunu öner.

JSON formatında yanıt ver:
{
  "summary": "özet",
  "diagnosis": {"status": "good|warning|risk", "mainIssue": "...", "explanation": "..."},
  "insights": [{"title": "...", "description": "...", "severity": "low|medium|high"}],
  "recommendations": [{"title": "...", "action": "...", "estimatedImpact": "...", "difficulty": "easy|medium|hard"}],
  "numbers": {"monthlyIncome": sayı, "debtLoadRatio": sayı},
  "actionItems": [{"title": "...", "description": "...", "dueInDays": sayı, "priority": "low|medium|high"}],
  "disclaimer": "${DISCLAIMER}"
}`;
  return { prompt, systemPrompt: DEBT_RISK_PROMPT };
}

export async function DebtRiskAgent(input: AgentInput): Promise<AIResponse> {
  const { prompt, systemPrompt } = buildDebtRiskPrompt(input);
  const rawJson = await generateAIJSON<unknown>(prompt, systemPrompt);
  return parseAndValidateResponse(rawJson);
}

// ============================================================
// SUBSCRIPTION WASTE AGENT
// ============================================================
export function buildSubscriptionWastePrompt(input: AgentInput): { prompt: string; systemPrompt: string } {
  const contextStr = buildContextString(input.financialData);
  const prompt = `${contextStr}

Kullanıcının aboneliklerini analiz et. Gereksiz veya pahalı olanları tespit et.

JSON formatında yanıt ver:
{
  "summary": "özet",
  "diagnosis": {"status": "good|warning|risk", "mainIssue": "...", "explanation": "..."},
  "insights": [{"title": "...", "description": "...", "severity": "low|medium|high"}],
  "recommendations": [{"title": "...", "action": "...", "estimatedImpact": "...", "difficulty": "easy|medium|hard"}],
  "numbers": {"monthlyExpense": sayı, "estimatedSaving": sayı},
  "actionItems": [{"title": "...", "description": "...", "dueInDays": sayı, "priority": "low|medium|high"}],
  "disclaimer": "${DISCLAIMER}"
}`;
  return { prompt, systemPrompt: SUBSCRIPTION_WASTE_PROMPT };
}

export async function SubscriptionWasteAgent(input: AgentInput): Promise<AIResponse> {
  const { prompt, systemPrompt } = buildSubscriptionWastePrompt(input);
  const rawJson = await generateAIJSON<unknown>(prompt, systemPrompt);
  return parseAndValidateResponse(rawJson);
}

// ============================================================
// FINANCIAL HEALTH AGENT
// ============================================================
export function buildFinancialHealthPrompt(
  input: AgentInput,
  scoreBreakdown: {
    score: number;
    incomeExpenseRatio: number;
    savingRate: number;
    debtLoad: number;
    spendingDiscipline: number;
    goalProgress: number;
  }
): { prompt: string; systemPrompt: string } {
  const contextStr = buildContextString(input.financialData);
  const prompt = `${contextStr}

FİNANSAL SAĞLIK SKORU DETAYLARI:
- Toplam Skor: ${scoreBreakdown.score}/100
- Gelir-Gider Dengesi: ${scoreBreakdown.incomeExpenseRatio}/25
- Tasarruf Oranı: ${scoreBreakdown.savingRate}/20
- Borç Kontrolü: ${scoreBreakdown.debtLoad}/20
- Harcama Disiplini: ${scoreBreakdown.spendingDiscipline}/20
- Hedef İlerlemesi: ${scoreBreakdown.goalProgress}/15

Her bileşeni detaylıca açıkla ve iyileştirme yol haritası sun.

JSON formatında yanıt ver:
{
  "summary": "özet",
  "diagnosis": {"status": "good|warning|risk", "mainIssue": "...", "explanation": "..."},
  "insights": [{"title": "...", "description": "...", "severity": "low|medium|high"}],
  "recommendations": [{"title": "...", "action": "...", "estimatedImpact": "...", "difficulty": "easy|medium|hard"}],
  "numbers": {"financialHealthScore": sayı},
  "actionItems": [{"title": "...", "description": "...", "dueInDays": sayı, "priority": "low|medium|high"}],
  "chart": {
    "type": "bar",
    "title": "Finansal Sağlık Bileşenleri",
    "unit": "puan",
    "data": [
      {"label": "Gelir-Gider", "value": ${scoreBreakdown.incomeExpenseRatio}},
      {"label": "Tasarruf", "value": ${scoreBreakdown.savingRate}},
      {"label": "Borç Kontrolü", "value": ${scoreBreakdown.debtLoad}},
      {"label": "Harcama", "value": ${scoreBreakdown.spendingDiscipline}},
      {"label": "Hedefler", "value": ${scoreBreakdown.goalProgress}}
    ]
  },
  "followUps": ["takip sorusu 1", "takip sorusu 2", "takip sorusu 3"],
  "disclaimer": "${DISCLAIMER}"
}

followUps alanında sağlık skorunu iyileştirmeye yönelik 3 Türkçe takip sorusu üret.`;
  return { prompt, systemPrompt: FINANCIAL_HEALTH_PROMPT };
}

export async function FinancialHealthAgent(
  input: AgentInput,
  scoreBreakdown: {
    score: number;
    incomeExpenseRatio: number;
    savingRate: number;
    debtLoad: number;
    spendingDiscipline: number;
    goalProgress: number;
  }
): Promise<AIResponse> {
  const { prompt, systemPrompt } = buildFinancialHealthPrompt(input, scoreBreakdown);
  try {
    const rawJson = await generateAIJSON<unknown>(prompt, systemPrompt);
    const parsed = AIResponseSchema.safeParse(rawJson);
    if (parsed.success) return parsed.data;
  } catch {
    // fall through to deterministic fallback
  }

  return buildFinancialHealthFallbackResponse(input, scoreBreakdown);
}

// ============================================================
// ACTION PLAN AGENT
// ============================================================
export function buildActionPlanPrompt(input: AgentInput): { prompt: string; systemPrompt: string } {
  const contextStr = buildContextString(input.financialData);
  const requestedCount = extractRequestedItemCount(input.userMessage) ?? 3;
  const prompt = `${contextStr}

KULLANICI SORUSU: ${input.userMessage ?? "Bu hafta ne yapmalıyım?"}

Tam olarak ${requestedCount} görev üret. Daha fazla veya daha az üretme.

Bu haftaya özel, somut ve uygulanabilir finansal aksiyon planı oluştur.

JSON formatında yanıt ver:
{
  "title": "Bu Haftanın Finansal Aksiyon Planı",
  "summary": "kısa özet",
  "items": [
    {
      "title": "görev başlığı",
      "description": "ne yapılacak",
      "category": "kategori",
      "priority": "HIGH|MEDIUM|LOW",
      "dueInDays": sayı
    }
  ]
}`;
  const systemPrompt = `${ACTION_PLAN_PROMPT}

KALITE BEKLENTISI:
- Kullanici kac madde istediyse tam o sayida items uret.
- Her item kayitli finans verisine bagli olsun: kategori, tutar, hedef, gider veya abonelik referansi icerir.
- Genel tavsiye yasak: podcast dinle, kitap oku, finansal okuryazarlik arastir, arastirma yap gibi belirsiz gorevler yazma.
- Her gorev bu hafta yapilabilir, olculebilir ve net fiille baslasin.
- Eger kullanici "3 maddelik" dediyse items dizisi kesinlikle 3 elemanli olsun.
- Summary en fazla iki cumle olsun; neden bu görevlerin seçildiğini profesyonel ama kısa bir dille anlat.
- Kullanıcının aktif hedefi yoksa yeni hedef uydurma; mevcut gelir-gider dengesi, abonelikler ve borçlar üzerinden plan üret.
- Görevler birbirinin tekrarı olmasın; her biri farklı bir davranış değişikliği, kontrol adımı veya otomasyon içersin.
- İsimler kısa, açıklamalar ise ölçülebilir ve uygulamaya dönük olsun.`;
  return { prompt, systemPrompt };
}

export function buildDeterministicActionPlanFallback(input: AgentInput): ActionPlanOutput {
  const { financialData } = input;
  const requestedCount = extractRequestedItemCount(input.userMessage) ?? 3;
  const topCategory = financialData.topExpenseCategories[0];
  const subscriptions = [...financialData.subscriptions].sort((a, b) => b.monthlyAmount - a.monthlyAmount);
  const highestSubscription = subscriptions[0];
  const topGoal = financialData.goals[0];
  const topDebt = financialData.debts[0];
  const monthlyIncome = financialData.monthlyIncome;
  const monthlyExpenses = financialData.monthlyExpenses;
  const netCashflow = financialData.netCashflow;
  const currency = financialData.currency;
  const recurringLoad = financialData.subscriptions.reduce((sum, item) => sum + item.monthlyAmount, 0);
  const debtPayments = financialData.debts.reduce((sum, item) => sum + item.minimumPayment, 0);

  const candidates: ActionPlanOutput["items"] = [];

  if (topCategory) {
    candidates.push({
      title: `${topCategory.categoryName} harcamasını haftalık limite bağla`,
      description: `${topCategory.categoryName} kategorisi bu ay ${formatMoneyForAI(topCategory.amount, currency)} seviyesinde. Bu hafta için günlük takip aç, liste ile harcama yap ve tek seferde kontrol et.`,
      category: topCategory.categoryName,
      priority: "HIGH",
      dueInDays: 2,
    });
  }

  if (highestSubscription) {
    candidates.push({
      title: "Abonelikleri tek tek gözden geçir",
      description: `${highestSubscription.title} dahil toplam abonelik yükün yaklaşık ${formatMoneyForAI(recurringLoad, currency)}. Kullanmadığın hizmetleri kapat veya aylık maliyeti düşür.`,
      category: "Abonelikler",
      priority: "HIGH",
      dueInDays: 3,
    });
  } else if (topDebt) {
    candidates.push({
      title: "Borç ödeme takibini netleştir",
      description: `${topDebt.title} için minimum ödeme ${formatMoneyForAI(topDebt.minimumPayment, currency)}. Bu hafta ödeme gününü, toplam yükü ve hızlandırma fırsatını tek tabloda netleştir.`,
      category: "Borçlar",
      priority: "HIGH",
      dueInDays: 3,
    });
  } else {
    candidates.push({
      title: "Otomatik birikim planı kur",
      description: `Net nakit akışın ${formatMoneyForAI(netCashflow, currency)}. Maaş gününde küçük ama düzenli bir otomatik transfer belirleyerek tasarruf disiplinini güçlendir.`,
      category: "Tasarruf",
      priority: "HIGH",
      dueInDays: 2,
    });
  }

  if (topGoal) {
    candidates.push({
      title: `${topGoal.title} için haftalık katkı ayarla`,
      description: `Hedefin ${formatMoneyForAI(topGoal.targetAmount, currency)} ve mevcut ilerlemen ${formatMoneyForAI(topGoal.currentAmount, currency)}. Bu hafta hedefe gidecek sabit bir katkı belirle ve ilerlemeyi haftalık izle.`,
      category: "Hedefler",
      priority: "MEDIUM",
      dueInDays: 4,
    });
  } else {
    candidates.push({
      title: "Haftalık nakit akışını kaydet",
      description: `Aylık gelir ${formatMoneyForAI(monthlyIncome, currency)} ve gider ${formatMoneyForAI(monthlyExpenses, currency)}. 7 gün boyunca günlük kayıt tutarak en büyük sapmaları görünür hale getir.`,
      category: "Takip",
      priority: "MEDIUM",
      dueInDays: 1,
    });
  }

  candidates.push({
    title: "Bu hafta için harcama kontrol listesi oluştur",
    description: "Market, ulaşım ve küçük harcamalar için kısa bir kontrol listesi hazırlayıp her alışverişten önce listeden geç.",
    category: "Kontrol",
    priority: "MEDIUM",
    dueInDays: 1,
  });

  candidates.push({
    title: "Giderleri ödeme günlerine göre grupla",
    description: "Tekrarlayan ödemeleri tek bir takvimde toplayarak gecikme riskini ve plansız harcamayı azalt.",
    category: "Planlama",
    priority: "LOW",
    dueInDays: 5,
  });

  candidates.push({
    title: "İkinci bir tasarruf tamponu belirle",
    description: "Kısa vadeli beklenmedik masraflar için küçük bir tampon hedefi belirle ve bunu otomatik birikime bağla.",
    category: "Tasarruf",
    priority: "LOW",
    dueInDays: 6,
  });

  candidates.push({
    title: "Ödeme tarihlerini tek takvime taşı",
    description: "Kira, abonelik ve kredi ödemelerini aynı yerde toplayıp haftalık kontrol et; gecikme ve unutma riskini azalt.",
    category: "Takvim",
    priority: "LOW",
    dueInDays: 4,
  });

  candidates.push({
    title: "Bu hafta küçük harcama tavanı belirle",
    description: "Plansız küçük harcamalar için net bir üst limit koy ve harcama öncesi bu limite uyup uymadığını kontrol et.",
    category: "Disiplin",
    priority: "LOW",
    dueInDays: 1,
  });

  const items = candidates.slice(0, Math.max(1, requestedCount));

  return {
    title: "Bu Haftanın Finansal Aksiyon Planı",
    summary: financialData.netCashflow >= 0
      ? `Bu hafta öncelik, en yüksek harcama alanını kontrol altına almak ve tekrar eden giderleri azaltmak olmalı. Pozitif nakit akışı varsa küçük ama düzenli birikim adımı eklemek planın etkisini artırır.`
      : `Bu hafta öncelik, nakit akışındaki baskıyı azaltmak ve en büyük gider alanını sıkı takip altına almak olmalı. Tekrarlayan harcamalar ve borç yükü varsa bunları aynı haftada görünür hale getirip sadeleştirmek gerekir.`,
    items,
  };
}

function buildDeterministicReportFallback(
  input: AgentInput,
  reportType: "WEEKLY" | "MONTHLY",
  periodData: {
    totalIncome: number;
    totalExpenses: number;
    netCashflow: number;
    savingRate: number;
    topCategories: Array<{ name: string; amount: number; percent: number }>;
  }
): ReportOutput {
  const currency = input.financialData.currency || "TRY";
  const periodLabel = reportType === "WEEKLY" ? "Haftalik" : "Aylik";
  const topCategory = periodData.topCategories[0];
  const savingText = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(periodData.savingRate);

  return {
    title: `${periodLabel} Finansal Rapor`,
    summary:
      periodData.totalIncome > 0
        ? `${periodLabel.toLowerCase()} donemde gelir ${formatMoneyForAI(periodData.totalIncome, currency)}, gider ${formatMoneyForAI(periodData.totalExpenses, currency)} ve net nakit akisi ${formatMoneyForAI(periodData.netCashflow, currency)} olarak gorunuyor. Tasarruf orani %${savingText}; en yuksek baski ${topCategory ? topCategory.name : "harcama dagilimi"} tarafinda.`
        : `${periodLabel.toLowerCase()} donem icin yeterli gelir kaydi bulunmadigi icin rapor, mevcut gider dagilimina gore olusturuldu. Duzenli gelir ve gider kaydi, sonraki raporlarin dogrulugunu artirir.`,
    highlights: [
      periodData.totalIncome > 0
        ? `Toplam gelir ${formatMoneyForAI(periodData.totalIncome, currency)} seviyesinde.`
        : "Kaydedilmis gelir verisi bulunmuyor.",
      periodData.totalExpenses > 0
        ? `Toplam gider ${formatMoneyForAI(periodData.totalExpenses, currency)} seviyesinde.`
        : "Kaydedilmis gider verisi bulunmuyor.",
      `Net nakit akisi ${periodData.netCashflow >= 0 ? "pozitif" : "negatif"} durumda.`,
    ],
    keyInsights: [
      {
        title: "Nakit akisi durumu",
        description:
          periodData.netCashflow >= 0
            ? "Bu donem net nakit akisi pozitif. Bu, hedef katkisi ve tampon birikim icin alan olusturuyor."
            : "Bu donem net nakit akisi negatif. Oncelik giderleri gelir seviyesine yaklastirmak olmali.",
        severity: periodData.netCashflow >= 0 ? "low" : "high",
      },
      {
        title: "Tasarruf orani",
        description:
          periodData.savingRate >= 20
            ? "Tasarruf orani guclu seviyede ve butce disiplini iyi gorunuyor."
            : periodData.savingRate >= 10
              ? "Tasarruf orani orta seviyede. Kucuk optimizasyonlarla hizli iyilesme mumkun."
              : "Tasarruf orani dusuk. Harcama kontrolu ve otomatik birikim plani gerekli.",
        severity: periodData.savingRate >= 20 ? "low" : periodData.savingRate >= 10 ? "medium" : "high",
      },
      {
        title: "En yuksek gider alani",
        description: topCategory
          ? `${topCategory.name} kategorisi toplam giderlerin yaklasik %${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(topCategory.percent)} kismini olusturuyor.`
          : "Kategori bazli gider verisi yetersiz.",
        severity: topCategory && topCategory.percent >= 40 ? "high" : "medium",
      },
    ],
    recommendations: [
      {
        title: "En buyuk gideri haftalik takip et",
        action: topCategory
          ? `${topCategory.name} kategorisi icin haftalik ust limit belirle ve her harcamayi listeden gec.`
          : "En buyuk gider kategorisini tespit et ve haftalik limit belirle.",
        estimatedImpact: "Nakit akisi daha kontrollu olur.",
        difficulty: "easy",
      },
      {
        title: "Otomatik birikim baslat",
        action:
          periodData.netCashflow > 0
            ? "Pozitif nakit akisinin kucuk bir kismini maas gununde otomatik birikime aktar."
            : "Once kucuk bir tampon hesap olustur, sonra otomatik birikime gec.",
        estimatedImpact: "Tasarruf disiplini artar.",
        difficulty: "medium",
      },
      {
        title: "Duzenli kayit disiplinini koru",
        action: "Gelir ve gider kayitlarini kategori bazinda temiz tut; rapor kalitesi dogrudan artar.",
        estimatedImpact: "Gelecek raporlar daha guvenilir olur.",
        difficulty: "easy",
      },
    ],
    nextPeriodGoals: [
      periodData.netCashflow >= 0 ? "Net nakit akisini pozitif tut" : "Giderleri gelir seviyesine yaklastir",
      "En buyuk harcama kategorisinde kontrol noktasi olustur",
      "Tasarruf oranini bir ust seviyeye tasi",
    ],
    disclaimer: DISCLAIMER,
  };
}
function parseJsonSafely<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function repairBrokenJsonText(raw: string): string {
  const cleaned = cleanJSONText(raw);
  const start = cleaned.search(/[\[{]/);
  if (start === -1) return cleaned;

  const source = cleaned.slice(start);
  const stack: Array<"{" | "["> = [];
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === "\"") {
      if (!inString) {
        inString = true;
        result += ch;
        continue;
      }

      const rest = source.slice(i + 1);
      const nextNonSpace = rest.match(/\S/);
      const next = nextNonSpace?.[0];
      const closesString = next === undefined || [",", "}", "]", ":"].includes(next);
      if (closesString) {
        inString = false;
        result += ch;
      } else {
        result += "\\\"";
      }
      continue;
    }

    if (!inString) {
      if (ch === "{" || ch === "[") stack.push(ch);
      if (ch === "}" || ch === "]") stack.pop();
    }

    result += ch;
  }

  if (inString) result += "\"";
  for (let i = stack.length - 1; i >= 0; i--) {
    result += stack[i] === "{" ? "}" : "]";
  }

  return result.replace(/,\s*([}\]])/g, "$1");
}

function parseActionPlanOutput(text: string): ActionPlanOutput | null {
  const candidates = [cleanJSONText(text), repairBrokenJsonText(text)];
  for (const candidate of candidates) {
    const parsed = parseJsonSafely<unknown>(candidate);
    if (!parsed) continue;
    const validated = ActionPlanOutputSchema.safeParse(parsed);
    if (validated.success) return validated.data;
  }
  return null;
}

export async function ActionPlanAgent(input: AgentInput): Promise<ActionPlanOutput> {
  const { prompt, systemPrompt } = buildActionPlanPrompt(input);
  try {
    const response = await generateAIResponse(
      [{ role: "user", content: prompt }],
      { systemPrompt: `${systemPrompt}\n\nYALNIZCA geçerli JSON ver.` , responseMimeType: "application/json" }
    );
    const parsed = parseActionPlanOutput(response.text);
    if (parsed) return parsed;
  } catch {
    // fall through to deterministic fallback
  }

  return buildDeterministicActionPlanFallback(input);
}

// ============================================================
// REPORT AGENT
// ============================================================
export async function ReportAgent(
  input: AgentInput,
  reportType: "WEEKLY" | "MONTHLY",
  periodData: {
    totalIncome: number;
    totalExpenses: number;
    netCashflow: number;
    savingRate: number;
    topCategories: Array<{ name: string; amount: number; percent: number }>;
  }
): Promise<ReportOutput> {
  const contextStr = buildContextString(input.financialData);
  const period = reportType === "WEEKLY" ? "haftalık" : "aylık";

  const prompt = `${contextStr}

DÖNEM RAPORU (${period.toUpperCase()}):
- Toplam Gelir: ${periodData.totalIncome.toFixed(0)} ${input.financialData.currency}
- Toplam Gider: ${periodData.totalExpenses.toFixed(0)} ${input.financialData.currency}
- Net Kalan: ${periodData.netCashflow.toFixed(0)} ${input.financialData.currency}
- Tasarruf Oranı: %${periodData.savingRate.toFixed(1)}
- En Yüksek Kategoriler: ${periodData.topCategories.map((c) => `${c.name} (${c.amount.toFixed(0)} TL, %${c.percent.toFixed(0)})`).join(", ")}

Bu dönem için kapsamlı ${period} raporu oluştur.

JSON formatında yanıt ver:
{
  "title": "rapor başlığı",
  "summary": "dönem özeti",
  "highlights": ["öne çıkan 1", "öne çıkan 2"],
  "keyInsights": [{"title": "...", "description": "...", "severity": "low|medium|high"}],
  "recommendations": [{"title": "...", "action": "...", "difficulty": "easy|medium|hard"}],
  "nextPeriodGoals": ["hedef 1", "hedef 2"],
  "disclaimer": "${DISCLAIMER}"
}`;

    try {
    const rawJson = await generateAIJSON<unknown>(prompt, REPORT_PROMPT);
    const parsed = ReportOutputSchema.safeParse(rawJson);
    if (parsed.success) return parsed.data;
  } catch {
    // fall through to deterministic fallback
  }

  return buildDeterministicReportFallback(input, reportType, periodData);
}

// ============================================================
// EXPLANATION AGENT
// ============================================================
export function buildExplanationPrompt(userMessage: string, context?: string): { prompt: string; systemPrompt: string } {
  const prompt = `${context ? `KULLANICI BAĞLAMI:\n${context}\n\n` : ""}KULLANICI SORUSU: ${userMessage}

Bu finansal kavramı/soruyu sade Türkçe ile açıkla.

JSON formatında yanıt ver:
{
  "summary": "kısa özet cevap",
  "diagnosis": {"status": "good", "mainIssue": "kavram açıklaması", "explanation": "detaylı açıklama"},
  "insights": [{"title": "...", "description": "...", "severity": "low"}],
  "recommendations": [{"title": "...", "action": "...", "difficulty": "easy"}],
  "numbers": {},
  "actionItems": [],
  "disclaimer": "${DISCLAIMER}"
}`;
  return { prompt, systemPrompt: EXPLANATION_PROMPT };
}

export async function ExplanationAgent(
  userMessage: string,
  context?: string
): Promise<AIResponse> {
  const { prompt, systemPrompt } = buildExplanationPrompt(userMessage, context);
  const rawJson = await generateAIJSON<unknown>(prompt, systemPrompt);
  return parseAndValidateResponse(rawJson);
}
