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

const createExpenseSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur."),
  amount: z.number().positive("Tutar sıfırdan büyük olmalıdır."),
  categoryId: z.string().optional(),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]).default("CARD"),
  isRecurring: z.boolean().default(false),
  date: z.coerce.date(),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : null;
    const categoryId = searchParams.get("categoryId");

    const where: Record<string, unknown> = { userId: session.user.id };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);
      where.date = { gte: start, lte: end };
    }

    if (categoryId) where.categoryId = categoryId;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { category: { select: { id: true, name: true, icon: true, color: true } } },
        orderBy: { date: "desc" },
      }),
      prisma.expense.count({ where }),
    ]);

    return successResponse(expenses, { total });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const expense = await prisma.expense.create({
      data: { ...parsed.data, userId: session.user.id },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });

    return successResponse(expense, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
