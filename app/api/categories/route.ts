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
import { normalizeCategoryKey } from "@/lib/category-utils";

const createCategorySchema = z.object({
  name: z.string().min(1, "Kategori adı zorunludur."),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().default("circle"),
  color: z.string().default("#64748B"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "INCOME" | "EXPENSE" | null;

    const categories = await prisma.category.findMany({
      where: {
        type: type ?? undefined,
        OR: [{ isDefault: true }, { userId: session.user.id }],
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    const uniqueCategories = Array.from(
      new Map(categories.map((category) => [normalizeCategoryKey(category.name), category])).values()
    );

    return successResponse(uniqueCategories);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const existingCategories = await prisma.category.findMany({
      where: {
        type: parsed.data.type,
        OR: [{ isDefault: true }, { userId: session.user.id }],
      },
    });

    const normalizedName = normalizeCategoryKey(parsed.data.name);
    const existing = existingCategories.find((category) => normalizeCategoryKey(category.name) === normalizedName);
    if (existing) {
      return successResponse(existing, undefined, 200);
    }

    const category = await prisma.category.create({
      data: { ...parsed.data, userId: session.user.id, isDefault: false },
    });

    return successResponse(category, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
