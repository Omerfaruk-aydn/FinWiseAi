// Finansal Hesaplama Motoru - Tüm hesaplamalar deterministik ve saf fonksiyonlardır.
// AI bu fonksiyonların çıktılarını yorumlar; bu fonksiyonlar hesaplama yapmaz, sadece hesaplar.

// Inline type definitions (Prisma generate yapılmamış olabilir, bu yüzden inline tanımlıyoruz)

interface Income {
  amount: number;
  frequency: string;
}

interface Expense {
  amount: number;
  categoryId?: string | null;
}

interface Goal {
  targetAmount: number;
  currentAmount: number;
  deadline?: Date | string | null;
  status?: string;
}

interface Debt {
  id: string;
  remainingAmount: number;
  minimumPayment: number;
  interestRate: number;
  status?: string;
}

interface BudgetCategory {
  categoryId: string;
  plannedAmount: number;
  actualAmount: number;
}

interface Subscription {
  id: string;
  title: string;
  amount: number;
  billingCycle: string;
  status?: string;
}

// ============================================================
// TYPES
// ============================================================

export interface BudgetDistribution {
  needs: number;
  wants: number;
  savings: number;
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
}

export interface GoalFeasibility {
  isFeasible: boolean;
  requiredMonthly: number;
  estimatedCompletionDate: Date | null;
  shortfall: number | null;
  monthsRemaining: number | null;
  progressPercent: number;
}

export interface CategoryLimit {
  categoryId: string;
  categoryName: string;
  plannedAmount: number;
  actualAmount: number;
  overAmount: number;
  isOver: boolean;
  percentUsed: number;
}

export interface OverspendingAlert {
  categoryId: string;
  categoryName: string;
  plannedAmount: number;
  actualAmount: number;
  overAmount: number;
  percentOver: number;
}

export interface SubscriptionWasteResult {
  totalMonthlySpend: number;
  totalYearlySpend: number;
  potentialSavings: number;
  wasteItems: Array<{
    id: string;
    title: string;
    monthlyAmount: number;
    reason: string;
  }>;
}

export interface PayoffEstimate {
  debtId: string;
  monthsToPayoff: number;
  totalInterestPaid: number;
  totalAmountPaid: number;
  payoffDate: Date;
  withExtraPaymentMonths?: number;
  withExtraPaymentInterest?: number;
}

export interface MonthData {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  savingRate: number;
  categorySummary: Array<{
    categoryId: string;
    categoryName: string;
    totalAmount: number;
  }>;
}

export interface MonthComparison {
  incomeDiff: number;
  incomeDiffPercent: number;
  expenseDiff: number;
  expenseDiffPercent: number;
  savingDiff: number;
  savingRateDiff: number;
  isIncomeUp: boolean;
  isExpenseDown: boolean;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    currentAmount: number;
    previousAmount: number;
    diff: number;
    diffPercent: number;
  }>;
}

export interface HealthScoreInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalMonthlyDebtPayments: number;
  totalSavings: number;
  goals: Array<{ currentAmount: number; targetAmount: number }>;
  budgetCategories: Array<{ plannedAmount: number; actualAmount: number }>;
}

export interface HealthScoreResult {
  score: number;
  incomeExpenseRatio: number;
  savingRate: number;
  debtLoad: number;
  spendingDiscipline: number;
  goalProgress: number;
  status: "strong" | "good" | "warning" | "risk";
  statusLabel: string;
  statusColor: string;
}

// ============================================================
// TEMEL HESAPLAMALAR
// ============================================================

export function calculateMonthlyIncome(incomes: Income[]): number {
  return incomes.reduce((sum, income) => {
    switch (income.frequency) {
      case "MONTHLY":
        return sum + income.amount;
      case "WEEKLY":
        return sum + income.amount * 4.33;
      case "YEARLY":
        return sum + income.amount / 12;
      case "ONE_TIME":
        return sum + income.amount;
      default:
        return sum + income.amount;
    }
  }, 0);
}

export function calculateMonthlyExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

export function calculateNetCashflow(monthlyIncome: number, monthlyExpenses: number): number {
  return monthlyIncome - monthlyExpenses;
}

export function calculateSavingRate(netCashflow: number, monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 0;
  return Math.max(0, (netCashflow / monthlyIncome) * 100);
}

export function calculateDebtLoadRatio(
  totalMonthlyDebtPayments: number,
  monthlyIncome: number
): number {
  if (monthlyIncome <= 0) return 100;
  return (totalMonthlyDebtPayments / monthlyIncome) * 100;
}

// ============================================================
// BÜTÇE HESAPLAMALARI
// ============================================================

