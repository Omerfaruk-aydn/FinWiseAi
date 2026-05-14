import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";

export async function GET(_req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const now = new Date();
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: date.getMonth() + 1, year: date.getFullYear() });
    }

    const trendData = await Promise.all(
      months.map(async ({ month, year }) => {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);

        const [incomes, expenses] = await Promise.all([
          prisma.income.aggregate({
            where: { userId: session.user.id, date: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
          prisma.expense.aggregate({
            where: { userId: session.user.id, date: { gte: start, lte: end } },
            _sum: { amount: true },
          }),
        ]);

        const totalIncome = incomes._sum.amount ?? 0;
        const totalExpenses = expenses._sum.amount ?? 0;

        return {
          month,
          year,
          label: new Date(year, month - 1, 1).toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
          totalIncome,
          totalExpenses,
          netCashflow: totalIncome - totalExpenses,
          savingRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
        };
      })
    );

    return successResponse(trendData);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
