import { prisma } from "@/lib/prisma";
import {
  internalErrorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";

export async function POST() {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const budgets = await prisma.budget.findMany({
      where: { userId: session.user.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 2,
      include: { categories: { include: { category: true } } },
    });

    const [current, previous] = budgets;
    if (!current || !previous) return notFoundResponse("Karşılaştırılacak bütçe");

    const diff = {
      totalIncome: current.totalIncome - previous.totalIncome,
      plannedExpense: current.plannedExpense - previous.plannedExpense,
      plannedSaving: current.plannedSaving - previous.plannedSaving,
    };

    const periodStart = new Date(current.year, current.month - 1, 1);
    const periodEnd = new Date(current.year, current.month, 0, 23, 59, 59);
    const summary = `Bu ay planlanan gelir ${diff.totalIncome >= 0 ? "arttı" : "azaldı"}, planlanan gider ${diff.plannedExpense >= 0 ? "arttı" : "azaldı"}, planlanan tasarruf ${diff.plannedSaving >= 0 ? "arttı" : "azaldı"}.`;

    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        title: `${current.month}/${current.year} Bütçe Karşılaştırması`,
        type: "MONTHLY",
        periodStart,
        periodEnd,
        summary,
        contentJson: JSON.stringify({ current, previous, diff }),
      },
    });

    return successResponse(report, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
