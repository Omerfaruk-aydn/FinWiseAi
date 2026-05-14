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

const createBudgetSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  totalIncome: z.number().min(0),
  plannedExpense: z.number().min(0),
  plannedSaving: z.number().min(0),
  categories: z.array(z.object({
    categoryId: z.string(),
    plannedAmount: z.number().min(0),
  })).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : null;

    const budgets = await prisma.budget.findMany({
      where: {
        userId: session.user.id,
        ...(month ? { month } : {}),
        ...(year ? { year } : {}),
      },
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, icon: true, color: true } } },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return successResponse(budgets);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createBudgetSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const { categories, ...budgetData } = parsed.data;

    const budget = await prisma.budget.upsert({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: budgetData.month,
          year: budgetData.year,
        },
      },
      create: {
        ...budgetData,
        userId: session.user.id,
        ...(categories && {
          categories: {
            create: categories.map((c) => ({
              categoryId: c.categoryId,
              plannedAmount: c.plannedAmount,
            })),
          },
        }),
      },
      update: {
        ...budgetData,
        ...(categories && {
          categories: {
            deleteMany: {},
            create: categories.map((c) => ({
              categoryId: c.categoryId,
              plannedAmount: c.plannedAmount,
            })),
          },
        }),
      },
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, icon: true, color: true } } },
        },
      },
    });

    return successResponse(budget, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
