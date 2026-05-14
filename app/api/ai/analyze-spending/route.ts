import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";
import { SpendingAnalysisAgent } from "@/lib/ai/agents";
import {
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateNetCashflow,
  calculateSavingRate,
  calculateDebtLoadRatio,
  calculateTotalDebtMonthlyPayments,
} from "@/lib/finance/calculations";

export async function POST(_req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const [incomes, expenses, debts, goals, subscriptions, user] = await Promise.all([
      prisma.income.findMany({ where: { userId: session.user.id, date: { gte: start, lte: end } } }),
      prisma.expense.findMany({
        where: { userId: session.user.id, date: { gte: start, lte: end } },
        include: { category: { select: { name: true } } },
      }),
      prisma.debt.findMany({ where: { userId: session.user.id, status: "ACTIVE" } }),
      prisma.goal.findMany({ where: { userId: session.user.id, status: "ACTIVE" } }),
      prisma.subscription.findMany({ where: { userId: session.user.id, status: "ACTIVE" } }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { currency: true } }),
    ]);

    const monthlyIncome = calculateMonthlyIncome(incomes);
    const monthlyExpenses = calculateMonthlyExpenses(expenses);
    const netCashflow = calculateNetCashflow(monthlyIncome, monthlyExpenses);
    const savingRate = calculateSavingRate(netCashflow, monthlyIncome);
    const totalDebtPayments = calculateTotalDebtMonthlyPayments(debts);
    const debtLoadRatio = calculateDebtLoadRatio(totalDebtPayments, monthlyIncome);

    const categoryMap = new Map<string, { name: string; amount: number }>();
    expenses.forEach((e: { amount: number; category?: { name: string } | null }) => {
      const key = e.category?.name ?? "Diğer";
      const existing = categoryMap.get(key);
      if (existing) existing.amount += e.amount;
      else categoryMap.set(key, { name: key, amount: e.amount });
    });

    const topCategories = Array.from(categoryMap.values())
      .map((c) => ({ categoryName: c.name, amount: c.amount, percent: monthlyExpenses > 0 ? (c.amount / monthlyExpenses) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const result = await SpendingAnalysisAgent({
      userId: session.user.id,
      financialData: {
        monthlyIncome, monthlyExpenses, netCashflow, savingRate, debtLoadRatio,
        currency: user?.currency ?? "TRY",
        currentMonth: month, currentYear: year,
        topExpenseCategories: topCategories,
        debts: debts.map((d: { id: string; title: string; type: string; remainingAmount: number; minimumPayment: number; interestRate: number }) => ({ id: d.id, title: d.title, type: d.type, remainingAmount: d.remainingAmount, minimumPayment: d.minimumPayment, interestRate: d.interestRate })),
        goals: goals.map((g: { id: string; title: string; targetAmount: number; currentAmount: number; deadline?: Date | null }) => ({ id: g.id, title: g.title, targetAmount: g.targetAmount, currentAmount: g.currentAmount, deadline: g.deadline?.toISOString().split("T")[0] ?? null, progressPercent: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0 })),
        subscriptions: subscriptions.map((s: { id: string; title: string; amount: number; billingCycle: string }) => ({ id: s.id, title: s.title, amount: s.amount, billingCycle: s.billingCycle, monthlyAmount: s.billingCycle === "MONTHLY" ? s.amount : s.amount / 12 })),
      },
    });

    return successResponse(result);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
