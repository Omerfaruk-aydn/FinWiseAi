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

const updateTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  title: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  categoryId: z.string().nullable().optional(),
  date: z.coerce.date().optional(),
  source: z.string().optional(),
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
    const parsed = updateTransactionSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return notFoundResponse("İşlem");

    const updated = await prisma.transaction.update({
      where: { id },
      data: parsed.data,
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });

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
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return notFoundResponse("İşlem");

    await prisma.transaction.delete({ where: { id } });

    return successResponse({ message: "İşlem silindi." });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
