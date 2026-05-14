"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { OwlIcon } from "@/components/brand/owl-icon";

/* ─── schema ────────────────────────────────────────────────────────── */
const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin."),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

/* ─── component ─────────────────────────────────────────────────────── */
export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [sentEmail, setSentEmail] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (!res.ok) {
        toast.error("Sıfırlama isteği gönderilemedi.");
        return;
      }

      setSentEmail(data.email);
      setSubmitted(true);
    } catch {
      toast.error("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-white px-4 py-10 font-sans text-primary sm:px-6">
      <div className="w-full max-w-[420px] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
        <div className="mb-8 flex items-center gap-2">
          <OwlIcon className="h-10 w-10" />
          <span className="text-xl font-bold tracking-tight text-[#0F172A]">FinWise AI</span>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
              className="min-w-0"
            >
          <h2 className="mb-1 text-xl font-semibold text-primary">Parolanı sıfırla</h2>
          <p className="mb-6 text-sm text-muted">
            E-posta adresini gir, sana parola sıfırlama bağlantısı gönderelim.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Input
              label="E-posta"
              type="email"
              placeholder="ornek@email.com"
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register("email")}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={isLoading}
            >
              Sıfırlama Bağlantısı Gönder
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Giriş sayfasına dön
            </Link>
          </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-accent" />
          </div>

          <h2 className="mb-2 text-xl font-semibold text-primary">Bağlantı gönderildi!</h2>
          <p className="mb-1 text-sm text-muted">
            <span className="font-medium text-primary">{sentEmail}</span> adresine parola sıfırlama
            bağlantısı gönderdik.
          </p>
          <p className="mb-8 text-sm text-muted">
            E-postanı kontrol et ve bağlantıya tıklayarak yeni parolanı belirle. Spam klasörünü de
            kontrol etmeyi unutma.
          </p>

          <Link href="/auth/login">
            <Button variant="outline" size="md" className="w-full">
              <ArrowLeft className="h-4 w-4" />
              Giriş sayfasına dön
            </Button>
          </Link>

          <p className="mt-4 text-xs text-muted">
            E-posta gelmediyse birkaç dakika bekle.{" "}
            <button
              type="button"
              onClick={() => {
                if (sentEmail) void onSubmit({ email: sentEmail });
                else setSubmitted(false);
              }}
              className="font-medium text-accent hover:underline"
            >
              Tekrar dene
            </button>
          </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
