import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  currency: z.enum(["TRY", "USD", "EUR", "GBP"]).optional(),
  city: z.string().optional(),
  occupation: z.string().optional(),
  incomeFrequency: z.enum(["MONTHLY", "WEEKLY", "YEARLY", "ONE_TIME"]).optional(),
  financialGoalType: z.enum(["EMERGENCY_FUND", "HOME", "CAR", "RETIREMENT", "PAY_OFF_DEBT", "TRAVEL", "EDUCATION", "OTHER"]).optional(),
  riskTolerance: z.enum(["CONSERVATIVE", "BALANCED", "AGGRESSIVE"]).optional(),
  hasDebt: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  budgetAlerts: z.boolean().optional(),
  actionPlanReminders: z.boolean().optional(),
  monthlyIncome: z.number().nonnegative().optional(),
  incomeSources: z.array(z.object({
    title: z.string(),
    amount: z.string(),
    category: z.string().optional(),
    frequency: z.enum(["MONTHLY", "WEEKLY", "YEARLY", "ONE_TIME"]).optional(),
  })).optional(),
  expenses: z.array(z.object({
    key: z.string(),
    label: z.string(),
    amount: z.string(),
  })).optional(),
  budgetLimits: z.array(z.object({
    key: z.string(),
    label: z.string(),
    amount: z.string(),
  })).optional(),
  debts: z.array(z.enum(["CREDIT_CARD", "LOAN", "MORTGAGE"])).optional(),
  debtDetails: z.array(z.object({
    title: z.string(),
    type: z.enum(["CREDIT_CARD", "LOAN", "MORTGAGE", "OTHER"]),
    totalAmount: z.string(),
    remainingAmount: z.string(),
    minimumPayment: z.string(),
    interestRate: z.string(),
    dueDay: z.string(),
  })).optional(),
  subscriptions: z.array(z.object({
    title: z.string(),
    amount: z.string(),
    billingCycle: z.enum(["MONTHLY", "YEARLY"]),
    nextBillingDay: z.string(),
    category: z.string(),
  })).optional(),
  primaryGoal: z.enum(["EMERGENCY_FUND", "HOME", "CAR", "RETIREMENT", "PAY_OFF_DEBT", "TRAVEL", "EDUCATION", "OTHER"]).optional(),
  goalTarget: z.number().nonnegative().optional(),
  goalCurrent: z.number().nonnegative().optional(),
  goalDeadline: z.string().optional(),
  goalPriority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  notificationPreferences: z.object({
    budgetAlerts: z.boolean(),
    weeklyReport: z.boolean(),
    aiSuggestions: z.boolean(),
    monthlyReview: z.boolean(),
  }).optional(),
});

const onboardingGoalTitles: Record<string, string> = {
  EMERGENCY_FUND: "Acil durum fonu",
  HOME: "Ev alma hedefi",
  CAR: "Araç alma hedefi",
  RETIREMENT: "Emeklilik birikimi",
  PAY_OFF_DEBT: "Borç kapatma hedefi",
  TRAVEL: "Seyahat hedefi",
  EDUCATION: "Eğitim hedefi",
  OTHER: "Finansal hedef",
};

const onboardingExpenseCategoryNames: Record<string, string> = {
  rent: "Kira",
  bills: "Faturalar",
  groceries: "Market",
  transport: "Ulaşım",
};

function normalizeCategoryName(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0131/g, "i")
    .replace(/\u011f/g, "g")
    .replace(/\u00fc/g, "u")
    .replace(/\u015f/g, "s")
    .replace(/\u00f6/g, "o")
    .replace(/\u00e7/g, "c")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

