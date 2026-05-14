"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Sparkles, PieChart, Bot, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OwlIcon } from "@/components/brand/owl-icon";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır.").max(60, "Ad soyad en fazla 60 karakter olabilir."),
    email: z.string().email("Geçerli bir e-posta adresi girin."),
    password: z
      .string()
      .min(8, "Parola en az 8 karakter olmalıdır.")
      .regex(/[A-Z]/, "En az bir büyük harf içermelidir.")
      .regex(/[0-9]/, "En az bir rakam içermelidir."),
    confirmPassword: z.string(),
    terms: z.boolean().refine((value) => value, {
      message: "Devam etmek için kullanım koşullarını kabul edin.",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Parolalar eşleşmiyor.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

type StrengthLevel = "weak" | "fair" | "good" | "strong";

function getPasswordStrength(password: string): { level: StrengthLevel; score: number; label: string; color: string } {
  if (!password) return { level: "weak", score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: "weak", score: 1, label: "Zayıf", color: "bg-red-500" };
  if (score === 2) return { level: "fair", score: 2, label: "Orta", color: "bg-yellow-500" };
  if (score === 3) return { level: "good", score: 3, label: "İyi", color: "bg-blue-500" };
  return { level: "strong", score: 4, label: "Güçlü parola", color: "bg-[#10B981]" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [watchedPassword, setWatchedPassword] = React.useState("");

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", terms: false },
  });

  const passwordValue = watch("password");
  React.useEffect(() => { setWatchedPassword(passwordValue ?? ""); }, [passwordValue]);
  const strength = getPasswordStrength(watchedPassword);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.fullName, email: data.email, password: data.password }),
      });
      if (!res.ok) {
        const body = await res.json() as { message?: string };
        toast.error(body.message ?? "Kayıt sırasında bir hata oluştu.");
        return;
      }
      toast.success("Hesabın oluşturuldu! Giriş sayfasına yönlendiriliyorsun.");
      router.push("/auth/login");
    } catch {
      toast.error("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-white font-sans text-primary">
      {/* LEFT SIDE */}
      <div className="flex w-full min-w-0 flex-col px-4 py-8 sm:px-8 lg:w-1/2 lg:px-16 xl:px-24">
        {/* Header / Logo */}
        <div className="flex items-center gap-2">
          <OwlIcon className="h-10 w-10" />
          <span className="text-xl font-bold tracking-tight text-[#0F172A]">FinWise AI</span>
        </div>

        {/* Form Container */}
        <div className="mx-auto flex w-full max-w-[400px] min-w-0 flex-1 flex-col justify-center">
          <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="min-w-0">
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full bg-[#ECFDF5] px-3 py-1.5 text-sm font-medium text-[#10B981]">
              <Sparkles className="h-4 w-4" />
              Kişisel finansını AI ile yönet
            </div>
            
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">Ücretsiz hesap oluştur</h1>
            <p className="mb-8 text-base text-slate-500">
              Gelir, gider, borç ve hedeflerini analiz eden akıllı finans koçunu kullanmaya başla.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Ad Soyad</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Ayşe Yılmaz"
                    className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] placeholder:text-slate-400"
                    {...register("fullName")}
                  />
                </div>
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">E-posta</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] placeholder:text-slate-400"
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Parola</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="En az 8 karakter"
                    className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-10 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] placeholder:text-slate-400"
                    {...register("password")}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Parola Tekrar</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Parolanı tekrar gir"
                    className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-10 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] placeholder:text-slate-400"
                    {...register("confirmPassword")}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                
                {/* Strength meter exactly like screenshot */}
                {watchedPassword.length > 0 && (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-1.5 w-1/2">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className={cn("h-1.5 flex-1 rounded-full", strength.score >= n ? strength.color : "bg-slate-200")} />
                      ))}
                    </div>
                    {strength.label && (
                      <span className={cn("text-xs font-medium", strength.color.replace('bg-', 'text-'))}>{strength.label}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="h-4 w-4 rounded border-slate-300 text-[#10B981] focus:ring-[#10B981]"
                  {...register("terms")}
                />
                <label htmlFor="terms" className="text-sm text-slate-600">Kullanım koşullarını kabul ediyorum</label>
              </div>
              {errors.terms && <p className="text-xs text-red-500">{errors.terms.message}</p>}

              <button type="submit" disabled={isLoading} className="flex h-12 w-full items-center justify-center rounded-lg bg-[#10B981] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#059669] disabled:opacity-50 mt-2">
                Kayıt Ol
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Zaten hesabın var mı? <Link href="/auth/login" className="font-semibold text-[#10B981] hover:underline">Giriş yap</Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDE (Features) */}
      <div className="hidden w-1/2 bg-white lg:flex flex-col justify-center px-12 xl:px-20 relative overflow-hidden">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="max-w-[500px]">
          <h2 className="text-4xl font-bold text-[#0F172A] leading-tight mb-10">
            Finansal farkındalığını<br />birkaç dakikada başlat.
          </h2>

          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                <PieChart className="w-5 h-5 text-[#10B981]" />
              </div>
              <h3 className="font-semibold text-sm leading-snug">Gelir ve giderlerini tek yerde gör</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Tüm finansal hareketlerini net ve anlaşılır şekilde izle.</p>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#10B981]" />
              </div>
              <h3 className="font-semibold text-sm leading-snug">AI destekli bütçe önerileri al</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Harcama alışkanlıklarını analiz eden akıllı öneriler kazan.</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#10B981]" />
              </div>
              <h3 className="font-semibold text-sm leading-snug">PDF finans raporlarını indir</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Detaylı raporlarını indir ve dilediğinle paylaş.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-[#10B981]" />
              <span className="text-sm font-semibold text-slate-800">Kayıttan sonra etkinleşen özellikler</span>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="font-semibold text-slate-900 text-sm">Gelir, gider ve bütçe takibi</div>
                <div className="mt-1 text-xs leading-relaxed text-slate-500">Tüm finansal hareketlerin tek ekranda düzenli biçimde görünür.</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="font-semibold text-slate-900 text-sm">AI destekli öneriler</div>
                <div className="mt-1 text-xs leading-relaxed text-slate-500">Harcamalarına göre kişiselleştirilmiş aksiyon önerileri alırsın.</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="font-semibold text-slate-900 text-sm">PDF raporlar ve özetler</div>
                <div className="mt-1 text-xs leading-relaxed text-slate-500">Aylık raporlarını dışa aktarabilir ve düzenli analiz yapabilirsin.</div>
              </div>
            </div>
            <div className="mt-5 text-xs text-slate-400 leading-relaxed">
              Bu alan bilgilendirme içindir; finansal tavsiye yerine geçmez.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
