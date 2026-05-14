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

const imageDataUrlSchema = z.object({
  imageDataUrl: z
    .string()
    .max(900_000, "Görsel en fazla 650 KB olmalıdır.")
    .regex(
      /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/,
      "Sadece PNG, JPG veya WebP görsel yükleyebilirsiniz."
    ),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = imageDataUrlSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: parsed.data.imageDataUrl },
      select: { id: true, image: true, name: true, currency: true, sessionVersion: true },
    });

    return successResponse(user);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
      select: { id: true, image: true, name: true, currency: true, sessionVersion: true },
    });

    return successResponse(user);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
