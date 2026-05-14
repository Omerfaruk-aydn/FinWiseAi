import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";

const createDebtSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur."),
  type: z.enum(["CREDIT_CARD", "LOAN", "MORTGAGE", "OTHER"]),
  totalAmount: z.number().positive("Toplam tutar sıfırdan büyük olmalıdır."),
  remainingAmount: z.number().min(0, "Kalan tutar negatif olamaz."),
  minimumPayment: z.number().positive("Minimum ödeme sıfırdan büyük olmalıdır."),
  interestRate: z.number().min(0, "Faiz oranı negatif olamaz.").default(0),
  dueDay: z.number().min(1).max(31).optional(),
  note: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const debts = await prisma.debt.findMany({
      where: { userId: session.user.id },
      orderBy: [{ status: "asc" }, { interestRate: "desc" }],
    });

    return successResponse(debts);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createDebtSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    if (parsed.data.remainingAmount > parsed.data.totalAmount) {
      return validationErrorResponse(
        new (await import("zod")).ZodError([
          { code: "custom", path: ["remainingAmount"], message: "Kalan tutar toplam tutarı aşamaz." },
        ])
      );
    }

    const debt = await prisma.debt.create({
      data: { ...parsed.data, userId: session.user.id },
    });

    return successResponse(debt, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