export function calculateBudgetDistribution(monthlyIncome: number): BudgetDistribution {
  // 50/30/20 kuralı
  const needsPercent = 50;
  const wantsPercent = 30;
  const savingsPercent = 20;

  return {
    needs: monthlyIncome * (needsPercent / 100),
    wants: monthlyIncome * (wantsPercent / 100),
    savings: monthlyIncome * (savingsPercent / 100),
    needsPercent,
    wantsPercent,
    savingsPercent,
  };
}

export function generateCategoryLimits(
  expenses: Expense[],
  budgetCategories: (BudgetCategory & { category: { id: string; name: string } | null })[]
): CategoryLimit[] {
  return budgetCategories.map((bc) => {
    const categoryExpenses = expenses
      .filter((e) => e.categoryId === bc.categoryId)
      .reduce((sum, e) => sum + e.amount, 0);

    const overAmount = Math.max(0, categoryExpenses - bc.plannedAmount);
    const percentUsed = bc.plannedAmount > 0 ? (categoryExpenses / bc.plannedAmount) * 100 : 0;

    return {
      categoryId: bc.categoryId,
      categoryName: bc.category?.name ?? "Diğer",
      plannedAmount: bc.plannedAmount,
      actualAmount: categoryExpenses,
      overAmount,
      isOver: categoryExpenses > bc.plannedAmount,
      percentUsed,
    };
  });
}

// ============================================================
// HEDEF HESAPLAMALARI
// ============================================================

export function calculateGoalFeasibility(
  goal: Goal,
  netCashflow: number
): GoalFeasibility {
  const remainingAmount = goal.targetAmount - goal.currentAmount;
  const progressPercent = goal.targetAmount > 0
    ? (goal.currentAmount / goal.targetAmount) * 100
    : 0;

  if (remainingAmount <= 0) {
    return {
      isFeasible: true,
      requiredMonthly: 0,
      estimatedCompletionDate: new Date(),
      shortfall: null,
      monthsRemaining: 0,
      progressPercent: 100,
    };
  }

  if (goal.deadline) {
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const monthsRemaining = Math.max(
      1,
      (deadline.getFullYear() - now.getFullYear()) * 12 +
        (deadline.getMonth() - now.getMonth())
    );

    const requiredMonthly = remainingAmount / monthsRemaining;
    const isFeasible = netCashflow >= requiredMonthly;
    const shortfall = isFeasible ? null : requiredMonthly - netCashflow;

    return {
      isFeasible,
      requiredMonthly,
      estimatedCompletionDate: deadline,
      shortfall,
      monthsRemaining,
      progressPercent,
    };
  }

  if (netCashflow > 0) {
    const monthsRequired = Math.ceil(remainingAmount / netCashflow);
    const completionDate = new Date();
    completionDate.setMonth(completionDate.getMonth() + monthsRequired);

    return {
      isFeasible: true,
      requiredMonthly: netCashflow,
      estimatedCompletionDate: completionDate,
      shortfall: null,
      monthsRemaining: monthsRequired,
      progressPercent,
    };
  }

  return {
    isFeasible: false,
    requiredMonthly: remainingAmount,
    estimatedCompletionDate: null,
    shortfall: remainingAmount,
    monthsRemaining: null,
    progressPercent,
  };
}

export function calculateRequiredMonthlySaving(
  targetAmount: number,
  currentAmount: number,
  deadlineMonths: number
): number {
  if (deadlineMonths <= 0) return targetAmount - currentAmount;
  return Math.max(0, (targetAmount - currentAmount) / deadlineMonths);
}

// ============================================================
// FİNANSAL SAĞLIK SKORU (0-100, deterministik)
// ============================================================

