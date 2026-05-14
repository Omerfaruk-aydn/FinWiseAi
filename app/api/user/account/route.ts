import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";

const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre zorunludur."),
  confirmation: z.literal("HESABIMI SIL"),
});

export async function DELETE(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) return unauthorizedResponse();

    const validPassword = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!validPassword) {
      return errorResponse("INVALID_PASSWORD", "Mevcut şifre hatalı.", 400);
    }

    await prisma.$transaction([
      prisma.aIMessageFeedback.deleteMany({ where: { userId: session.user.id } }),
      prisma.category.deleteMany({ where: { userId: session.user.id } }),
      prisma.user.delete({ where: { id: session.user.id } }),
    ]);

    return successResponse({ deleted: true });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
