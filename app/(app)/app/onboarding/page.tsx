"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  CreditCard,
  Target,
  Shield,
  Bell,
  Repeat,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/ui/filter-select";
import { cn } from "@/lib/utils";
import { DatePickerField } from "@/components/ui/date-picker";
import { OwlIcon } from "@/components/brand/owl-icon";

/* ─── types ─────────────────────────────────────────────────────────── */
type Currency = "TRY" | "USD" | "EUR";
type DebtType = "CREDIT_CARD" | "LOAN" | "MORTGAGE" | "NONE";
type GoalType =
  | "EMERGENCY_FUND"
  | "HOME"
  | "CAR"
  | "RETIREMENT"
  | "PAY_OFF_DEBT"
  | "TRAVEL"
  | "EDUCATION";
type RiskTolerance = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";

interface ExpenseEntry {
  key: string;
  label: string;
  amount: string;
}

interface IncomeSourceEntry {
  title: string;
  amount: string;
  category: string;
  frequency: "MONTHLY" | "WEEKLY" | "YEARLY" | "ONE_TIME";
}

interface DebtDetailEntry {
  title: string;
  type: "CREDIT_CARD" | "LOAN" | "MORTGAGE" | "OTHER";
  totalAmount: string;
  remainingAmount: string;
  minimumPayment: string;
  interestRate: string;
  dueDay: string;
}

interface SubscriptionEntry {
  title: string;
  amount: string;
  billingCycle: "MONTHLY" | "YEARLY";
  nextBillingDay: string;
  category: string;
}

interface OnboardingData {
  city: string;
  occupation: string;
  incomeFrequency: "MONTHLY" | "WEEKLY" | "YEARLY" | "ONE_TIME";
  monthlyIncome: string;
  currency: Currency;
  incomeSources: IncomeSourceEntry[];
  expenses: ExpenseEntry[];
  budgetLimits: ExpenseEntry[];
  debts: DebtType[];
  debtDetails: DebtDetailEntry[];
  subscriptions: SubscriptionEntry[];
  goal: GoalType | "";
  goalTarget: string;
  goalCurrent: string;
  goalDeadline: string;
  goalPriority: "HIGH" | "MEDIUM" | "LOW";
  riskTolerance: RiskTolerance | "";
  notifications: {
    budgetAlerts: boolean;
    weeklyReport: boolean;
    aiSuggestions: boolean;
    monthlyReview: boolean;
  };
}

/* ─── step definitions ──────────────────────────────────────────────── */
const STEP_COUNT = 7;

const STEPS = [
  { title: "Gelir", icon: <DollarSign className="h-5 w-5" /> },
  { title: "Giderler", icon: <ShoppingCart className="h-5 w-5" /> },
  { title: "Borç", icon: <CreditCard className="h-5 w-5" /> },
  { title: "Hedef", icon: <Target className="h-5 w-5" /> },
  { title: "Abonelik", icon: <Repeat className="h-5 w-5" /> },
  { title: "Tercihler", icon: <Shield className="h-5 w-5" /> },
  { title: "Son", icon: <Bell className="h-5 w-5" /> },
];

/* ─── expense categories ─────────────────────────────────────────────── */
const EXPENSE_KEYS: { key: string; label: string }[] = [
  { key: "rent", label: "Kira / Konut" },
  { key: "bills", label: "Faturalar" },
  { key: "groceries", label: "Market" },
  { key: "transport", label: "Ulaşım" },
];

/* ─── goal options ───────────────────────────────────────────────────── */
const DEFAULT_INCOME_SOURCES: IncomeSourceEntry[] = [
  { title: "Maaş", amount: "", category: "Maaş", frequency: "MONTHLY" },
  { title: "Ek gelir", amount: "", category: "Ek gelir", frequency: "MONTHLY" },
];

const DEFAULT_SUBSCRIPTIONS: SubscriptionEntry[] = [
  { title: "Netflix", amount: "", billingCycle: "MONTHLY", nextBillingDay: "1", category: "Eğlence" },
  { title: "Spotify", amount: "", billingCycle: "MONTHLY", nextBillingDay: "1", category: "Eğlence" },
  { title: "YouTube Premium", amount: "", billingCycle: "MONTHLY", nextBillingDay: "1", category: "Eğlence" },
  { title: "iCloud / Google One", amount: "", billingCycle: "MONTHLY", nextBillingDay: "1", category: "Bulut" },
];