async function seedOnboardingFinancialData(
  userId: string,
  data: {
    monthlyIncome?: number;
    incomeSources?: Array<{ title: string; amount: string; category?: string; frequency?: "MONTHLY" | "WEEKLY" | "YEARLY" | "ONE_TIME" }>;
    expenses?: Array<{ key: string; label: string; amount: string }>;
    budgetLimits?: Array<{ key: string; label: string; amount: string }>;
    debtDetails?: Array<{
      title: string;
      type: "CREDIT_CARD" | "LOAN" | "MORTGAGE" | "OTHER";
      totalAmount: string;
      remainingAmount: string;
      minimumPayment: string;
      interestRate: string;
      dueDay: string;
    }>;
    subscriptions?: Array<{
      title: string;
      amount: string;
      billingCycle: "MONTHLY" | "YEARLY";
      nextBillingDay: string;
      category: string;
    }>;
    primaryGoal?: string;
    goalTarget?: number;
    goalCurrent?: number;
    goalDeadline?: string;
    goalPriority?: "HIGH" | "MEDIUM" | "LOW";
  }
) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const [incomeCount, expenseCount, transactionCount, goalCount, debtCount, subscriptionCount, budgetCount, categories] = await Promise.all([
    prisma.income.count({ where: { userId } }),
    prisma.expense.count({ where: { userId } }),
    prisma.transaction.count({ where: { userId } }),
    prisma.goal.count({ where: { userId } }),
    prisma.debt.count({ where: { userId } }),
    prisma.subscription.count({ where: { userId } }),
    prisma.budget.count({ where: { userId, month: currentMonth, year: currentYear } }),
    prisma.category.findMany({
      where: {
        type: "EXPENSE",
        OR: [{ isDefault: true }, { userId }],
      },
      select: { id: true, name: true },
    }),
  ]);

  const categoryIdByName = new Map(
    categories.map((category) => [
      normalizeCategoryName(category.name),
      category.id,
    ])
  );

  const createOperations: Prisma.PrismaPromise<unknown>[] = [];

  if (incomeCount === 0) {
    const incomeSources =
      data.incomeSources
        ?.map((source) => ({
          title: source.title.trim(),
          amount: Number(source.amount),
          category: source.category?.trim() || source.title.trim() || "Gelir",
          frequency: source.frequency ?? "MONTHLY",
        }))
        .filter((source) => source.title && Number.isFinite(source.amount) && source.amount > 0) ?? [];

    if (incomeSources.length > 0) {
      for (const source of incomeSources) {
        createOperations.push(
          prisma.income.create({
            data: {
              userId,
              title: source.title,
              amount: source.amount,
              category: source.category,
              frequency: source.frequency,
              date: now,
              note: "Onboarding sırasında oluşturuldu.",
            },
          })
        );
        if (transactionCount === 0) {
          createOperations.push(
            prisma.transaction.create({
              data: {
                userId,
                type: "INCOME",
                title: source.title,
                amount: source.amount,
                date: now,
                source: "onboarding",
                note: "Onboarding sırasında oluşturuldu.",
              },
            })
          );
        }
      }
    } else if (data.monthlyIncome && data.monthlyIncome > 0) {
      createOperations.push(
        prisma.income.create({
          data: {
            userId,
            title: "Aylık gelir",
            amount: data.monthlyIncome,
            category: "Maaş",
            frequency: "MONTHLY",
            date: now,
            note: "Onboarding sırasında oluşturuldu.",
          },
        })
      );
      if (transactionCount === 0) {
        createOperations.push(
          prisma.transaction.create({
            data: {
              userId,
              type: "INCOME",
              title: "Aylık gelir",
              amount: data.monthlyIncome,
              date: now,
              source: "onboarding",
              note: "Onboarding sırasında oluşturuldu.",
            },
          })
        );
      }
    }
  }

  if (expenseCount === 0 && data.expenses?.length) {
    for (const expense of data.expenses) {
      const amount = Number(expense.amount);
      if (!Number.isFinite(amount) || amount <= 0) continue;

      const categoryName = onboardingExpenseCategoryNames[expense.key] ?? "Diğer";
      const categoryId = categoryIdByName.get(normalizeCategoryName(categoryName));

      createOperations.push(
        prisma.expense.create({
          data: {
            userId,
            title: expense.label,
            amount,
            categoryId,
            paymentMethod: "CARD",
            isRecurring: true,
            date: now,
            note: "Onboarding sırasında oluşturuldu.",
          },
        })
      );
      if (transactionCount === 0) {
        createOperations.push(
          prisma.transaction.create({
            data: {
              userId,
              type: "EXPENSE",
              title: expense.label,
              amount,
              categoryId,
              date: now,
              source: "onboarding",
              note: "Onboarding sırasında oluşturuldu.",
            },
          })
        );
      }
    }
  }

  if (
    goalCount === 0 &&
    data.primaryGoal &&
    data.goalTarget &&
    data.goalTarget > 0
  ) {
    const currentAmount = Math.min(data.goalCurrent ?? 0, data.goalTarget);
    createOperations.push(
      prisma.goal.create({
        data: {
          userId,
          title: onboardingGoalTitles[data.primaryGoal] ?? "Finansal hedef",
          targetAmount: data.goalTarget,
          currentAmount,
          deadline: data.goalDeadline ? new Date(data.goalDeadline) : undefined,
          priority: data.goalPriority ?? "HIGH",
          status: "ACTIVE",
          note: "Onboarding sırasında oluşturuldu.",
        },
      })
    );
  }

  if (debtCount === 0 && data.debtDetails?.length) {
    for (const debt of data.debtDetails) {
      const totalAmount = Number(debt.totalAmount);
      const remainingAmount = Number(debt.remainingAmount);
      const minimumPayment = Number(debt.minimumPayment);
      const interestRate = Number(debt.interestRate) || 0;
      const dueDay = Number(debt.dueDay);

      if (
        !debt.title.trim() ||
        !Number.isFinite(totalAmount) ||
        !Number.isFinite(remainingAmount) ||
        !Number.isFinite(minimumPayment) ||
        totalAmount <= 0 ||
        remainingAmount < 0 ||
        minimumPayment <= 0 ||
        remainingAmount > totalAmount
      ) {
        continue;
      }

      createOperations.push(
        prisma.debt.create({
          data: {
            userId,
            title: debt.title.trim(),
            type: debt.type,
            totalAmount,
            remainingAmount,
            minimumPayment,
            interestRate,
            dueDay: Number.isInteger(dueDay) && dueDay >= 1 && dueDay <= 31 ? dueDay : undefined,
            status: "ACTIVE",
            note: "Onboarding sırasında oluşturuldu.",
          },
        })
      );
    }
  }

  if (subscriptionCount === 0 && data.subscriptions?.length) {
    for (const subscription of data.subscriptions) {
      const amount = Number(subscription.amount);
      const day = Number(subscription.nextBillingDay);
      if (!subscription.title.trim() || !Number.isFinite(amount) || amount <= 0) continue;

      const nextBillingDate = new Date(currentYear, currentMonth - 1, Math.min(Math.max(day || 1, 1), 28));
      if (nextBillingDate < now) nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      createOperations.push(
        prisma.subscription.create({
          data: {
            userId,
            title: subscription.title.trim(),
            amount,
            billingCycle: subscription.billingCycle,
            nextBillingDate,
            category: subscription.category.trim() || "Diğer",
            status: "ACTIVE",
            note: "Onboarding sırasında oluşturuldu.",
          },
        })
      );
    }
  }

  if (budgetCount === 0 && data.budgetLimits?.length) {
    const categoryLimits = data.budgetLimits
      .map((limit) => {
        const amount = Number(limit.amount);
        const categoryName = onboardingExpenseCategoryNames[limit.key] ?? limit.label;
        const categoryId = categoryIdByName.get(normalizeCategoryName(categoryName));
        return categoryId && Number.isFinite(amount) && amount > 0
          ? { categoryId, plannedAmount: amount }
          : null;
      })
      .filter((limit): limit is { categoryId: string; plannedAmount: number } => Boolean(limit));

    if (categoryLimits.length > 0) {
      const plannedExpense = categoryLimits.reduce((sum, limit) => sum + limit.plannedAmount, 0);
      const totalIncome = data.monthlyIncome ?? 0;
      createOperations.push(
        prisma.budget.create({
          data: {
            userId,
            month: currentMonth,
            year: currentYear,
            totalIncome,
            plannedExpense,
            plannedSaving: Math.max(totalIncome - plannedExpense, 0),
            categories: {
              create: categoryLimits,
            },
          },
        })
      );
    }
  }

  if (createOperations.length > 0) {
    await prisma.$transaction(createOperations);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const {
      name,
      currency,
      monthlyIncome,
      incomeSources,
      expenses,
      budgetLimits,
      debts,
      debtDetails,
      subscriptions,
      primaryGoal,
      goalTarget,
      goalCurrent,
      goalDeadline,
      goalPriority,
      notificationPreferences,
      ...profileInput
    } = parsed.data;

    const profileData = {
      ...profileInput,
      ...(primaryGoal ? { financialGoalType: primaryGoal } : {}),
      ...(debts ? { hasDebt: debts.length > 0 } : {}),
      ...(notificationPreferences
        ? {
            budgetAlerts: notificationPreferences.budgetAlerts,
            weeklyDigest: notificationPreferences.weeklyReport,
            actionPlanReminders:
              notificationPreferences.aiSuggestions ||
              notificationPreferences.monthlyReview,
          }
        : {}),
    };

    await Promise.all([
      name || currency
        ? prisma.user.update({
            where: { id: session.user.id },
            data: { ...(name && { name }), ...(currency && { currency }) },
          })
        : null,
      Object.keys(profileData).length > 0
        ? prisma.userProfile.upsert({
            where: { userId: session.user.id },
            create: { userId: session.user.id, ...profileData },
            update: profileData,
          })
        : null,
    ]);

    if (parsed.data.onboardingCompleted) {
      await seedOnboardingFinancialData(session.user.id, {
        monthlyIncome,
        incomeSources,
        expenses,
        budgetLimits,
        debtDetails,
        subscriptions,
        primaryGoal,
        goalTarget,
        goalCurrent,
        goalDeadline,
        goalPriority,
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        currency: true,
        sessionVersion: true,
        lastLoginAt: true,
        profile: true,
      },
    });

    return successResponse(updated);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
