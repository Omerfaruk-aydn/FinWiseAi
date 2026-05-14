import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { getRequiredSession } from "@/lib/session";

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "Bilinmiyor";
  return req.headers.get("x-real-ip") ?? "Bilinmiyor";
}

function parseUserAgent(userAgent: string) {
  const browser = userAgent.includes("Edg/")
    ? "Microsoft Edge"
    : userAgent.includes("Chrome/")
      ? "Google Chrome"
      : userAgent.includes("Firefox/")
        ? "Firefox"
        : userAgent.includes("Safari/")
          ? "Safari"
          : "Bilinmeyen tarayıcı";

  const os = userAgent.includes("Windows")
    ? "Windows"
    : userAgent.includes("Mac OS")
      ? "macOS"
      : userAgent.includes("Android")
        ? "Android"
        : userAgent.includes("iPhone") || userAgent.includes("iPad")
          ? "iOS"
          : "Bilinmeyen sistem";

  return { browser, os };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastLoginAt: true, sessionVersion: true },
    });

    const userAgent = req.headers.get("user-agent") ?? "";
    const parsed = parseUserAgent(userAgent);

    return successResponse({
      sessions: [
        {
          id: "current",
          current: true,
          browser: parsed.browser,
          os: parsed.os,
          ip: getClientIp(req),
          signedInAt: user?.lastLoginAt ?? null,
          lastActiveAt: new Date().toISOString(),
        },
      ],
      sessionVersion: user?.sessionVersion ?? session.user.sessionVersion,
    });
  } catch (error) {
    return internalErrorResponse(error);
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const session = await getRequiredSession();
    if (!session) return unauthorizedResponse();

    await prisma.user.update({
      where: { id: session.user.id },
      data: { sessionVersion: { increment: 1 } },
    });

    return successResponse({ revoked: true });
  } catch (error) {
    return internalErrorResponse(error);
  }
}