const DEBT_DETAIL_TEMPLATES: DebtDetailEntry[] = [
  { title: "Kredi kartı", type: "CREDIT_CARD", totalAmount: "", remainingAmount: "", minimumPayment: "", interestRate: "", dueDay: "" },
  { title: "Kredi", type: "LOAN", totalAmount: "", remainingAmount: "", minimumPayment: "", interestRate: "", dueDay: "" },
  { title: "Konut kredisi", type: "MORTGAGE", totalAmount: "", remainingAmount: "", minimumPayment: "", interestRate: "", dueDay: "" },
];

const GOALS: {
  value: GoalType;
  label: string;
  emoji: string;
  desc: string;
}[] = [
  {
    value: "EMERGENCY_FUND",
    label: "Acil durum fonu",
    emoji: "🛡️",
    desc: "3–6 aylık gider tamponu",
  },
  {
    value: "HOME",
    label: "Ev almak",
    emoji: "🏠",
    desc: "Konut alımı veya peşinat",
  },
  {
    value: "CAR",
    label: "Araç almak",
    emoji: "🚗",
    desc: "Yeni veya ikinci el araç",
  },
  {
    value: "RETIREMENT",
    label: "Emeklilik",
    emoji: "🌴",
    desc: "Uzun vadeli birikim planı",
  },
  {
    value: "PAY_OFF_DEBT",
    label: "Borç kapatma",
    emoji: "💳",
    desc: "Mevcut borçları temizle",
  },
  {
    value: "TRAVEL",
    label: "Seyahat",
    emoji: "✈️",
    desc: "Hayalindeki tatil",
  },
  {
    value: "EDUCATION",
    label: "Eğitim",
    emoji: "🎓",
    desc: "Kurs, okul veya sertifika",
  },
];

/* ─── risk options ───────────────────────────────────────────────────── */
const RISKS: {
  value: RiskTolerance;
  label: string;
  desc: string;
  color: string;
  badge: string;
}[] = [
  {
    value: "CONSERVATIVE",
    label: "Muhafazakâr",
    desc: "Düşük risk, düşük getiri. Birikimlerimi korumak istiyorum, kayıp istemiyorum.",
    color: "border-blue-300 bg-blue-50",
    badge: "Güvenli",
  },
  {
    value: "BALANCED",
    label: "Dengeli",
    desc: "Orta risk, orta getiri. Hem büyüme hem de koruma istiyorum.",
    color: "border-accent/50 bg-green-50",
    badge: "Önerilen",
  },
  {
    value: "AGGRESSIVE",
    label: "Agresif",
    desc: "Yüksek risk, yüksek getiri potansiyeli. Dalgalanmayı tolere edebilirim.",
    color: "border-orange-300 bg-orange-50",
    badge: "Deneyimli",
  },
];

const CURRENCY_OPTIONS: Array<{ value: Currency; label: string }> = [
  { value: "TRY", label: "TRY - Türk Lirası" },
  { value: "USD", label: "USD - Amerikan Doları" },
  { value: "EUR", label: "EUR - Euro" },
];

const INCOME_FREQUENCY_OPTIONS: Array<{ value: OnboardingData["incomeFrequency"]; label: string }> = [
  { value: "MONTHLY", label: "Aylık" },
  { value: "WEEKLY", label: "Haftalık" },
  { value: "YEARLY", label: "Yıllık" },
  { value: "ONE_TIME", label: "Tek seferlik" },
];

const PRIORITY_OPTIONS: Array<{ value: OnboardingData["goalPriority"]; label: string }> = [
  { value: "HIGH", label: "Yüksek" },
  { value: "MEDIUM", label: "Orta" },
  { value: "LOW", label: "Düşük" },
];

const BILLING_CYCLE_OPTIONS: Array<{ value: SubscriptionEntry["billingCycle"]; label: string }> = [
  { value: "MONTHLY", label: "Aylık" },
  { value: "YEARLY", label: "Yıllık" },
];

/* ─── motion variants ────────────────────────────────────────────────── */
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.35 } },
  exit: (dir: number) => ({
    x: dir > 0 ? -48 : 48,
    opacity: 0,
    transition: { duration: 0.25 },
  }),
};

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  ariaLabel,
  placeholder,
  className,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <FilterSelect
        value={value}
        onChange={onChange}
        options={options}
        ariaLabel={ariaLabel}
        placeholder={placeholder}
        className="w-full"
        triggerClassName="h-10 w-full text-sm font-medium"
      />
    </div>
  );
}

function CurrencySymbol({ currency }: { currency: Currency }) {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₺";
  return <span className="text-sm font-semibold leading-none">{symbol}</span>;
}