export function calculateFinancialHealthScore(input: HealthScoreInput): HealthScoreResult {
  const { monthlyIncome, monthlyExpenses, totalMonthlyDebtPayments, goals, budgetCategories } =
    input;

  const netCashflow = calculateNetCashflow(monthlyIncome, monthlyExpenses);
  const savingRate = calculateSavingRate(netCashflow, monthlyIncome);
  const debtLoadRatio = calculateDebtLoadRatio(totalMonthlyDebtPayments, monthlyIncome);

  // 1. Gelir-Gider Dengesi: max 25 puan
  // Giderler gelirin %70'inden azsa tam puan
  let incomeExpenseScore = 0;
  if (monthlyIncome > 0) {
    const expenseRatio = monthlyExpenses / monthlyIncome;
    if (expenseRatio <= 0.5) incomeExpenseScore = 25;
    else if (expenseRatio <= 0.7) incomeExpenseScore = 25 * (1 - (expenseRatio - 0.5) / 0.2);
    else if (expenseRatio <= 0.9) incomeExpenseScore = 25 * (1 - (expenseRatio - 0.5) / 0.4) * 0.5;
    else incomeExpenseScore = 0;
    incomeExpenseScore = Math.max(0, incomeExpenseScore);
  }

  // 2. Tasarruf Oranı: max 20 puan
  // %20+ tam puan, %0 sıfır
  let savingScore = 0;
  if (savingRate >= 20) savingScore = 20;
  else if (savingRate > 0) savingScore = (savingRate / 20) * 20;

  // 3. Borç Yükü: max 20 puan
  // Gelirin %15'inden az borç ödemesi tam puan
  let debtScore = 0;
  if (debtLoadRatio <= 0) {
    debtScore = 20;
  } else if (debtLoadRatio <= 15) {
    debtScore = 20;
  } else if (debtLoadRatio <= 40) {
    debtScore = 20 * (1 - (debtLoadRatio - 15) / 25);
  } else {
    debtScore = 0;
  }

  // 4. Harcama Disiplini: max 20 puan
  // Bütçe limitlerini aşmama oranı
  let spendingScore = 20;
  if (budgetCategories.length > 0) {
    const overCount = budgetCategories.filter(
      (bc) => bc.actualAmount > bc.plannedAmount
    ).length;
    const disciplineRate = 1 - overCount / budgetCategories.length;
    spendingScore = disciplineRate * 20;
  }

  // 5. Hedef İlerlemesi: max 15 puan
  let goalScore = 0;
  if (goals.length > 0) {
    const activeGoals = goals.filter((g) => g.targetAmount > 0);
    if (activeGoals.length > 0) {
      const avgProgress =
        activeGoals.reduce(
          (sum, g) => sum + Math.min(100, (g.currentAmount / g.targetAmount) * 100),
          0
        ) / activeGoals.length;
      goalScore = (avgProgress / 100) * 15;
    }
  }

  const totalScore = Math.round(
    incomeExpenseScore + savingScore + debtScore + spendingScore + goalScore
  );
  const clampedScore = Math.max(0, Math.min(100, totalScore));

  let status: HealthScoreResult["status"];
  let statusLabel: string;
  let statusColor: string;

  if (clampedScore >= 80) {
    status = "strong";
    statusLabel = "Güçlü";
    statusColor = "#10B981";
  } else if (clampedScore >= 60) {
    status = "good";
    statusLabel = "İyi, Geliştirilebilir";
    statusColor = "#3B82F6";
  } else if (clampedScore >= 40) {
    status = "warning";
    statusLabel = "Dikkat Gerekiyor";
    statusColor = "#F59E0B";
  } else {
    status = "risk";
    statusLabel = "Riskli";
    statusColor = "#EF4444";
  }

  return {
    score: clampedScore,
    incomeExpenseRatio: Math.round(incomeExpenseScore * 10) / 10,
    savingRate: Math.round(savingScore * 10) / 10,
    debtLoad: Math.round(debtScore * 10) / 10,
    spendingDiscipline: Math.round(spendingScore * 10) / 10,
    goalProgress: Math.round(goalScore * 10) / 10,
    status,
    statusLabel,
    statusColor,
  };
}

// ============================================================
// ANALİTİK FONKSİYONLAR
// ============================================================

export function detectOverspendingCategories(
  expenses: Expense[],
  limits: CategoryLimit[]
): OverspendingAlert[] {
  return limits
    .filter((limit) => limit.isOver)
    .map((limit) => ({
      categoryId: limit.categoryId,
      categoryName: limit.categoryName,
      plannedAmount: limit.plannedAmount,
      actualAmount: limit.actualAmount,
      overAmount: limit.overAmount,
      percentOver:
        limit.plannedAmount > 0 ? (limit.overAmount / limit.plannedAmount) * 100 : 100,
    }))
    .sort((a, b) => b.overAmount - a.overAmount);
}

export function detectSubscriptionWaste(subscriptions: Subscription[]): SubscriptionWasteResult {
  const activeSubscriptions = subscriptions.filter((s) => s.status === "ACTIVE");

  const totalMonthlySpend = activeSubscriptions.reduce((sum, sub) => {
    if (sub.billingCycle === "MONTHLY") return sum + sub.amount;
    if (sub.billingCycle === "YEARLY") return sum + sub.amount / 12;
    return sum;
  }, 0);

  const totalYearlySpend = totalMonthlySpend * 12;

  const now = new Date();
  const wasteItems: SubscriptionWasteResult["wasteItems"] = [];

  // Çok pahalı abonelikler (aylık 500 TL üzeri tek abonelik)
  activeSubscriptions.forEach((sub) => {
    const monthlyAmount =
      sub.billingCycle === "MONTHLY" ? sub.amount : sub.amount / 12;

    if (monthlyAmount > 500) {
      wasteItems.push({
        id: sub.id,
        title: sub.title,
        monthlyAmount,
        reason: `Aylık ${monthlyAmount.toFixed(0)} TL yüksek maliyetli abonelik`,
      });
    }
  });

  // Yakında yenilenecek ama uzun süredir görülmemiş abonelikler
  // (Bu kısım kullanım verisi olmadığı için sadece yüksek maliyet kontrolü yapılır)
  const potentialSavings = wasteItems.reduce((sum, item) => sum + item.monthlyAmount, 0);

  return {
    totalMonthlySpend,
    totalYearlySpend,
    potentialSavings,
    wasteItems,
  };
}

