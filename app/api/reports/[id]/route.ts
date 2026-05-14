import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;

    const report = await prisma.report.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!report) return notFoundResponse("Rapor");

    const content = report.contentJson ? JSON.parse(report.contentJson) : null;

    return successResponse({ ...report, content });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
