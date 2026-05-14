import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";
import { sendSecurityNotificationEmail } from "@/lib/email";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut sifre zorunludur."),
  newPassword: z
    .string()
    .min(8, "Sifre en az 8 karakter olmali.")
    .regex(/[A-Z]/, "Sifre en az bir buyuk harf icermelidir.")
    .regex(/[0-9]/, "Sifre en az bir rakam icermelidir."),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true, email: true },
    });

    if (!user) return unauthorizedResponse();

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return errorResponse("INVALID_PASSWORD", "Mevcut sifre hatali.", 400);
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    });

    await sendSecurityNotificationEmail(
      user.email,
      "Sifre degistirildi",
      "Hesabinizin parolasi basariyla degistirildi. Bu islemi siz yapmadiysaniz hemen destek ile iletisim kurun."
    );

    return successResponse({ message: "Sifre basariyla degistirildi." });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
