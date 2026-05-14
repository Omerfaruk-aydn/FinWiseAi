"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { OwlIcon } from "@/components/brand/owl-icon";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Parola en az 8 karakter olmalıdır.")
      .regex(/[A-Z]/, "En az bir büyük harf içermelidir.")
      .regex(/[0-9]/, "En az bir rakam içermelidir."),
    confirmPassword: z.string().min(1, "Parolayı tekrar girin."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parolalar eşleşmiyor.",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json?.message ?? "Parola sıfırlanamadı. Bağlantı geçersiz veya süresi dolmuş olabilir.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch {
      toast.error("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="h-7 w-7 text-[#10B981]" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Parola güncellendi!</h2>
        <p className="text-sm text-slate-500">
          Parolanız başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz…
        </p>
        <Link
          href="/auth/login"
          className="mt-2 text-sm font-semibold text-[#10B981] hover:underline"
        >
          Hemen giriş yap
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-1 text-xl font-semibold text-slate-900">Yeni parola belirle</h2>
      <p className="mb-6 text-sm text-slate-500">
        Hesabın için güçlü bir parola oluştur. En az 8 karakter, bir büyük harf ve bir rakam içermelidir.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Yeni Parola</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-12 pr-10"
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700">Parola Tekrar</label>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              className="h-12 pr-10"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="mt-2 h-12 w-full bg-[#10B981] hover:bg-[#059669] font-bold text-white"
        >
          {isLoading ? "Güncelleniyor..." : "Parolayı Güncelle"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/auth/login" className="font-semibold text-[#10B981] hover:underline">
          Giriş sayfasına dön
        </Link>
      </p>
    </>
  );
}

function InvalidToken() {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 border border-red-200">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900">Geçersiz bağlantı</h2>
      <p className="text-sm text-slate-500">
        Parola sıfırlama bağlantısı eksik veya geçersiz. Lütfen yeniden talep edin.
      </p>
      <Link
        href="/auth/forgot-password"
        className="mt-2 text-sm font-semibold text-[#10B981] hover:underline"
      >
        Yeni sıfırlama bağlantısı al
      </Link>
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-white px-4 py-10 font-sans sm:px-6">
      <div className="w-full max-w-[420px] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
        <div className="mb-8 flex items-center gap-2">
          <OwlIcon className="h-10 w-10" />
          <span className="text-xl font-bold tracking-tight text-[#0F172A]">FinWise AI</span>
        </div>

        {token ? <ResetPasswordForm token={token} /> : <InvalidToken />}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-8 w-8 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </React.Suspense>
  );
}
