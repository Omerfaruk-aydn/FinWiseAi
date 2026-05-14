import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, internalErrorResponse } from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";

export async function GET(_req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const userId = session.user.id;
    const [
      user,
      categories,
      incomes,
      expenses,
      transactions,
      budgets,
      goals,
      debts,
      subscriptions,
      healthScores,
      conversations,
      analyses,
      actionPlans,
      reports,
      notifications,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          currency: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
        },
      }),
      prisma.category.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      prisma.income.findMany({ where: { userId }, orderBy: { date: "desc" } }),
      prisma.expense.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { date: "desc" },
      }),
      prisma.transaction.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { date: "desc" },
      }),
      prisma.budget.findMany({
        where: { userId },
        include: { categories: { include: { category: true } } },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),
      prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.debt.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.subscription.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.financialHealthScore.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.aIConversation.findMany({
        where: { userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.aIAnalysis.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.actionPlan.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.report.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      product: "FinWise AI",
      user,
      categories,
      incomes,
      expenses,
      transactions,
      budgets,
      goals,
      debts,
      subscriptions,
      healthScores,
      conversations,
      analyses,
      actionPlans,
      reports,
      notifications,
    };

    const fileName = `finwise-export-${new Date().toISOString().slice(0, 10)}.json`;

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
