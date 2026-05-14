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
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const agentType = searchParams.get("type");
    const isError = searchParams.get("isError");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (agentType) where.type = agentType;
    if (isError !== null) where.isError = isError === "true";
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const [logs, total] = await Promise.all([
      prisma.aIAnalysis.findMany({
        where,
        select: {
          id: true,
          userId: true,
          type: true,
          isError: true,
          errorMessage: true,
          durationMs: true,
          score: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.aIAnalysis.count({ where }),
    ]);

    return successResponse(logs, { total, page, limit, hasMore: skip + limit < total });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
