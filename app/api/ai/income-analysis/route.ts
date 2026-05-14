import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";
import { IncomeAnalysisAgent } from "@/lib/ai/agents";
import { calculateMonthlyIncome } from "@/lib/finance/calculations";

export async function POST(_req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    const previousMonthDate = new Date(currentYear, currentMonth - 2, 1);
    const previousMonthStart = new Date(previousMonthDate.getFullYear(), previousMonthDate.getMonth(), 1);
    const previousMonthEnd = new Date(previousMonthDate.getFullYear(), previousMonthDate.getMonth() + 1, 0, 23, 59, 59);

    const [currentMonthIncomes, previousMonthIncomes, user] = await Promise.all([
      prisma.income.findMany({
        where: { userId: session.user.id, date: { gte: currentMonthStart, lte: currentMonthEnd } },
        orderBy: { date: "desc" },
      }),
      prisma.income.findMany({
        where: { userId: session.user.id, date: { gte: previousMonthStart, lte: previousMonthEnd } },
      }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { currency: true } }),
    ]);

    const monthlyIncome = calculateMonthlyIncome(currentMonthIncomes);
    const previousMonthlyIncome = calculateMonthlyIncome(previousMonthIncomes);
    const recurringIncome = currentMonthIncomes
      .filter((income) => income.frequency !== "ONE_TIME")
      .reduce((acc, income) => acc + income.amount, 0);
    const oneTimeIncome = currentMonthIncomes
      .filter((income) => income.frequency === "ONE_TIME")
      .reduce((acc, income) => acc + income.amount, 0);
    const averageMonthlyIncome = [monthlyIncome, previousMonthlyIncome].filter((value) => value > 0);
    const monthlyGrowthRate =
      previousMonthlyIncome > 0
        ? ((monthlyIncome - previousMonthlyIncome) / previousMonthlyIncome) * 100
        : 0;

    const sourceMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();

    currentMonthIncomes.forEach((income) => {
      const sourceKey = income.title.trim() || "Gelir";
      sourceMap.set(sourceKey, (sourceMap.get(sourceKey) ?? 0) + income.amount);

      const categoryKey = income.category.trim() || "Diğer";
      categoryMap.set(categoryKey, (categoryMap.get(categoryKey) ?? 0) + income.amount);
    });

    const topIncomeSources = Array.from(sourceMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percent: monthlyIncome > 0 ? (amount / monthlyIncome) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const incomeByCategory = Array.from(categoryMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percent: monthlyIncome > 0 ? (amount / monthlyIncome) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    const topIncomeShare = topIncomeSources[0]?.percent ?? 0;

    const recentIncomeEntries = currentMonthIncomes.slice(0, 8).map((income) => ({
      title: income.title,
      amount: income.amount,
      category: income.category,
      frequency: income.frequency,
      date: income.date.toISOString().split("T")[0],
    }));

    const result = await IncomeAnalysisAgent({
      currency: user?.currency ?? "TRY",
      currentMonth,
      currentYear,
      monthlyIncome,
      recurringIncome,
      oneTimeIncome,
      averageMonthlyIncome: averageMonthlyIncome.length > 0 ? averageMonthlyIncome.reduce((a, b) => a + b, 0) / averageMonthlyIncome.length : 0,
      monthlyGrowthRate,
      topIncomeShare,
      topIncomeSources,
      incomeByCategory,
      recentIncomeEntries,
    });

    return successResponse(result);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