export function estimateDebtPayoffTime(
  debt: Debt,
  extraMonthlyPayment: number = 0
): PayoffEstimate {
  const { remainingAmount, minimumPayment, interestRate } = debt;
  const monthlyInterestRate = interestRate / 100 / 12;
  const totalMonthlyPayment = minimumPayment + extraMonthlyPayment;

  let balance = remainingAmount;
  let months = 0;
  let totalInterestPaid = 0;
  const maxMonths = 600; // 50 yıl üst sınır

  while (balance > 0 && months < maxMonths) {
    const interestCharge = balance * monthlyInterestRate;
    totalInterestPaid += interestCharge;
    const principalPayment = Math.min(totalMonthlyPayment - interestCharge, balance);

    if (principalPayment <= 0) {
      months = maxMonths;
      break;
    }

    balance -= principalPayment;
    months++;
  }

  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + months);

  const result: PayoffEstimate = {
    debtId: debt.id,
    monthsToPayoff: months,
    totalInterestPaid: Math.round(totalInterestPaid),
    totalAmountPaid: Math.round(remainingAmount + totalInterestPaid),
    payoffDate,
  };

  if (extraMonthlyPayment > 0) {
    const baseEstimate = estimateDebtPayoffTime(debt, 0);
    result.withExtraPaymentMonths = months;
    result.withExtraPaymentInterest = Math.round(totalInterestPaid);
    result.monthsToPayoff = baseEstimate.monthsToPayoff;
    result.totalInterestPaid = baseEstimate.totalInterestPaid;
  }

  return result;
}

export function compareCurrentMonthToPreviousMonth(
  current: MonthData,
  previous: MonthData
): MonthComparison {
  const incomeDiff = current.totalIncome - previous.totalIncome;
  const incomeDiffPercent =
    previous.totalIncome > 0 ? (incomeDiff / previous.totalIncome) * 100 : 0;

  const expenseDiff = current.totalExpenses - previous.totalExpenses;
  const expenseDiffPercent =
    previous.totalExpenses > 0 ? (expenseDiff / previous.totalExpenses) * 100 : 0;

  const savingDiff = current.netCashflow - previous.netCashflow;
  const savingRateDiff = current.savingRate - previous.savingRate;

  const topCategories = current.categorySummary
    .map((curr) => {
      const prev = previous.categorySummary.find(
        (p) => p.categoryId === curr.categoryId
      );
      const previousAmount = prev?.totalAmount ?? 0;
      const diff = curr.totalAmount - previousAmount;
      const diffPercent = previousAmount > 0 ? (diff / previousAmount) * 100 : 0;

      return {
        categoryId: curr.categoryId,
        categoryName: curr.categoryName,
        currentAmount: curr.totalAmount,
        previousAmount,
        diff,
        diffPercent,
      };
    })
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 5);

  return {
    incomeDiff,
    incomeDiffPercent: Math.round(incomeDiffPercent * 10) / 10,
    expenseDiff,
    expenseDiffPercent: Math.round(expenseDiffPercent * 10) / 10,
    savingDiff,
    savingRateDiff: Math.round(savingRateDiff * 10) / 10,
    isIncomeUp: incomeDiff > 0,
    isExpenseDown: expenseDiff < 0,
    topCategories,
  };
}

// ============================================================
// YARDIMCI FONKSİYONLAR
// ============================================================

export function formatCurrency(amount: number, currency: string = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateTotalDebtMonthlyPayments(debts: Debt[]): number {
  return debts
    .filter((d) => d.status === "ACTIVE")
    .reduce((sum, d) => sum + d.minimumPayment, 0);
}

export function calculateGoalAverageProgress(goals: Goal[]): number {
  const activeGoals = goals.filter((g) => g.status === "ACTIVE" && g.targetAmount > 0);
  if (activeGoals.length === 0) return 0;

  const totalProgress = activeGoals.reduce(
    (sum, g) => sum + Math.min(100, (g.currentAmount / g.targetAmount) * 100),
    0
  );
  return totalProgress / activeGoals.length;
}
