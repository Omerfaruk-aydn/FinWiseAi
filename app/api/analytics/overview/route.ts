import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";
import {
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateNetCashflow,
  calculateSavingRate,
  calculateDebtLoadRatio,
  calculateTotalDebtMonthlyPayments,
  calculateFinancialHealthScore,
} from "@/lib/finance/calculations";

export async function GET(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));
    const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const startOfPrevMonth = new Date(prevYear, prevMonth - 1, 1);
    const endOfPrevMonth = new Date(prevYear, prevMonth, 0, 23, 59, 59);

    const [
      currentIncomes,
      currentExpenses,
      prevIncomes,
      prevExpenses,
      debts,
      goals,
      recentTransactions,
      upcomingPayments,
    ] = await Promise.all([
      prisma.income.findMany({ where: { userId: session.user.id, date: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.expense.findMany({
        where: { userId: session.user.id, date: { gte: startOfMonth, lte: endOfMonth } },
        include: { category: { select: { name: true, icon: true, color: true } } },
      }),
      prisma.income.findMany({ where: { userId: session.user.id, date: { gte: startOfPrevMonth, lte: endOfPrevMonth } } }),
      prisma.expense.findMany({ where: { userId: session.user.id, date: { gte: startOfPrevMonth, lte: endOfPrevMonth } } }),
      prisma.debt.findMany({ where: { userId: session.user.id, status: "ACTIVE" } }),
      prisma.goal.findMany({ where: { userId: session.user.id, status: "ACTIVE" } }),
      prisma.transaction.findMany({
        where: { userId: session.user.id },
        orderBy: { date: "desc" },
        take: 5,
        include: { category: { select: { name: true, icon: true, color: true } } },
      }),
      prisma.subscription.findMany({
        where: {
          userId: session.user.id,
          status: "ACTIVE",
          nextBillingDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { nextBillingDate: "asc" },
      }),
    ]);

    const currentMonthlyIncome = calculateMonthlyIncome(currentIncomes);
    const currentMonthlyExpenses = calculateMonthlyExpenses(currentExpenses);
    const prevMonthlyIncome = calculateMonthlyIncome(prevIncomes);
    const prevMonthlyExpenses = calculateMonthlyExpenses(prevExpenses);

    const netCashflow = calculateNetCashflow(currentMonthlyIncome, currentMonthlyExpenses);
    const savingRate = calculateSavingRate(netCashflow, currentMonthlyIncome);
    const totalDebtPayments = calculateTotalDebtMonthlyPayments(debts);
    const debtLoadRatio = calculateDebtLoadRatio(totalDebtPayments, currentMonthlyIncome);

    const healthScoreResult = calculateFinancialHealthScore({
      monthlyIncome: currentMonthlyIncome,
      monthlyExpenses: currentMonthlyExpenses,
      totalMonthlyDebtPayments: totalDebtPayments,
      totalSavings: 0,
      goals: goals.map((g: { currentAmount: number; targetAmount: number }) => ({ currentAmount: g.currentAmount, targetAmount: g.targetAmount })),
      budgetCategories: [],
    });

    const incomeChange = prevMonthlyIncome > 0
      ? ((currentMonthlyIncome - prevMonthlyIncome) / prevMonthlyIncome) * 100
      : 0;
    const expenseChange = prevMonthlyExpenses > 0
      ? ((currentMonthlyExpenses - prevMonthlyExpenses) / prevMonthlyExpenses) * 100
      : 0;

    // Kategori bazlı harcama
    const categoryMap = new Map<string, { name: string; icon: string; color: string; amount: number }>();
    currentExpenses.forEach((e: { amount: number; categoryId?: string | null; category?: { name: string; icon: string; color: string } | null }) => {
      const key = e.categoryId ?? "other";
      const name = e.category?.name ?? "Diğer";
      const icon = e.category?.icon ?? "circle";
      const color = e.category?.color ?? "#64748B";
      const existing = categoryMap.get(key);
      if (existing) existing.amount += e.amount;
      else categoryMap.set(key, { name, icon, color, amount: e.amount });
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([id, v]) => ({
        id,
        name: v.name,
        icon: v.icon,
        color: v.color,
        amount: v.amount,
        percent: currentMonthlyExpenses > 0 ? (v.amount / currentMonthlyExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return successResponse({
      stats: {
        monthlyIncome: currentMonthlyIncome,
        monthlyExpenses: currentMonthlyExpenses,
        netCashflow,
        savingRate,
        debtLoadRatio,
        totalDebts: debts.reduce((s: number, d: { remainingAmount: number }) => s + d.remainingAmount, 0),
        activeGoalsCount: goals.length,
        healthScore: healthScoreResult.score,
        healthStatus: healthScoreResult.status,
        healthStatusLabel: healthScoreResult.statusLabel,
        healthStatusColor: healthScoreResult.statusColor,
      },
      changes: {
        incomeChange: Math.round(incomeChange * 10) / 10,
        expenseChange: Math.round(expenseChange * 10) / 10,
      },
      topCategories,
      recentTransactions,
      upcomingPayments,
      goals: goals.map((g: { currentAmount: number; targetAmount: number }) => ({
        ...g,
        progressPercent: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
      })),
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
