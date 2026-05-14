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
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "12", 10), 1), 36);

    const history = await prisma.financialHealthScore.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return successResponse(history);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const [incomes, expenses, debts, goals, budgets] = await Promise.all([
      prisma.income.findMany({ where: { userId: session.user.id, date: { gte: start, lte: end } } }),
      prisma.expense.findMany({ where: { userId: session.user.id, date: { gte: start, lte: end } } }),
      prisma.debt.findMany({ where: { userId: session.user.id, status: "ACTIVE" } }),
      prisma.goal.findMany({ where: { userId: session.user.id, status: "ACTIVE" } }),
      prisma.budget.findFirst({
        where: { userId: session.user.id, month, year },
        include: { categories: true },
      }),
    ]);

    const monthlyIncome = calculateMonthlyIncome(incomes);
    const monthlyExpenses = calculateMonthlyExpenses(expenses);
    const totalDebtPayments = calculateTotalDebtMonthlyPayments(debts);

    const budgetCategories = budgets?.categories.map((bc: { plannedAmount: number; actualAmount: number }) => ({
      plannedAmount: bc.plannedAmount,
      actualAmount: bc.actualAmount,
    })) ?? [];

    const result = calculateFinancialHealthScore({
      monthlyIncome,
      monthlyExpenses,
      totalMonthlyDebtPayments: totalDebtPayments,
      totalSavings: 0,
      goals: goals.map((g: { currentAmount: number; targetAmount: number }) => ({ currentAmount: g.currentAmount, targetAmount: g.targetAmount })),
      budgetCategories,
    });

    const netCashflow = calculateNetCashflow(monthlyIncome, monthlyExpenses);
    const savingRateValue = calculateSavingRate(netCashflow, monthlyIncome);
    const debtLoadValue = calculateDebtLoadRatio(totalDebtPayments, monthlyIncome);

    const scoreRecord = await prisma.financialHealthScore.create({
      data: {
        userId: session.user.id,
        score: result.score,
        incomeExpenseRatio: result.incomeExpenseRatio,
        savingRate: savingRateValue,
        debtLoad: debtLoadValue,
        spendingDiscipline: result.spendingDiscipline,
        goalProgress: result.goalProgress,
        explanation: `${result.statusLabel} - Skor: ${result.score}/100`,
      },
    });

    return successResponse({ ...scoreRecord, ...result });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
