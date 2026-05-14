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

const updateIncomeSchema = z.object({
  title: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  frequency: z.enum(["MONTHLY", "WEEKLY", "YEARLY", "ONE_TIME"]).optional(),
  date: z.coerce.date().optional(),
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
    const parsed = updateIncomeSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await prisma.income.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return notFoundResponse("Gelir");

    const updated = await prisma.income.update({
      where: { id },
      data: parsed.data,
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

    const existing = await prisma.income.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return notFoundResponse("Gelir");

    await prisma.income.delete({ where: { id } });

    return successResponse({ message: "Gelir silindi." });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
