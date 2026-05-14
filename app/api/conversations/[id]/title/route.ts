import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";
import { generateAIResponse } from "@/lib/ai/provider";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();
    const { id } = await params;

    const conversation = await prisma.aIConversation.findFirst({
      where: { id, userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 3,
          select: { role: true, content: true },
        },
      },
    });

    if (!conversation) return notFoundResponse();

    const firstUser = conversation.messages.find((m) => m.role === "USER");
    if (!firstUser) return successResponse({ title: conversation.title });

    // Generate a concise title from the first user message
    const result = await generateAIResponse(
      [{ role: "user", content: firstUser.content }],
      {
        systemPrompt:
          "Kullanıcının mesajından 3-5 kelimelik bir konuşma başlığı üret. " +
          "Sadece başlığı yaz, açıklama ekleme, nokta koyma. Türkçe olsun.",
        temperature: 0.3,
        maxTokens: 20,
      },
    );

    const title = result.text.trim().slice(0, 80) || firstUser.content.slice(0, 50);

    await prisma.aIConversation.update({ where: { id }, data: { title } });

    return successResponse({ title });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
