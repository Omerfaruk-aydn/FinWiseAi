import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
  errorResponse,
} from "@/lib/api-response";
import { getRequiredAdminSession, getRequiredSession } from "@/lib/session";
import { normalizeCategoryKey } from "@/lib/category-utils";

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequiredAdminSession();
    if (!session) {
      const baseSession = await getRequiredSession();
      if (!baseSession) return unauthorizedResponse();
      return forbiddenResponse();
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Kategori");

    const nextName = parsed.data.name ?? existing.name;
    const nextType = parsed.data.type ?? existing.type;
    const duplicate = await prisma.category.findFirst({
      where: {
        id: { not: id },
        type: nextType,
      },
    });
    if (duplicate && normalizeCategoryKey(duplicate.name) === normalizeCategoryKey(nextName)) {
      return errorResponse("CONFLICT", "Bu kategori zaten mevcut.", 409);
    }

    const updated = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });

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
    const session = await getRequiredAdminSession();
    if (!session) {
      const baseSession = await getRequiredSession();
      if (!baseSession) return unauthorizedResponse();
      return forbiddenResponse();
    }

    const { id } = await params;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Kategori");

    await prisma.category.delete({ where: { id } });

    return successResponse({ id });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
