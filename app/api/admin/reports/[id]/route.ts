import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as { action?: string };
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return notFoundResponse("Rapor");

    const action = body.action === "regenerate" ? "REPORT_REGENERATED" : "REPORT_PDF_RETRIED";
    const pdfUrl =
      body.action === "regenerate" || body.action === "retry-pdf"
        ? `/api/reports/${id}/pdf`
        : report.pdfUrl;

    const updated = await prisma.report.update({
      where: { id },
      data: { pdfUrl },
      include: { user: { select: { name: true, email: true } } },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: auth.session.user.id,
        action,
        targetType: "Report",
        targetId: id,
        metadataJson: JSON.stringify({ action: body.action ?? "retry-pdf" }),
      },
    });

    return successResponse(updated);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
