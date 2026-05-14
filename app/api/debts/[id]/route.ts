import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";

const updateDebtSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(["CREDIT_CARD", "LOAN", "MORTGAGE", "OTHER"]).optional(),
  totalAmount: z.number().positive().optional(),
  remainingAmount: z.number().min(0).optional(),
  minimumPayment: z.number().positive().optional(),
  interestRate: z.number().min(0).optional(),
  dueDay: z.number().min(1).max(31).nullable().optional(),
  status: z.enum(["ACTIVE", "PAID", "OVERDUE"]).optional(),
  note: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const body = await req.json();
    const parsed = updateDebtSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await prisma.debt.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return notFoundResponse("Borç");

    const updated = await prisma.debt.update({ where: { id }, data: parsed.data });
    return successResponse(updated);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const existing = await prisma.debt.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return notFoundResponse("Borç");

    await prisma.debt.delete({ where: { id } });
    return successResponse({ message: "Borç silindi." });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
