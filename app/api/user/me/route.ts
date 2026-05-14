import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";

export async function GET(_req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        currency: true,
        sessionVersion: true,
        lastLoginAt: true,
        createdAt: true,
        profile: true,
      },
    });

    if (!user) return notFoundResponse("Kullanıcı");

    return successResponse(user);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
