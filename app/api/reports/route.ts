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

    const reports = await prisma.report.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        title: true,
        type: true,
        periodStart: true,
        periodEnd: true,
        summary: true,
        pdfUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(reports);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
