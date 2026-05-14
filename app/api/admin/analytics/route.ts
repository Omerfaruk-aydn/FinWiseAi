import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredAdminSession, getRequiredSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getRequiredAdminSession();
    if (!session) {
      const baseSession = await getRequiredSession();
      if (!baseSession) return unauthorizedResponse();
      return forbiddenResponse();
    }

    const { searchParams } = new URL(req.url);
    const periodParam = parseInt(searchParams.get("period") ?? "30");
    const period = [7, 30, 90].includes(periodParam) ? periodParam : 30;

    const now = new Date();

    // User trend: monthly for the last 12 months (period-independent, always useful context)
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: date.getMonth() + 1, year: date.getFullYear(), date });
    }

    const userTrend = await Promise.all(
      months.map(async ({ month, year, date }) => {
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        const count = await prisma.user.count({
          where: { role: "USER", createdAt: { gte: start, lte: end } },
        });

        return {
          month,
          year,
          label: date.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
          newUsers: count,
        };
      })
    );

    // AI trend: one entry per day for the selected period
    const periodStart = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
    const aiTrend: Array<{ date: string; requests: number }> = [];

    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const count = await prisma.aIAnalysis.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      });

      aiTrend.push({
        date: d.toLocaleDateString("tr-TR", { month: "short", day: "numeric" }),
        requests: count,
      });
    }

    const topAgents = await prisma.aIAnalysis.groupBy({
      by: ["type"],
      _count: { type: true },
      orderBy: { _count: { type: "desc" } },
      take: 9,
    });

    const [periodRequests, activeUsers, successCount, totalCount] = await Promise.all([
      prisma.aIAnalysis.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.user.count({ where: { role: "USER", createdAt: { gte: periodStart } } }),
      prisma.aIAnalysis.count({ where: { createdAt: { gte: periodStart }, isError: false } }),
      prisma.aIAnalysis.count({ where: { createdAt: { gte: periodStart } } }),
    ]);

    const avgDurationResult = await prisma.aIAnalysis.aggregate({
      where: { createdAt: { gte: periodStart } },
      _avg: { durationMs: true },
    });

    return successResponse({
      period,
      userTrend,
      aiTrend,
      topAgents: topAgents.map((a: { type: string; _count: { type: number } }) => ({ type: a.type, count: a._count.type })),
      periodRequests,
      activeUsers,
      successRate: totalCount > 0 ? Math.round((successCount / totalCount) * 1000) / 10 : 100,
      avgDurationMs: Math.round(avgDurationResult._avg.durationMs ?? 0),
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
