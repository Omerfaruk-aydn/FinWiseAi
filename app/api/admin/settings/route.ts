import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  forbiddenResponse,
  internalErrorResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/api-response";
import { getRequiredAdminSession, getRequiredSession } from "@/lib/session";

const settingsSchema = z.object({
  provider: z.enum(["Gemini", "OpenAI", "Anthropic"]),
  modelRouting: z.boolean(),
  grounding: z.boolean(),
  cache: z.boolean(),
  blockInvestmentAdvice: z.boolean(),
  requireDisclaimer: z.boolean(),
  blockAssetRecommendations: z.boolean(),
  structuredJsonValidation: z.boolean(),
  logAiInput: z.boolean(),
  keepErrorStack: z.boolean(),
  logAiOutput: z.boolean(),
  auditLogEnabled: z.boolean(),
  dailyAiRequestLimit: z.number().int().min(1).max(1_000_000),
  dailyReportLimit: z.number().int().min(1).max(1_000_000),
  dailyPdfLimit: z.number().int().min(1).max(1_000_000),
});

const defaultSettings = {
  provider: "Gemini" as const,
  modelRouting: true,
  grounding: true,
  cache: true,
  blockInvestmentAdvice: true,
  requireDisclaimer: true,
  blockAssetRecommendations: true,
  structuredJsonValidation: true,
  logAiInput: true,
  keepErrorStack: true,
  logAiOutput: true,
  auditLogEnabled: true,
  dailyAiRequestLimit: 50000,
  dailyReportLimit: 10000,
  dailyPdfLimit: 20000,
};

async function requireAdmin() {
  const session = await getRequiredAdminSession();
  if (session) return { session };
  const baseSession = await getRequiredSession();
  if (!baseSession) return { response: unauthorizedResponse() };
  return { response: forbiddenResponse() };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const lastUpdate = await prisma.adminAuditLog.findFirst({
      where: { action: "ADMIN_SETTINGS_UPDATE" },
      orderBy: { createdAt: "desc" },
      select: { metadataJson: true, createdAt: true },
    });

    const saved = lastUpdate?.metadataJson
      ? settingsSchema.safeParse(JSON.parse(lastUpdate.metadataJson))
      : null;

    return successResponse({
      settings: saved?.success ? saved.data : defaultSettings,
      hasSavedSettings: Boolean(saved?.success),
      updatedAt: lastUpdate?.createdAt ?? null,
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    await prisma.adminAuditLog.create({
      data: {
        adminId: auth.session.user.id,
        action: "ADMIN_SETTINGS_UPDATE",
        targetType: "SystemSettings",
        metadataJson: JSON.stringify(parsed.data),
      },
    });

    return successResponse({ settings: parsed.data, updatedAt: new Date() });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const body = (await req.json().catch(() => ({}))) as { action?: string };
    const action =
      body.action === "clear-cache"
        ? "ADMIN_CACHE_CLEARED"
        : body.action === "archive-logs"
        ? "ADMIN_AI_LOGS_ARCHIVED"
        : null;

    if (!action) {
      return successResponse({ message: "İşlem bulunamadı." }, undefined, 400);
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: auth.session.user.id,
        action,
        targetType: "SystemMaintenance",
        metadataJson: JSON.stringify({ requestedAt: new Date().toISOString() }),
      },
    });

    return successResponse({ message: "İşlem başarıyla tamamlandı." });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
