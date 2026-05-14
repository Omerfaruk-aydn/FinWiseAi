// Standart API response yardımcıları

import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function successResponse<T>(data: T, meta?: ApiSuccess<T>["meta"], status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data, meta }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
) {
  const isDev = process.env.NODE_ENV === "development";
  return NextResponse.json<ApiError>(
    {
      success: false,
      error: {
        code,
        message,
        details: isDev ? details : undefined,
      },
    },
    { status }
  );
}

export function unauthorizedResponse() {
  return errorResponse("UNAUTHORIZED", "Oturum açmanız gerekiyor.", 401);
}

export function forbiddenResponse() {
  return errorResponse("FORBIDDEN", "Bu işlem için yetkiniz yok.", 403);
}

export function notFoundResponse(resource = "Kayıt") {
  return errorResponse("NOT_FOUND", `${resource} bulunamadı.`, 404);
}

export function validationErrorResponse(error: ZodError) {
  return errorResponse(
    "VALIDATION_ERROR",
    "Geçersiz veri. Lütfen alanları kontrol edin.",
    400,
    error.flatten()
  );
}

export function internalErrorResponse(error?: unknown) {
  console.error("[API_ERROR]", error);
  return errorResponse(
    "INTERNAL_ERROR",
    "Bir hata oluştu. Lütfen tekrar deneyin.",
    500
  );
}
