import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Parola en az 8 karakter olmalıdır.")
    .regex(/[A-Z]/, "En az bir büyük harf içermelidir.")
    .regex(/[0-9]/, "En az bir rakam içermelidir."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { token, password } = parsed.data;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return new Response(
        JSON.stringify({ success: false, message: "Geçersiz veya süresi dolmuş bağlantı." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (resetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return new Response(
        JSON.stringify({ success: false, message: "Sıfırlama bağlantısının süresi dolmuş. Lütfen yeniden talep edin." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: resetToken.email } });
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Kullanıcı bulunamadı." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
      },
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    return successResponse({ message: "Parolanız başarıyla güncellendi." });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
