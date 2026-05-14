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

const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  title: z.string().min(1, "Başlık zorunludur."),
  amount: z.number().positive("Tutar sıfırdan büyük olmalıdır."),
  categoryId: z.string().optional(),
  date: z.coerce.date(),
  source: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "25"), 100);
    const search = searchParams.get("search");
    const type = searchParams.get("type") as "INCOME" | "EXPENSE" | null;
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: session.user.id };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { note: { contains: search, mode: "insensitive" } },
      ];
    }
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (startDate || endDate) {
      where.date = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const [transactions, incomes, expenses] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: { select: { id: true, name: true, icon: true, color: true } } },
      }),
      prisma.income.findMany({
        where: {
          userId: session.user.id,
          ...(startDate || endDate ? { date: where.date as any } : {}),
        }
      }),
      prisma.expense.findMany({
        where: {
          userId: session.user.id,
          ...(startDate || endDate ? { date: where.date as any } : {}),
          ...(categoryId ? { categoryId: categoryId as string } : {})
        },
        include: { category: { select: { id: true, name: true, icon: true, color: true } } },
      }),
    ]);

    let combined = [
      ...transactions,
      ...incomes.map(i => ({
        id: i.id,
        type: "INCOME",
        title: i.title,
        amount: i.amount,
        categoryId: null,
        category: { id: "income", name: i.category, icon: "circle", color: "#10B981" },
        date: i.date,
        source: "Income",
        note: i.note,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      })),
      ...expenses.map(e => ({
        id: e.id,
        type: "EXPENSE",
        title: e.title,
        amount: e.amount,
        categoryId: e.categoryId,
        category: e.category,
        date: e.date,
        source: "Expense",
        note: e.note,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      }))
    ];

    if (search) {
      const s = search.toLowerCase();
      combined = combined.filter(x => x.title.toLowerCase().includes(s) || (x.note && x.note.toLowerCase().includes(s)));
    }
    if (type) {
      combined = combined.filter(x => x.type === type);
    }

    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const total = combined.length;
    const paginated = combined.slice(skip, skip + limit);

    return successResponse(paginated, {
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createTransactionSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const transaction = await prisma.transaction.create({
      data: { ...parsed.data, userId: session.user.id },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });

    return successResponse(transaction, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
