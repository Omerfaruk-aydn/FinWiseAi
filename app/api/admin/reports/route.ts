import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  forbiddenResponse,
  internalErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { getRequiredAdminSession, getRequiredSession } from "@/lib/session";

async function requireAdmin() {
  const session = await getRequiredAdminSession();
  if (session) return { session };
  const baseSession = await getRequiredSession();
  if (!baseSession) return { response: unauthorizedResponse() };
  return { response: forbiddenResponse() };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "10", 10), 1), 100);
    const search = searchParams.get("search")?.trim();
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (type === "WEEKLY" || type === "MONTHLY") where.type = type;
    if (status === "READY") where.pdfUrl = { not: null };
    if (status === "MISSING_PDF") where.pdfUrl = null;
    if (start || end) {
      where.createdAt = {
        ...(start ? { gte: new Date(start) } : {}),
        ...(end ? { lte: new Date(`${end}T23:59:59.999Z`) } : {}),
      };
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [reports, total, totalReports, thisMonth, pdfReady, pdfMissing] =
      await Promise.all([
        prisma.report.findMany({
          where,
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.report.count({ where }),
        prisma.report.count(),
        prisma.report.count({ where: { createdAt: { gte: monthStart } } }),
        prisma.report.count({ where: { pdfUrl: { not: null } } }),
        prisma.report.count({ where: { pdfUrl: null } }),
      ]);

    return successResponse(
      {
        reports,
        stats: { totalReports, thisMonth, pdfReady, pdfMissing },
      },
      { total, page, limit, hasMore: skip + limit < total }
    );
  } catch (error) {
    return internalErrorResponse(error);
  }
}
