import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";
import { ReportAgent } from "@/lib/ai/agents";
import {
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateNetCashflow,
  calculateSavingRate,
  calculateDebtLoadRatio,
  calculateTotalDebtMonthlyPayments,
} from "@/lib/finance/calculations";

const reportSchema = z.object({
  type: z.enum(["WEEKLY", "MONTHLY"]),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2020).max(2100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { type } = parsed.data;
    const now = new Date();
    const month = parsed.data.month ?? now.getMonth() + 1;
    const year = parsed.data.year ?? now.getFullYear();

    let periodStart: Date;
    let periodEnd: Date;

    if (type === "WEEKLY") {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
      periodEnd = now;
    } else {
      periodStart = new Date(year, month - 1, 1);
      periodEnd = new Date(year, month, 0, 23, 59, 59);
    }

    const [incomes, expenses, debts, goals, subscriptions, user] = await Promise.all([
      prisma.income.findMany({ where: { userId: session.user.id, date: { gte: periodStart, lte: periodEnd } } }),
      prisma.expense.findMany({
        where: { userId: session.user.id, date: { gte: periodStart, lte: periodEnd } },
        include: { category: { select: { name: true } } },
      }),
      prisma.debt.findMany({ where: { userId: session.user.id, status: "ACTIVE" } }),
      prisma.goal.findMany({ where: { userId: session.user.id, status: "ACTIVE" } }),
      prisma.subscription.findMany({ where: { userId: session.user.id, status: "ACTIVE" } }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { currency: true } }),
    ]);

    const totalIncome = calculateMonthlyIncome(incomes);
    const totalExpenses = calculateMonthlyExpenses(expenses);
    const netCashflow = calculateNetCashflow(totalIncome, totalExpenses);
    const savingRate = calculateSavingRate(netCashflow, totalIncome);
    const totalDebtPayments = calculateTotalDebtMonthlyPayments(debts);
    const debtLoadRatio = calculateDebtLoadRatio(totalDebtPayments, totalIncome);

    const categoryMap = new Map<string, number>();
    expenses.forEach((e: { amount: number; category?: { name: string } | null }) => {
      const key = e.category?.name ?? "Diğer";
      categoryMap.set(key, (categoryMap.get(key) ?? 0) + e.amount);
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, amount]) => ({ categoryName: name, amount, percent: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount).slice(0, 5);

    const reportOutput = await ReportAgent(
      {
        userId: session.user.id,
        financialData: {
          monthlyIncome: totalIncome, monthlyExpenses: totalExpenses,
          netCashflow, savingRate, debtLoadRatio,
          currency: user?.currency ?? "TRY",
          currentMonth: month, currentYear: year,
          topExpenseCategories: topCategories,
          debts: debts.map((d: { id: string; title: string; type: string; remainingAmount: number; minimumPayment: number; interestRate: number }) => ({ id: d.id, title: d.title, type: d.type, remainingAmount: d.remainingAmount, minimumPayment: d.minimumPayment, interestRate: d.interestRate })),
          goals: goals.map((g: { id: string; title: string; targetAmount: number; currentAmount: number; deadline?: Date | null }) => ({ id: g.id, title: g.title, targetAmount: g.targetAmount, currentAmount: g.currentAmount, deadline: g.deadline?.toISOString().split("T")[0] ?? null, progressPercent: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0 })),
          subscriptions: subscriptions.map((s: { id: string; title: string; amount: number; billingCycle: string }) => ({ id: s.id, title: s.title, amount: s.amount, billingCycle: s.billingCycle, monthlyAmount: s.billingCycle === "MONTHLY" ? s.amount : s.amount / 12 })),
        },
      },
      type,
      { totalIncome, totalExpenses, netCashflow, savingRate, topCategories: topCategories.map((c) => ({ name: c.categoryName, amount: c.amount, percent: c.percent })) }
    );

    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        title: reportOutput.title,
        type,
        periodStart,
        periodEnd,
        summary: reportOutput.summary,
        contentJson: JSON.stringify(reportOutput),
      },
    });

    await prisma.report.update({
      where: { id: report.id },
      data: {
        pdfUrl: `/api/reports/${report.id}/pdf`,
      },
    });
    
    report.pdfUrl = `/api/reports/${report.id}/pdf`;

    return successResponse({ ...report, content: reportOutput }, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
