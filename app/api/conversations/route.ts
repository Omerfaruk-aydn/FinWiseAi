import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";

export async function GET(_req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const conversations = await prisma.aIConversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { role: true, content: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    });

    const items = conversations.map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updatedAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
      messageCount: c._count.messages,
      lastMessage: c.messages[0]
        ? {
            role: c.messages[0].role,
            preview: c.messages[0].content.slice(0, 80),
            createdAt: c.messages[0].createdAt.toISOString(),
          }
        : null,
    }));

    return successResponse(items);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
