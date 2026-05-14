import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));
    const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where: { userId: session.user.id, date: { gte: start, lte: end } },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    });

    type ExpenseRow = { amount: number; categoryId?: string | null; category?: { id: string; name: string; icon: string; color: string } | null };
    const total = expenses.reduce((s: number, e: ExpenseRow) => s + e.amount, 0);

    const categoryMap = new Map<string, { id: string; name: string; icon: string; color: string; amount: number }>();
    expenses.forEach((e: ExpenseRow) => {
      const key = e.categoryId ?? "other";
      const name = e.category?.name ?? "Diğer";
      const icon = e.category?.icon ?? "circle";
      const color = e.category?.color ?? "#64748B";
      const existing = categoryMap.get(key);
      if (existing) existing.amount += e.amount;
      else categoryMap.set(key, { id: key, name, icon, color, amount: e.amount });
    });

    const categories = Array.from(categoryMap.values())
      .map((c) => ({
        ...c,
        percent: total > 0 ? (c.amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return successResponse({ categories, total, month, year });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