/* ─── AI Preview Panel ───────────────────────────────────────────────── */

function AIPreviewPanel({
  step,
  data,
}: {
  step: number;
  data: OnboardingData;
}) {
  const income = Number(data.monthlyIncome) || 0;
  const totalExpenses = data.expenses.reduce(
    (s, e) => s + (Number(e.amount) || 0),
    0
  );
  const savingRate =
    income > 0 ? ((income - totalExpenses) / income) * 100 : 0;

  // Debt monthly estimate: rough assumption ₺500/debt type
  const debtMonthly =
    data.debts.filter((d) => d !== "NONE").length * 500;
  const debtLoad = income > 0 ? (debtMonthly / income) * 100 : 0;

  const targetAmount = Number(data.goalTarget) || 0;
  const currentAmount = Number(data.goalCurrent) || 0;
  const remaining = Math.max(targetAmount - currentAmount, 0);
  const monthlySaving = Math.max(income - totalExpenses - debtMonthly, 0);
  const goalMonths =
    monthlySaving > 0 && remaining > 0
      ? Math.ceil(remaining / monthlySaving)
      : null;

  const hints: { label: string; value: string; color?: string }[] = [];

  if (step >= 1 && income > 0) {
    hints.push({
      label: "Aylık gelirin",
      value: `₺${income.toLocaleString("tr-TR")}`,
      color: "text-accent",
    });
  }

  if (step >= 2 && income > 0) {
    hints.push({
      label: "Tasarruf oranın",
      value: `~%${Math.max(savingRate, 0).toFixed(1)}`,
      color: savingRate >= 20 ? "text-accent" : savingRate >= 10 ? "text-warning" : "text-danger",
    });
  }

  if (step >= 3 && data.debts.length > 0) {
    hints.push({
      label: "Borç yükün",
      value: `~%${debtLoad.toFixed(1)}`,
      color: debtLoad <= 15 ? "text-accent" : debtLoad <= 35 ? "text-warning" : "text-danger",
    });
  }

  if (step >= 4 && data.goal && targetAmount > 0) {
    hints.push({
      label: "Hedefin",
      value:
        goalMonths !== null
          ? `${goalMonths} ayda ulaşılabilir`
          : monthlySaving <= 0
          ? "Tasarruf artırılmalı"
          : "Hedef tutarı girin",
      color: goalMonths !== null && goalMonths <= 24 ? "text-accent" : "text-warning",
    });
  }

  return (
    <div className="rounded-xl border border-border bg-green-50 border-l-4 border-l-[#10B981] p-5 space-y-4 lg:sticky lg:top-4 lg:self-start">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent shrink-0" />
        <h3 className="text-sm font-semibold text-primary">AI ön tahmin</h3>
      </div>

      {hints.length === 0 ? (
        <p className="text-sm text-muted">
          Bilgilerinizi girdikçe tahminler burada görünecek.
        </p>
      ) : (
        <ul className="space-y-3">
          {hints.map((h) => (
            <li key={h.label} className="flex items-center justify-between">
              <span className="text-sm text-muted">{h.label}:</span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  h.color ?? "text-primary"
                )}
              >
                {h.value}
              </span>
            </li>
          ))}
        </ul>
      )}

      {income > 0 && totalExpenses > 0 && (
        <div className="rounded-lg bg-white/70 p-3 text-xs text-muted space-y-1">
          <div className="flex justify-between">
            <span>Gelir</span>
            <span className="font-medium text-primary">
              ₺{income.toLocaleString("tr-TR")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Giderler</span>
            <span className="font-medium text-primary">
              ₺{totalExpenses.toLocaleString("tr-TR")}
            </span>
          </div>
          <div className="flex justify-between border-t border-border/50 pt-1">
            <span>Net Tasarruf</span>
            <span
              className={`font-semibold ${
                income - totalExpenses >= 0 ? "text-accent" : "text-danger"
              }`}
            >
              ₺{(income - totalExpenses).toLocaleString("tr-TR")}
            </span>
          </div>
        </div>
      )}

      <p className="text-xs text-muted/70 border-t border-border/50 pt-3">
        Güvenli ve gizli. Finansal tavsiye niteliği taşımaz.
      </p>
    </div>
  );
}

