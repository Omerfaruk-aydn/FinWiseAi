import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";
import { ActionPlanAgent, buildDeterministicActionPlanFallback } from "@/lib/ai/agents";
import {
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateNetCashflow,
  calculateSavingRate,
  calculateDebtLoadRatio,
  calculateTotalDebtMonthlyPayments,
} from "@/lib/finance/calculations";
import { z } from "zod";

const updateActionItemSchema = z.object({
  action: z.literal("UPDATE_STATUS").optional(),
  itemId: z.string().min(1),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"]),
});

const addActionItemSchema = z.object({
  action: z.literal("ADD_ITEM"),
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal("")).transform((value) => value?.trim() ? value : null),
  category: z.string().max(80).optional().or(z.literal("")).transform((value) => value?.trim() ? value : null),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"]).default("PENDING"),
  dueDate: z.string().datetime().optional().or(z.literal("")).transform((value) => value?.trim() ? value : null),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const plan = await prisma.actionPlan.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { items: { orderBy: { priority: "asc" } } },
    });

    return successResponse(plan);
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

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

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

    const categoryMap = new Map<string, number>();
    expenses.forEach((e: { category?: { name: string } | null; amount: number }) => {
      const key = e.category?.name ?? "Diğer";
      categoryMap.set(key, (categoryMap.get(key) ?? 0) + e.amount);
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, amount]) => ({ categoryName: name, amount, percent: monthlyExpenses > 0 ? (amount / monthlyExpenses) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount).slice(0, 5);

    const financialData = {
      monthlyIncome,
      monthlyExpenses,
      netCashflow,
      savingRate,
      debtLoadRatio,
      currency: user?.currency ?? "TRY",
      currentMonth: month,
      currentYear: year,
      topExpenseCategories: topCategories,
      debts: (debts as Array<{ id: string; title: string; type: string; remainingAmount: number; minimumPayment: number; interestRate: number }>).map((d) => ({ id: d.id, title: d.title, type: d.type, remainingAmount: d.remainingAmount, minimumPayment: d.minimumPayment, interestRate: d.interestRate })),
      goals: (goals as Array<{ id: string; title: string; targetAmount: number; currentAmount: number; deadline: Date | null }>).map((g) => ({ id: g.id, title: g.title, targetAmount: g.targetAmount, currentAmount: g.currentAmount, deadline: g.deadline?.toISOString().split("T")[0] ?? null, progressPercent: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0 })),
      subscriptions: (subscriptions as Array<{ id: string; title: string; amount: number; billingCycle: string }>).map((s) => ({ id: s.id, title: s.title, amount: s.amount, billingCycle: s.billingCycle, monthlyAmount: s.billingCycle === "MONTHLY" ? s.amount : s.amount / 12 })),
    };

    const agentInput = {
      userId: session.user.id,
      financialData,
    };

    const planOutput = await ActionPlanAgent(agentInput).catch(() =>
      buildDeterministicActionPlanFallback(agentInput)
    );

    // Veritabanına kaydet
    const actionPlan = await prisma.actionPlan.create({
      data: {
        userId: session.user.id,
        title: planOutput.title,
        weekStart,
        weekEnd,
        summary: planOutput.summary,
        items: {
          create: planOutput.items.map((item) => ({
            title: item.title,
            description: item.description,
            category: item.category,
            priority: item.priority,
            dueDate: item.dueInDays ? new Date(now.getTime() + item.dueInDays * 24 * 60 * 60 * 1000) : null,
          })),
        },
      },
      include: { items: true },
    });

    return successResponse(actionPlan, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    if (body?.action === "ADD_ITEM") {
      const parsed = addActionItemSchema.safeParse(body);
      if (!parsed.success) return validationErrorResponse(parsed.error);

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const plan =
        (await prisma.actionPlan.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          include: { items: { orderBy: { priority: "asc" } } },
        })) ??
        (await prisma.actionPlan.create({
          data: {
            userId: session.user.id,
            title: "Manuel Aksiyon Planı",
            summary: "Kullanıcı tarafından eklenen görevler.",
            weekStart,
            weekEnd,
          },
          include: { items: { orderBy: { priority: "asc" } } },
        }));

      const dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;

      await prisma.actionItem.create({
        data: {
          actionPlanId: plan.id,
          title: parsed.data.title,
          description: parsed.data.description,
          category: parsed.data.category,
          priority: parsed.data.priority,
          status: parsed.data.status,
          dueDate,
        },
      });

      const updatedPlan = await prisma.actionPlan.findUnique({
        where: { id: plan.id },
        include: { items: { orderBy: { priority: "asc" } } },
      });

      return successResponse(updatedPlan);
    }

    const parsed = updateActionItemSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const item = await prisma.actionItem.findFirst({
      where: {
        id: parsed.data.itemId,
        actionPlan: { userId: session.user.id },
      },
      select: { id: true },
    });

    if (!item) return unauthorizedResponse();

    const updatedItem = await prisma.actionItem.update({
      where: { id: parsed.data.itemId },
      data: { status: parsed.data.status },
    });

    return successResponse(updatedItem);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
