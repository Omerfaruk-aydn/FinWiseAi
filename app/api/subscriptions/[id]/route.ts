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

const updateSubscriptionSchema = z.object({
  title: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
  nextBillingDate: z.coerce.date().optional(),
  category: z.string().optional(),
  status: z.enum(["ACTIVE", "CANCELLED", "PAUSED"]).optional(),
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
    const parsed = updateSubscriptionSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await prisma.subscription.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return notFoundResponse("Abonelik");

    const updated = await prisma.subscription.update({ where: { id }, data: parsed.data });
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
    const existing = await prisma.subscription.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return notFoundResponse("Abonelik");

    await prisma.subscription.delete({ where: { id } });
    return successResponse({ message: "Abonelik silindi." });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
