import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { getRequiredAdminSession, getRequiredSession } from "@/lib/session";

function generateTemporaryPassword() {
  return `Fw-${crypto.randomBytes(6).toString("base64url")}9A`;
}

export async function POST(
  _req: NextRequest,
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
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!user) return notFoundResponse("Kullanıcı");

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        action: "USER_PASSWORD_RESET",
        targetType: "User",
        targetId: id,
        metadataJson: JSON.stringify({ email: user.email }),
      },
    });

    return successResponse({
      temporaryPassword,
      message: "Geçici parola oluşturuldu ve aktif oturumlar sonlandırıldı.",
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