/* ─── component ─────────────────────────────────────────────────────── */
export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = React.useState(1);
  const [direction, setDirection] = React.useState(1);
  const [isSaving, setIsSaving] = React.useState(false);

  const [data, setData] = React.useState<OnboardingData>({
    city: "",
    occupation: "",
    incomeFrequency: "MONTHLY",
    monthlyIncome: "",
    currency: "TRY",
    incomeSources: DEFAULT_INCOME_SOURCES,
    expenses: EXPENSE_KEYS.map((e) => ({ ...e, amount: "" })),
    budgetLimits: EXPENSE_KEYS.map((e) => ({ ...e, amount: "" })),
    debts: [],
    debtDetails: DEBT_DETAIL_TEMPLATES,
    subscriptions: DEFAULT_SUBSCRIPTIONS,
    goal: "",
    goalTarget: "",
    goalCurrent: "",
    goalDeadline: "",
    goalPriority: "HIGH",
    riskTolerance: "",
    notifications: {
      budgetAlerts: true,
      weeklyReport: true,
      aiSuggestions: true,
      monthlyReview: false,
    },
  });

  /* helpers */
  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEP_COUNT));
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const toggleDebt = (value: DebtType) => {
    setData((prev) => {
      if (value === "NONE") return { ...prev, debts: ["NONE"] };
      const filtered = prev.debts.filter((d) => d !== "NONE");
      return prev.debts.includes(value)
        ? { ...prev, debts: filtered.filter((d) => d !== value) }
        : { ...prev, debts: [...filtered, value] };
    });
  };

  const updateExpense = (key: string, amount: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) =>
        e.key === key ? { ...e, amount } : e
      ),
    }));
  };

  const updateBudgetLimit = (key: string, amount: string) => {
    setData((prev) => ({
      ...prev,
      budgetLimits: prev.budgetLimits.map((e) =>
        e.key === key ? { ...e, amount } : e
      ),
    }));
  };

  const updateIncomeSource = (
    index: number,
    field: keyof IncomeSourceEntry,
    value: string
  ) => {
    setData((prev) => ({
      ...prev,
      incomeSources: prev.incomeSources.map((source, i) =>
        i === index ? { ...source, [field]: value } : source
      ),
    }));
  };

  const removeIncomeSource = (index: number) => {
    setData((prev) => ({
      ...prev,
      incomeSources:
        prev.incomeSources.length > 1
          ? prev.incomeSources.filter((_, i) => i !== index)
          : [{ title: "", amount: "", category: "", frequency: "MONTHLY" }],
    }));
  };

  const updateDebtDetail = (
    index: number,
    field: keyof DebtDetailEntry,
    value: string
  ) => {
    setData((prev) => ({
      ...prev,
      debtDetails: prev.debtDetails.map((debt, i) =>
        i === index ? { ...debt, [field]: value } : debt
      ),
    }));
  };

  const updateSubscription = (
    index: number,
    field: keyof SubscriptionEntry,
    value: string
  ) => {
    setData((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.map((subscription, i) =>
        i === index ? { ...subscription, [field]: value } : subscription
      ),
    }));
  };

  const removeSubscription = (index: number) => {
    setData((prev) => ({
      ...prev,
      subscriptions:
        prev.subscriptions.length > 1
          ? prev.subscriptions.filter((_, i) => i !== index)
          : [{ title: "", amount: "", billingCycle: "MONTHLY", nextBillingDay: "1", category: "Diğer" }],
    }));
  };

  /* step validation */
  const canProceed = React.useMemo(() => {
    if (step === 1)
      return (
        data.monthlyIncome.trim().length > 0 &&
        !isNaN(Number(data.monthlyIncome))
      );
    if (step === 3) return data.debts.length > 0;
    if (step === 4) return data.goal !== "";
    if (step === 6) return data.riskTolerance !== "";
    return true;
  }, [step, data]);

  /* finish */
  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingCompleted: true,
          city: data.city || undefined,
          occupation: data.occupation || undefined,
          incomeFrequency: data.incomeFrequency,
          monthlyIncome: Number(data.monthlyIncome),
          currency: data.currency,
          incomeSources: data.incomeSources.filter((source) => source.amount.trim() !== ""),
          expenses: data.expenses.filter((e) => e.amount.trim() !== ""),
          budgetLimits: data.budgetLimits.filter((e) => e.amount.trim() !== ""),
          debts: data.debts.filter((d) => d !== "NONE"),
          debtDetails: data.debtDetails.filter((debt) => debt.remainingAmount.trim() !== ""),
          subscriptions: data.subscriptions.filter((subscription) => subscription.amount.trim() !== ""),
          primaryGoal: data.goal,
          goalTarget: Number(data.goalTarget) || undefined,
          goalCurrent: Number(data.goalCurrent) || 0,
          goalDeadline: data.goalDeadline || undefined,
          goalPriority: data.goalPriority,
          riskTolerance: data.riskTolerance,
          notificationPreferences: data.notifications,
        }),
      });

      if (!res.ok) {
        toast.error("Profil kaydedilemedi. Lütfen tekrar deneyin.");
        return;
      }

      toast.success("Profil tamamlandı. Panele yönlendiriliyorsunuz.");
      await update({
        onboardingCompleted: true,
        currency: data.currency,
      });
      router.replace("/app");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Top logo/title */}
      <div className="mb-8 text-center">
        <OwlIcon className="mx-auto mb-4 h-14 w-14" />
        <h1 className="text-2xl font-bold text-primary">
          Finansal profilini oluştur
        </h1>
        <p className="mt-2 text-sm text-muted">
          Adım {step} / {STEP_COUNT} · {STEPS[step - 1].title}
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.title}>
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                  i + 1 < step
                    ? "bg-accent text-white"
                    : i + 1 === step
                    ? "bg-accent/20 text-accent ring-2 ring-accent"
                    : "bg-border text-muted"
                )}
              >
                {i + 1 < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="mt-1 hidden text-[10px] font-medium sm:block text-muted">
                {s.title}
              </span>
            </div>
            {/* Connecting line */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-1 transition-colors duration-300",
                  i + 1 < step ? "bg-accent" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 2-col grid: form | preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {/* Form Card */}
        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="p-6 sm:p-8"
            >
              {/* STEP 1 — Monthly income */}
              {step === 1 && (
                <div>
                  <h2 className="mb-1 text-lg font-semibold text-primary">
                    Aylık net geliriniz
                  </h2>
                  <p className="mb-6 text-sm text-muted">
                    Tüm kesintilerden sonra ele geçen net tutarı girin.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                    <Input
                      label="Tutar"
                      type="number"
                      placeholder="0"
                      min="0"
                      leftIcon={<CurrencySymbol currency={data.currency} />}
                      value={data.monthlyIncome}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          monthlyIncome: e.target.value,
                        }))
                      }
                    />
                    <div className="grid gap-3">
                      <SelectField
                        label="Para Birimi"
                        value={data.currency}
                        onChange={(value) =>
                          setData((prev) => ({
                            ...prev,
                            currency: value,
                          }))
                        }
                        options={CURRENCY_OPTIONS}
                        ariaLabel="Para birimi seç"
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <SelectField
                      label="Gelir sıklığı"
                      value={data.incomeFrequency}
                      onChange={(value) =>
                        setData((prev) => ({
                          ...prev,
                          incomeFrequency: value,
                        }))
                      }
                      options={INCOME_FREQUENCY_OPTIONS}
                      ariaLabel="Gelir sıklığı seç"
                    />
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600">
                      Aylık gelir ve sıklık bilgisi, analizlerin ve önerilen bütçe
                      planının daha doğru oluşturulmasını sağlar.
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted/70">
                    Bu bilgi sadece bütçe analizi için kullanılır ve hiçbir
                    üçüncü tarafla paylaşılmaz.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Şehir"
                      placeholder="İstanbul"
                      value={data.city}
                      onChange={(e) =>
                        setData((prev) => ({ ...prev, city: e.target.value }))
                      }
                    />
                    <Input
                      label="Meslek"
                      placeholder="Yazılım geliştirici"
                      value={data.occupation}
                      onChange={(e) =>
                        setData((prev) => ({ ...prev, occupation: e.target.value }))
                      }
                    />
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-primary">Gelir kaynakları</h3>
                      <button
                        type="button"
                        className="text-xs font-medium text-accent"
                        onClick={() =>
                          setData((prev) => ({
                            ...prev,
                            incomeSources: [
                              ...prev.incomeSources,
                              { title: "", amount: "", category: "", frequency: "MONTHLY" },
                            ],
                          }))
                        }
                      >
                        Kaynak ekle
                      </button>
                    </div>
                    {data.incomeSources.map((source, index) => (
                      <div key={index} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto_36px]">
                        <Input
                          label="Kaynak"
                          placeholder="Maaş"
                          value={source.title}
                          onChange={(e) => updateIncomeSource(index, "title", e.target.value)}
                        />
                        <Input
                          label="Tutar"
                          type="number"
                          min="0"
                          placeholder="0"
                          leftIcon={<CurrencySymbol currency={data.currency} />}
                          value={source.amount}
                          onChange={(e) => updateIncomeSource(index, "amount", e.target.value)}
                        />
                        <SelectField
                          label="Sıklık"
                          value={source.frequency}
                          onChange={(value) => updateIncomeSource(index, "frequency", value)}
                          options={INCOME_FREQUENCY_OPTIONS}
                          ariaLabel="Gelir kaynağı sıklığını seç"
                        />
                        <button
                          type="button"
                          aria-label="Gelir kaynağını sil"
                          onClick={() => removeIncomeSource(index)}
                          className="mt-6 flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-danger/40 hover:bg-red-50 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2 — Monthly expenses */}
              {step === 2 && (
                <div>
                  <h2 className="mb-1 text-lg font-semibold text-primary">
                    Aylık giderleriniz
                  </h2>
                  <p className="mb-6 text-sm text-muted">
                    Her kategori için tahmini aylık tutarı girin. Boş
                    bırakabilirsiniz.
                  </p>
                  <div className="space-y-3">
                    {data.expenses.map((exp) => (
                      <Input
                        key={exp.key}
                        label={exp.label}
                        type="number"
                        placeholder="0"
                        min="0"
                        leftIcon={<CurrencySymbol currency={data.currency} />}
                        value={exp.amount}
                        onChange={(e) =>
                          updateExpense(exp.key, e.target.value)
                        }
                      />
                    ))}
                  </div>
                  <div className="mt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-primary">Bu ay için bütçe limitleri</h3>
                    <p className="text-xs text-muted">
                      Boş bırakırsan sadece gider kaydı oluşur; limit girersen bütçe sayfası da hazır olur.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {data.budgetLimits.map((limit) => (
                        <Input
                          key={limit.key}
                          label={limit.label}
                          type="number"
                          placeholder="0"
                          min="0"
                          leftIcon={<CurrencySymbol currency={data.currency} />}
                          value={limit.amount}
                          onChange={(e) => updateBudgetLimit(limit.key, e.target.value)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 — Debt status */}
              {step === 3 && (
                <div>
                  <h2 className="mb-1 text-lg font-semibold text-primary">
                    Borç durumunuz
                  </h2>
                  <p className="mb-6 text-sm text-muted">
                    Mevcut borç türlerinizi seçin. Birden fazla seçebilirsiniz.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        {
                          value: "CREDIT_CARD",
                          label: "Kredi kartı",
                          icon: "💳",
                          desc: "Kredi kartı borcu",
                        },
                        {
                          value: "LOAN",
                          label: "Kredi",
                          icon: "🏦",
                          desc: "Taşıt veya ihtiyaç kredisi",
                        },
                        {
                          value: "MORTGAGE",
                          label: "Konut kredisi",
                          icon: "🏠",
                          desc: "İpotekli konut kredisi",
                        },
                        {
                          value: "NONE",
                          label: "Borcum yok",
                          icon: "✅",
                          desc: "Herhangi bir borcum yok",
                        },
                      ] as const
                    ).map((d) => {
                      const selected = data.debts.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDebt(d.value)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all duration-200",
                            selected
                              ? "border-accent bg-green-50"
                              : "border-border bg-white hover:border-accent/40 hover:bg-green-50/30"
                          )}
                        >
                          <span className="text-2xl">{d.icon}</span>
                          <div>
                            <p className="font-medium text-primary">{d.label}</p>
                            <p className="text-xs text-muted">{d.desc}</p>
                          </div>
                          {selected && (
                            <Check className="ml-auto h-4 w-4 shrink-0 text-accent" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {!data.debts.includes("NONE") && data.debts.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-sm font-semibold text-primary">Borç detayları</h3>
                      {data.debtDetails
                        .filter((debt) => data.debts.includes(debt.type as DebtType))
                        .map((debt) => {
                          const index = data.debtDetails.findIndex((item) => item.type === debt.type);
                          return (
                            <div key={debt.type} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-3">
                              <Input
                                label="Başlık"
                                value={debt.title}
                                onChange={(e) => updateDebtDetail(index, "title", e.target.value)}
                              />
                              <Input
                                label="Toplam"
                                type="number"
                                min="0"
                                leftIcon={<CurrencySymbol currency={data.currency} />}
                                value={debt.totalAmount}
                                onChange={(e) => updateDebtDetail(index, "totalAmount", e.target.value)}
                              />
                              <Input
                                label="Kalan"
                                type="number"
                                min="0"
                                leftIcon={<CurrencySymbol currency={data.currency} />}
                                value={debt.remainingAmount}
                                onChange={(e) => updateDebtDetail(index, "remainingAmount", e.target.value)}
                              />
                              <Input
                                label="Asgari ödeme"
                                type="number"
                                min="0"
                                leftIcon={<CurrencySymbol currency={data.currency} />}
                                value={debt.minimumPayment}
                                onChange={(e) => updateDebtDetail(index, "minimumPayment", e.target.value)}
                              />
                              <Input
                                label="Faiz %"
                                type="number"
                                min="0"
                                value={debt.interestRate}
                                onChange={(e) => updateDebtDetail(index, "interestRate", e.target.value)}
                              />
                              <Input
                                label="Son ödeme günü"
                                type="number"
                                min="1"
                                max="31"
                                value={debt.dueDay}
                                onChange={(e) => updateDebtDetail(index, "dueDay", e.target.value)}
                              />
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4 — Financial goal */}
              {step === 4 && (
                <div>
                  <h2 className="mb-1 text-lg font-semibold text-primary">
                    Ana finansal hedefiniz
                  </h2>
                  <p className="mb-4 text-sm text-muted">
                    Şu an önceliğiniz olan tek bir hedef seçin.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {GOALS.map((g) => {
                      const selected = data.goal === g.value;
                      return (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() =>
                            setData((prev) => ({ ...prev, goal: g.value }))
                          }
                          className={cn(
                            "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all duration-200",
                            selected
                              ? "border-accent bg-green-50"
                              : "border-border bg-white hover:border-accent/40 hover:bg-green-50/30"
                          )}
                        >
                          <span className="text-2xl">{g.emoji}</span>
                          <div>
                            <p className="font-medium text-primary">{g.label}</p>
                            <p className="text-xs text-muted">{g.desc}</p>
                          </div>
                          {selected && (
                            <Check className="ml-auto h-4 w-4 shrink-0 text-accent" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {data.goal && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Input
                        label="Hedef tutarı"
                        type="number"
                        placeholder="0"
                        min="0"
                        leftIcon={<CurrencySymbol currency={data.currency} />}
                        value={data.goalTarget}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            goalTarget: e.target.value,
                          }))
                        }
                      />
                      <Input
                        label="Mevcut birikim"
                        type="number"
                        placeholder="0"
                        min="0"
                        leftIcon={<CurrencySymbol currency={data.currency} />}
                        value={data.goalCurrent}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            goalCurrent: e.target.value,
                          }))
                        }
                      />
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Hedef tarihi
                        </label>
                        <DatePickerField
                          ariaLabel="Hedef tarihi"
                          value={data.goalDeadline}
                          onChange={(value) =>
                            setData((prev) => ({
                              ...prev,
                              goalDeadline: value,
                            }))
                          }
                          placeholder="Tarih seçin"
                        />
                      </div>
                      <SelectField
                        label="Öncelik"
                        value={data.goalPriority}
                        onChange={(value) =>
                          setData((prev) => ({
                            ...prev,
                            goalPriority: value,
                          }))
                        }
                        options={PRIORITY_OPTIONS}
                        ariaLabel="Hedef önceliğini seç"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5 - Subscriptions */}
              {step === 5 && (
                <div>
                  <h2 className="mb-1 text-lg font-semibold text-primary">
                    Abonelikleriniz
                  </h2>
                  <p className="mb-6 text-sm text-muted">
                    Kullandığınız abonelikleri girerseniz abonelik takibi otomatik başlar. Boş bırakabilirsiniz.
                  </p>
                  <div className="space-y-3">
                    {data.subscriptions.map((subscription, index) => (
                      <div key={index} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto_auto_36px]">
                        <Input
                          label="Abonelik"
                          value={subscription.title}
                          onChange={(e) => updateSubscription(index, "title", e.target.value)}
                        />
                        <Input
                          label="Tutar"
                          type="number"
                          min="0"
                          leftIcon={<CurrencySymbol currency={data.currency} />}
                          value={subscription.amount}
                          onChange={(e) => updateSubscription(index, "amount", e.target.value)}
                        />
                        <SelectField
                          label="Dönem"
                          value={subscription.billingCycle}
                          onChange={(value) => updateSubscription(index, "billingCycle", value)}
                          options={BILLING_CYCLE_OPTIONS}
                          ariaLabel="Abonelik dönemini seç"
                        />
                        <Input
                          label="Ödeme günü"
                          type="number"
                          min="1"
                          max="31"
                          value={subscription.nextBillingDay}
                          onChange={(e) => updateSubscription(index, "nextBillingDay", e.target.value)}
                        />
                        <button
                          type="button"
                          aria-label="Aboneliği sil"
                          onClick={() => removeSubscription(index)}
                          className="mt-6 flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-danger/40 hover:bg-red-50 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="text-sm font-medium text-accent"
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          subscriptions: [
                            ...prev.subscriptions,
                            { title: "", amount: "", billingCycle: "MONTHLY", nextBillingDay: "1", category: "Diğer" },
                          ],
                        }))
                      }
                    >
                      Yeni abonelik ekle
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6 - Risk tolerance */}
              {step === 6 && (
                <div>
                  <h2 className="mb-1 text-lg font-semibold text-primary">
                    Risk toleransınız
                  </h2>
                  <p className="mb-6 text-sm text-muted">
                    Yatırım ve tasarruf önerilerini kişiselleştirmek için risk
                    profilinizi belirleyin.
                  </p>
                  <div className="space-y-3">
                    {RISKS.map((r) => {
                      const selected = data.riskTolerance === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() =>
                            setData((prev) => ({
                              ...prev,
                              riskTolerance: r.value,
                            }))
                          }
                          className={cn(
                            "flex w-full items-start gap-4 rounded-lg border-2 p-4 text-left transition-all duration-200",
                            selected
                              ? cn("border-accent", r.color)
                              : "border-border bg-white hover:border-accent/40"
                          )}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-primary">
                                {r.label}
                              </p>
                              <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-border">
                                {r.badge}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted">{r.desc}</p>
                          </div>
                          <div
                            className={cn(
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                              selected
                                ? "border-accent bg-accent"
                                : "border-border"
                            )}
                          >
                            {selected && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 7 - Notification preferences */}
              {step === 7 && (
                <div>
                  <h2 className="mb-1 text-lg font-semibold text-primary">
                    Bildirim tercihleri
                  </h2>
                  <p className="mb-6 text-sm text-muted">
                    Hangi bildirimleri almak istediğinizi seçin. İstediğiniz
                    zaman değiştirebilirsiniz.
                  </p>
                  <div className="space-y-3">
                    {(
                      [
                        {
                          key: "budgetAlerts" as const,
                          label: "Bütçe aşımı uyarıları",
                          desc: "Harcama kategorisi limitini aştığında anında bildir.",
                          emoji: "⚠️",
                        },
                        {
                          key: "weeklyReport" as const,
                          label: "Haftalık özet rapor",
                          desc: "Her Pazartesi haftalık harcama özetini al.",
                          emoji: "📊",
                        },
                        {
                          key: "aiSuggestions" as const,
                          label: "AI tasarruf önerileri",
                          desc: "Yapay zeka destekli kişisel önerileri düzenli olarak al.",
                          emoji: "🤖",
                        },
                        {
                          key: "monthlyReview" as const,
                          label: "Aylık değerlendirme",
                          desc: "Her ay sonunda kapsamlı finansal analiz raporu.",
                          emoji: "📅",
                        },
                      ] as const
                    ).map((n) => {
                      const checked = data.notifications[n.key];
                      return (
                        <label
                          key={n.key}
                          className={cn(
                            "flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-all duration-200",
                            checked
                              ? "border-accent/50 bg-green-50"
                              : "border-border bg-white hover:bg-slate-50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setData((prev) => ({
                                ...prev,
                                notifications: {
                                  ...prev.notifications,
                                  [n.key]: e.target.checked,
                                },
                              }))
                            }
                            className="mt-0.5 h-4 w-4 accent-accent cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{n.emoji}</span>
                              <p className="font-medium text-primary">
                                {n.label}
                              </p>
                            </div>
                            <p className="mt-0.5 text-xs text-muted">{n.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation inside card */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <Button
              variant="ghost"
              size="md"
              onClick={goPrev}
              disabled={step === 1 || isSaving}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Geri
            </Button>

            <span className="text-xs text-muted">
              {step} / {STEP_COUNT}
            </span>

            {step < STEP_COUNT ? (
              <Button
                variant="primary"
                size="md"
                onClick={goNext}
                disabled={!canProceed}
                className="flex items-center gap-1"
              >
                Devam et
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleFinish}
                loading={isSaving}
                className="flex items-center gap-1"
              >
                Tamamla
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Right: AI Preview Panel */}
        <AIPreviewPanel step={step} data={data} />
      </div>

      <p className="mt-4 text-center text-xs text-muted/70">
        Bu bilgileri daha sonra ayarlar sayfasından güncelleyebilirsiniz.
      </p>
    </div>
  );
}
