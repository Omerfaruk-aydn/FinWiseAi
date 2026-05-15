import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredAdminSession } from "@/lib/session";

function formatAdminDate(date: Date) {
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function initials(nameOrEmail: string) {
  const source = nameOrEmail.trim();
  const namePart = source.includes("@") ? source.split("@")[0] : source;
  return namePart
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || "U";
}

export async function GET(req: NextRequest) {
  try {
    const session = await getRequiredAdminSession();
    if (!session) {
      const baseSession = await (await import("@/lib/session")).getRequiredSession();
      if (!baseSession) return unauthorizedResponse();
      return forbiddenResponse();
    }

    const now = new Date();
    const { searchParams } = new URL(req.url);
    const periodParam = parseInt(searchParams.get("period") ?? "30", 10);
    const period = [7, 30, 90].includes(periodParam) ? periodParam : 30;
    const periodStart = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      newUsersThisMonth,
      activeUsers,
      totalTransactions,
      totalAIRequests,
      totalReports,
      avgHealthScore,
      topAgents,
      recentUsers,
      recentReports,
      recentAnalyses,
      recentErrors,
      periodAIRequests,
      periodAISuccess,
      periodAIErrors,
      avgDuration,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "USER", createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { role: "USER", updatedAt: { gte: thirtyDaysAgo } } }),
      prisma.transaction.count(),
      prisma.aIAnalysis.count(),
      prisma.report.count(),
      prisma.financialHealthScore.aggregate({ _avg: { score: true } }),
      prisma.aIAnalysis.groupBy({
        by: ["type"],
        _count: { type: true },
        orderBy: { _count: { type: "desc" } },
        take: 6,
      }),
      prisma.user.findMany({
        where: { role: "USER" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      prisma.report.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.aIAnalysis.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          type: true,
          isError: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.aIAnalysis.findMany({
        where: { isError: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          type: true,
          isError: true,
          errorMessage: true,
          durationMs: true,
          createdAt: true,
        },
      }),
      prisma.aIAnalysis.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.aIAnalysis.count({ where: { createdAt: { gte: periodStart }, isError: false } }),
      prisma.aIAnalysis.count({ where: { createdAt: { gte: periodStart }, isError: true } }),
      prisma.aIAnalysis.aggregate({
        where: { createdAt: { gte: periodStart } },
        _avg: { durationMs: true },
      }),
    ]);

    const userTrend = await Promise.all(
      Array.from({ length: 8 }, (_, index) => {
        const daysBack = Math.round(((7 - index) * period) / 7);
        const date = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        return date;
      }).map(async (date) => ({
        name: date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
        value: await prisma.user.count({
          where: { role: "USER", createdAt: { lte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59) } },
        }),
      }))
    );

    const agentTotal = topAgents.reduce((sum, agent) => sum + agent._count.type, 0);
    const agentColors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#64748B"];
    const agentDistribution = topAgents.map((agent, index) => ({
      name: agent.type,
      value: agentTotal > 0 ? Math.round((agent._count.type / agentTotal) * 100) : 0,
      count: agent._count.type,
      color: agentColors[index % agentColors.length],
    }));

    const activities = [
      ...recentUsers.map((user) => ({
        id: `user-${user.id}`,
        user: user.email,
        action: "kayıt oldu",
        time: formatAdminDate(user.createdAt),
        avatar: initials(user.name ?? user.email),
        bg: "bg-green-500",
        createdAt: user.createdAt,
      })),
      ...recentReports.map((report) => ({
        id: `report-${report.id}`,
        user: report.user?.email ?? "bilinmeyen kullanıcı",
        action: "rapor oluşturdu",
        time: formatAdminDate(report.createdAt),
        avatar: initials(report.user?.name ?? report.user?.email ?? "RU"),
        bg: "bg-purple-500",
        createdAt: report.createdAt,
      })),
      ...recentAnalyses.map((analysis) => ({
        id: `ai-${analysis.id}`,
        user: analysis.user?.email ?? "bilinmeyen kullanıcı",
        action: analysis.isError ? `${analysis.type} hatası aldı` : `${analysis.type} analizi aldı`,
        time: formatAdminDate(analysis.createdAt),
        avatar: initials(analysis.user?.name ?? analysis.user?.email ?? "AI"),
        bg: analysis.isError ? "bg-red-500" : "bg-blue-500",
        createdAt: analysis.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map(({ createdAt: _createdAt, ...activity }) => activity);

    const successRate = periodAIRequests > 0 ? Math.round((periodAISuccess / periodAIRequests) * 10000) / 100 : 100;
    const errorRate = periodAIRequests > 0 ? Math.round((periodAIErrors / periodAIRequests) * 10000) / 100 : 0;

    return successResponse({
      totalUsers,
      newUsersThisMonth,
      activeUsers,
      totalTransactions,
      totalAIRequests,
      totalReports,
      avgHealthScore: Math.round((avgHealthScore._avg.score ?? 0) * 10) / 10,
      period,
      userTrend,
      agentDistribution,
      recentActivities: activities,
      errorLogs: recentErrors.map((error) => ({
        id: error.id,
        time: formatAdminDate(error.createdAt),
        agent: error.type,
        status: error.isError ? "Hata" : "Uyari",
        statusColor: error.isError ? "text-red-600 bg-red-50" : "text-orange-600 bg-orange-50",
        desc: error.errorMessage ?? (error.durationMs && error.durationMs > 5000 ? "Yüksek yanıt süresi tespit edildi." : "Detay mesajı yok."),
      })),
      systemHealth: {
        apiUptime: Math.round(Math.max(0, 100 - errorRate) * 100) / 100,
        aiSuccessRate: successRate,
        avgResponseTime: Math.round(avgDuration._avg.durationMs ?? 0),
        errorRate,
      },
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
