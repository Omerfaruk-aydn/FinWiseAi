import { prisma } from "@/lib/prisma";
import {
  internalErrorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return successResponse(notifications);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
