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

const createGoalSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur."),
  targetAmount: z.number().positive("Hedef tutar sıfırdan büyük olmalıdır."),
  currentAmount: z.number().min(0, "Mevcut tutar negatif olamaz.").default(0),
  deadline: z.coerce.date().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as "ACTIVE" | "COMPLETED" | "PAUSED" | null;

    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
        ...(status ? { status } : {}),
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });

    return successResponse(goals);
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    if (parsed.data.currentAmount > parsed.data.targetAmount) {
      return validationErrorResponse(
        new (await import("zod")).ZodError([
          {
            code: "custom",
            path: ["currentAmount"],
            message: "Mevcut tutar hedef tutarı aşamaz.",
          },
        ])
      );
    }

    const goal = await prisma.goal.create({
      data: { ...parsed.data, userId: session.user.id },
    });

    return successResponse(goal, undefined, 201);
  } catch (error) {
    return internalErrorResponse(error);
  }
}
