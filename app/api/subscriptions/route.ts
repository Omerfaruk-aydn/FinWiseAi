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

const createSubscriptionSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur."),
  amount: z.number().positive("Tutar sıfırdan büyük olmalıdır."),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  nextBillingDate: z.coerce.date(),
  category: z.string().default("Diğer"),
  note: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: [{ status: "asc" }, { nextBillingDate: "asc" }],
    });

    return successResponse(subscriptions);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createSubscriptionSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const subscription = await prisma.subscription.create({
      data: { ...parsed.data, userId: session.user.id },
    });

    return successResponse(subscription, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
