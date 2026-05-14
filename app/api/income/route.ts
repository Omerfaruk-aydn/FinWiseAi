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

const createIncomeSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur."),
  amount: z.number().positive("Tutar sıfırdan büyük olmalıdır."),
  category: z.string().min(1, "Kategori zorunludur."),
  frequency: z.enum(["MONTHLY", "WEEKLY", "YEARLY", "ONE_TIME"]).default("MONTHLY"),
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
    const category = searchParams.get("category");

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

    if (category) where.category = category;

    const [incomes, total] = await Promise.all([
      prisma.income.findMany({
        where,
        orderBy: { date: "desc" },
      }),
      prisma.income.count({ where }),
    ]);

    return successResponse(incomes, { total });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createIncomeSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const income = await prisma.income.create({
      data: { ...parsed.data, userId: session.user.id },
    });

    return successResponse(income, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
