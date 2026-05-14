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

const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  deadline: z.coerce.date().nullable().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED"]).optional(),
  note: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const goal = await prisma.goal.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!goal) return notFoundResponse("Hedef");
    return successResponse(goal);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const body = await req.json();
    const parsed = updateGoalSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await prisma.goal.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return notFoundResponse("Hedef");

    const targetAmount = parsed.data.targetAmount ?? existing.targetAmount;
    const currentAmount = parsed.data.currentAmount ?? existing.currentAmount;

    if (currentAmount > targetAmount) {
      return validationErrorResponse(
        new (await import("zod")).ZodError([
          { code: "custom", path: ["currentAmount"], message: "Mevcut tutar hedef tutarı aşamaz." },
        ])
      );
    }

    const updateData = {
      ...parsed.data,
      ...(currentAmount >= targetAmount ? { status: "COMPLETED" as const } : {}),
    };

    const updated = await prisma.goal.update({ where: { id }, data: updateData });
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
    const existing = await prisma.goal.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return notFoundResponse("Hedef");

    await prisma.goal.delete({ where: { id } });
    return successResponse({ message: "Hedef silindi." });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
