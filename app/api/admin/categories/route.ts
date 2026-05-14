import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredAdminSession, getRequiredSession } from "@/lib/session";
import { normalizeCategoryKey } from "@/lib/category-utils";

const createCategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().default("circle"),
  color: z.string().default("#64748B"),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await getRequiredAdminSession();
    if (!session) {
      const baseSession = await getRequiredSession();
      if (!baseSession) return unauthorizedResponse();
      return forbiddenResponse();
    }

    const categories = await prisma.category.findMany({
      orderBy: [{ isDefault: "desc" }, { type: "asc" }, { name: "asc" }],
      include: { _count: { select: { expenses: true } } },
    });

    const uniqueCategories = Array.from(
      new Map(categories.map((category) => [normalizeCategoryKey(category.name) + `:${category.type}`, category])).values()
    );

    return successResponse(uniqueCategories);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredAdminSession();
    if (!session) {
      const baseSession = await getRequiredSession();
      if (!baseSession) return unauthorizedResponse();
      return forbiddenResponse();
    }

    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existingCategories = await prisma.category.findMany({
      where: { type: parsed.data.type },
    });
    const normalizedName = normalizeCategoryKey(parsed.data.name);
    const existing = existingCategories.find((category) => normalizeCategoryKey(category.name) === normalizedName);
    if (existing) {
      return successResponse(existing, undefined, 200);
    }

    const category = await prisma.category.create({
      data: { ...parsed.data, isDefault: true },
    });

    return successResponse(category, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
