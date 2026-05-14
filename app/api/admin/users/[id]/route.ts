import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredAdminSession, getRequiredSession } from "@/lib/session";

const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().min(2).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequiredAdminSession();
    if (!session) {
      const baseSession = await getRequiredSession();
      if (!baseSession) return unauthorizedResponse();
      return forbiddenResponse();
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return notFoundResponse("Kullanıcı");

    const updated = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: { id: true, name: true, email: true, isActive: true },
    });

    // Admin eylem logu
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: parsed.data.isActive !== undefined ? (parsed.data.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED") : "USER_UPDATED",
        targetType: "User",
        targetId: id,
        metadataJson: JSON.stringify(parsed.data),
      },
    });

    return successResponse(updated);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
