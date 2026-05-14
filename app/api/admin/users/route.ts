import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
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
    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const created = searchParams.get("created");
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (role === "USER" || role === "ADMIN") where.role = role;
    if (status === "ACTIVE") where.isActive = true;
    if (status === "INACTIVE") where.isActive = false;
    if (created === "THIS_MONTH") {
      const now = new Date();
      where.createdAt = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    }
    if (created === "LAST_30") {
      where.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          currency: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          profile: {
            select: { onboardingCompleted: true, city: true, occupation: true },
          },
          _count: {
            select: { transactions: true, reports: true, conversations: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const [totalUsers, activeUsers, adminCount, newThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return successResponse(users, {
      total,
      page,
      limit,
      hasMore: skip + limit < total,
      stats: { totalUsers, activeUsers, adminCount, newThisMonth },
    } as any);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
