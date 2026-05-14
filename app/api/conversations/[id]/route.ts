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

async function ownsConversation(userId: string, id: string) {
  const c = await prisma.aIConversation.findFirst({ where: { id, userId } });
  return !!c;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();
    const { id } = await params;

    if (!(await ownsConversation(session.user.id, id))) return notFoundResponse();

    const messages = await prisma.aIMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        metadataJson: true,
        createdAt: true,
      },
    });

    return successResponse(
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: m.metadataJson ? JSON.parse(m.metadataJson) : null,
        createdAt: m.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    return internalErrorResponse(error);
  }
}

const patchSchema = z.object({
  title: z.string().min(1).max(100),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();
    const { id } = await params;

    if (!(await ownsConversation(session.user.id, id))) return notFoundResponse();

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const updated = await prisma.aIConversation.update({
      where: { id },
      data: { title: parsed.data.title },
    });

    return successResponse({ id: updated.id, title: updated.title });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();
    const { id } = await params;

    if (!(await ownsConversation(session.user.id, id))) return notFoundResponse();

    await prisma.aIConversation.delete({ where: { id } });

    return successResponse({ deleted: true });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
