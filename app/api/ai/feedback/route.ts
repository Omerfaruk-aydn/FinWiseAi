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

const feedbackSchema = z.object({
  messageId: z.string().min(1),
  rating: z.union([z.literal(1), z.literal(-1)]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { messageId, rating } = parsed.data;

    const message = await prisma.aIMessage.findFirst({
      where: {
        id: messageId,
        role: "ASSISTANT",
        conversation: { userId: session.user.id },
      },
      select: { id: true },
    });

    if (!message) return notFoundResponse("Mesaj");

    const feedback = await prisma.aIMessageFeedback.upsert({
      where: { messageId_userId: { messageId, userId: session.user.id } },
      create: { messageId, userId: session.user.id, rating },
      update: { rating },
    });

    return successResponse({ id: feedback.id, rating: feedback.rating });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
