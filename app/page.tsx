"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  BarChart2,
  EyeOff,
  TrendingUp,
  Target,
  PieChart,
  Bot,
  Wallet,
  CreditCard,
  Bell,
  FileText,
  Upload,
  CheckCircle2,
  HeartPulse,
  ArrowDown,
  ArrowRight,
  ShieldCheck,
  Info,
  Play,
} from "lucide-react";
import { OwlIcon } from "@/components/brand/owl-icon";

export default function LandingPage() {
  const [newsletterEmail, setNewsletterEmail] = React.useState("");
  const [newsletterLoading, setNewsletterLoading] = React.useState(false);

  async function handleNewsletterSubmit() {
    if (!/^\S+@\S+\.\S+$/.test(newsletterEmail)) {
      toast.error("Gecerli bir e-posta adresi girin.");
      return;
    }
    setNewsletterLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error?.message);
      toast.success(json.data.message);
      setNewsletterEmail("");
    } catch {
      toast.error("Abonelik kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setNewsletterLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-[#0F172A] selection:bg-[#10B981]/10 selection:text-[#10B981]">
      {/* HEADER */}
      <header className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100/60">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <OwlIcon className="h-10 w-10" />
            <span className="text-xl font-bold tracking-tight text-[#0F172A]">FinWise AI</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-10 text-[15px] font-medium text-slate-600">
            <Link href="#ozellikler" className="hover:text-[#10B981] transition-colors">Özellikler</Link>
            <Link href="#ai-koc" className="hover:text-[#10B981] transition-colors">AI Koç</Link>
            <Link href="#raporlar" className="hover:text-[#10B981] transition-colors">Raporlar</Link>
            <Link href="#fiyatlandirma" className="hover:text-[#10B981] transition-colors">Fiyatlandırma</Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/auth/login" className="text-[15px] font-semibold text-[#0F172A] hover:text-[#10B981] transition-colors">
              Giriş Yap
            </Link>
            <Link href="/auth/register" className="hidden rounded-xl bg-[#10B981] px-6 py-3 text-[15px] font-semibold text-white shadow-lg shadow-[#10B981]/20 transition-all hover:bg-[#059669] hover:shadow-[#10B981]/30 active:scale-95 sm:inline-flex">
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* HERO */}
        <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-gradient-to-b from-[#ECFDF5] to-transparent rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3" />
          
          {/* Subtle dots pattern */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_25%_50%,#000_70%,transparent_100%)] opacity-40" />

          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left Column */}
              <div className="relative z-10 max-w-[620px]">
                <motion.div
                  animate={{ opacity: 1, y: 0 }}                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#ECFDF5] px-4 py-1.5 text-sm font-medium text-[#059669] mb-8"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI destekli kişisel finans koçu</span>
                </motion.div>

                <motion.h1 
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-[40px] sm:text-[54px] lg:text-[64px] leading-[1.05] font-bold tracking-tight mb-8 text-[#0F172A]"
                >
                  Paranı nereye<br/>harcadığını anlayan<br/>
                  <span className="text-[#10B981]">akıllı finans koçu.</span>
                </motion.h1>
                
                <motion.p 
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-[17px] sm:text-[19px] text-slate-500 mb-10 leading-relaxed max-w-[540px]"
                >
                  FinWise AI gelir, gider, borç ve hedeflerini analiz ederek sana kişisel bütçe planı, harcama içgörüleri, finansal sağlık skoru ve haftalık aksiyon önerileri sunar.
                </motion.p>

                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col sm:flex-row items-center gap-4 mb-8"
                >
                  <Link href="/auth/register" className="flex h-14 w-full sm:w-auto items-center justify-center rounded-xl bg-[#10B981] px-10 text-base font-bold text-white shadow-lg shadow-[#10B981]/20 transition-all hover:bg-[#059669] hover:shadow-[#10B981]/30 active:scale-95">
                    Ücretsiz Başla
                  </Link>
                  <Link href="/auth/register" className="flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 text-base font-bold text-[#0F172A] transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 group/preview">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full border border-slate-200 transition-colors group-hover/preview:border-[#10B981] group-hover/preview:bg-[#ECFDF5]">
                      <Play className="w-3 h-3 fill-slate-600 text-slate-600 ml-0.5 group-hover/preview:fill-[#10B981] group-hover/preview:text-[#10B981] transition-colors" />
                    </div>
                    Paneli İncele
                  </Link>
                </motion.div>

                <motion.div 
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-2 mb-12"
                >
                  <div className="flex items-center gap-2 text-[13px] font-medium text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Yatırım tavsiyesi vermez</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] font-medium text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>Kişisel bütçe ve finansal farkındalık desteği sağlar</span>
                  </div>
                </motion.div>

                {/* Sub-features/Tags */}
                <motion.div 
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex flex-wrap gap-4 pt-4 border-t border-slate-100"
                >
                  {[
                    { icon: Sparkles, label: "AI Analizi" },
                    { icon: FileText, label: "PDF Rapor" },
                    { icon: HeartPulse, label: "Sağlık Skoru" }
                  ].map((tag, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] text-[14px] font-bold text-slate-600 hover:border-[#10B981]/30 transition-all cursor-default group">
                      <tag.icon className="w-4 h-4 text-[#10B981] transition-transform group-hover:scale-110" />
                      {tag.label}
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right Column - Product Preview */}
              <div className="relative">
                {/* Dashboard Image */}
                <motion.div
                  initial={false}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="relative z-10 w-[110%] ml-[-5%] lg:w-[130%] lg:ml-[-15%]"
                >
                  <div className="rounded-3xl border border-slate-200/60 bg-white p-2 shadow-2xl overflow-hidden ring-8 ring-slate-50/50">
                    <Image
                      src="/dashboard-preview1.png"
                      alt="FinWise AI Dashboard Preview"
                      width={1200}
                      height={800}
                      className="rounded-2xl w-full h-auto"
                      priority
                    />
                  </div>

                  {/* Floating Cards */}
                  {/* Left Floating Card */}
                  <motion.div
                    initial={false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    className="absolute -left-12 top-1/2 -translate-y-1/2 z-20 bg-white rounded-2xl p-5 shadow-xl border border-slate-100 max-w-[200px]"
                  >
                    <div className="text-[13px] font-bold text-slate-400 mb-1">Bu ay</div>
                    <div className="text-xl font-bold text-[#0F172A] mb-1">₺1.450</div>
                    <div className="text-[12px] font-medium text-slate-500 mb-3">tasarruf potansiyeli</div>
                    <div className="h-10 w-full flex items-end gap-1">
                      {[40, 60, 45, 70, 50, 85].map((h, i) => (
                        <div key={i} className="flex-1 bg-[#10B981] rounded-t-sm" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Right Top Floating Card */}
                  <motion.div
                    initial={false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                    className="absolute -right-8 top-12 z-20 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 min-w-[160px]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[12px] font-bold text-slate-400">Sağlık Skoru</div>
                      <div className="text-[12px] font-bold text-[#10B981]">+4 puan</div>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500 mb-2 text-right">Geçen aya göre</div>
                    <div className="h-6 w-full flex items-center justify-center overflow-hidden">
                      <svg viewBox="0 0 100 20" className="w-full h-full text-[#10B981]">
                        <path d="M0,15 Q25,5 50,15 T100,5" fill="none" stroke="currentColor" strokeWidth="3" />
                      </svg>
                    </div>
                  </motion.div>

                  {/* Right Bottom Floating Card */}
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}                    transition={{ duration: 0.5, delay: 1.4 }}
                    className="absolute -right-4 bottom-20 z-20 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 max-w-[180px]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-yellow-50">
                        <Bell className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#0F172A]">1 abonelik</div>
                        <div className="text-[11px] font-medium text-slate-500">gözden geçirilmeli</div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY SECTION */}
        <section className="py-24 bg-white relative">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-bold text-center mb-16 text-[#0F172A]">Finansını yönetmek neden zor?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: EyeOff,
                  color: "bg-[#ECFDF5] text-[#10B981]",
                  title: "Paranın nereye gittiğini görmek zor",
                  desc: "Çok sayıda harcama arasında kaybolur, gerçek resmi görmek zorlaşır."
                },
                {
                  icon: TrendingUp,
                  color: "bg-orange-50 text-orange-500",
                  title: "Borç ve abonelikler fark edilmeden büyür",
                  desc: "Küçük ödemeler ve abonelikler zamanla büyük yükler oluşturur."
                },
                {
                  icon: Target,
                  color: "bg-blue-50 text-blue-500",
                  title: "Tasarruf hedefleri plansız kalır",
                  desc: "Net bir plan olmadığında hedeflere ulaşmak her zaman ertelenir."
                }
              ].map((item, i) => (
                <div key={i} className="group p-8 rounded-3xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-6`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-[#0F172A]">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-[15px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT SECTION */}
        <section id="ozellikler" className="py-24 bg-[#F8FAFC] scroll-mt-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-bold text-center mb-20 text-[#0F172A]">FinWise AI senin için ne yapar?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 1. Gelir-gider analizi */}
              <div role="button" tabIndex={0} onClick={() => window.location.assign("/app/analytics")} onKeyDown={(event) => event.key === "Enter" && window.location.assign("/app/analytics")} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col h-full cursor-pointer transition-colors hover:border-[#10B981]/40">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <PieChart className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <h3 className="text-lg font-bold">1. Gelir-gider analizi</h3>
                </div>
                <p className="text-[15px] text-slate-500 leading-relaxed mb-8">
                  Tüm gelir ve giderlerini otomatik kategorize eder, net nakit akışını görüntüler.
                </p>
                <div className="mt-auto bg-[#F8FAFC] rounded-2xl p-4 border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-[11px] font-bold text-slate-400">Gelir</div>
                    <div className="text-[11px] font-bold text-[#10B981]">₺30.000</div>
                    <div className="text-[11px] font-bold text-slate-400 ml-4">Gider</div>
                    <div className="text-[11px] font-bold text-red-500">₺18.250</div>
                  </div>
                  <div className="h-12 w-full flex items-end gap-1">
                    {[30, 45, 35, 60, 40, 80, 50, 65, 45, 90].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-t-sm ${i % 2 === 0 ? 'bg-[#10B981]' : 'bg-red-400 opacity-60'}`} style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. AI finans asistanı */}
              <div id="ai-koc" role="button" tabIndex={0} onClick={() => window.location.assign("/app/assistant")} onKeyDown={(event) => event.key === "Enter" && window.location.assign("/app/assistant")} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col h-full scroll-mt-24 cursor-pointer transition-colors hover:border-[#10B981]/40">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <h3 className="text-lg font-bold">2. AI finans asistanı</h3>
                </div>
                <p className="text-[15px] text-slate-500 leading-relaxed mb-8">
                  Yapay zeka içgörüleri ile harcama alışkanlıklarını analiz eder ve öneriler sunar.
                </p>
                <div className="mt-auto relative">
                  <div className="bg-[#ECFDF5] rounded-2xl p-4 border border-green-100 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles className="w-4 h-4 text-[#10B981]" />
                    </div>
                    <p className="text-[12px] text-[#059669] font-medium leading-relaxed">
                      Bu ay ulaşım harcamaların için geçen aya göre <strong>%18 arttı.</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Bütçe planlayıcı */}
              <div role="button" tabIndex={0} onClick={() => window.location.assign("/app/budget")} onKeyDown={(event) => event.key === "Enter" && window.location.assign("/app/budget")} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col h-full cursor-pointer transition-colors hover:border-[#10B981]/40">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <h3 className="text-lg font-bold">3. Bütçe planlayıcı</h3>
                </div>
                <p className="text-[15px] text-slate-500 leading-relaxed mb-8">
                  Gelirine göre akıllı bütçe planı oluşturur ve harcamalarını dengede tutmana yardımcı olur.
                </p>
                <div className="mt-auto bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-2">
                    <span>Aylık Bütçe</span>
                    <span>₺18.250 / ₺25.000</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#10B981] w-[73%] rounded-full"></div>
                  </div>
                  <div className="text-right mt-1 text-[10px] font-bold text-[#10B981]">%73</div>
                </div>
              </div>

              {/* 4. Tasarruf hedefleri */}
              <div role="button" tabIndex={0} onClick={() => window.location.assign("/app/goals")} onKeyDown={(event) => event.key === "Enter" && window.location.assign("/app/goals")} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col h-full cursor-pointer transition-colors hover:border-[#10B981]/40">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <Target className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <h3 className="text-lg font-bold">4. Tasarruf hedefleri</h3>
                </div>
                <p className="text-[15px] text-slate-500 leading-relaxed mb-8">
                  Kısa, orta ve uzun vadeli hedefler belirlemeni sağlar ve ilerlemeni takip eder.
                </p>
                <div className="mt-auto bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                      <span className="text-xl">🌴</span>
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-[#0F172A]">Tatil Fonu</div>
                      <div className="text-[10px] font-bold text-slate-400">₺12.500 / ₺25.000</div>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 w-[50%] rounded-full"></div>
                  </div>
                  <div className="text-right mt-1 text-[10px] font-bold text-orange-400">%50</div>
                </div>
              </div>

              {/* 5. Borç farkındalığı */}
              <div role="button" tabIndex={0} onClick={() => window.location.assign("/app/debts")} onKeyDown={(event) => event.key === "Enter" && window.location.assign("/app/debts")} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col h-full cursor-pointer transition-colors hover:border-[#10B981]/40">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <h3 className="text-lg font-bold">5. Borç farkındalığı</h3>
                </div>
                <p className="text-[15px] text-slate-500 leading-relaxed mb-8">
                  Borçlarını ve ödeme planlarını takip eder, gecikmeleri önlemene yardımcı olur.
                </p>
                <div className="mt-auto space-y-2">
                  <div className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-700">Kredi Kartı</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      ₺4.250 <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-700">Bireysel Kredi</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      ₺12.000 <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. PDF finans raporları */}
              <div role="button" tabIndex={0} onClick={() => window.location.assign("/app/reports")} onKeyDown={(event) => event.key === "Enter" && window.location.assign("/app/reports")} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col h-full cursor-pointer transition-colors hover:border-[#10B981]/40">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <h3 className="text-lg font-bold">6. PDF finans raporları</h3>
                </div>
                <p className="text-[15px] text-slate-500 leading-relaxed mb-8">
                  Detaylı finansal raporlarını PDF olarak indir ve performansını gözden geçir.
                </p>
                <div className="mt-auto bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <div className="text-[12px] font-bold text-[#0F172A]">Aylık Finans Raporu</div>
                    <div className="text-[10px] font-medium text-slate-400">Mayıs 2024</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="raporlar" className="py-24 bg-white overflow-hidden scroll-mt-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-bold text-center mb-24 text-[#0F172A]">Nasıl çalışır?</h2>
            
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 border-t-2 border-dashed border-slate-100 -translate-y-1/2 hidden lg:block -z-10"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                {[
                  {
                    num: "1",
                    icon: Upload,
                    title: "Verilerini gir",
                    desc: "Gelir, gider, borç ve hedef bilgilerini kolayca sisteme gir."
                  },
                  {
                    num: "2",
                    icon: Sparkles,
                    title: "AI analiz eder",
                    desc: "Yapay zeka verilerini analiz eder, içgörüler ve skorlar üretir."
                  },
                  {
                    num: "3",
                    icon: FileText,
                    title: "Plan oluşturur",
                    desc: "Sana özel bütçe planı ve aksiyon önerileri hazırlar."
                  },
                  {
                    num: "4",
                    icon: TrendingUp,
                    title: "Takip edersin",
                    desc: "İlerlemeni takip et, alışkanlıklarını iyileştir ve hedeflerine ulaş."
                  }
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center text-center bg-white px-4">
                    <div className="w-12 h-12 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-lg mb-8 shadow-lg shadow-[#10B981]/20 ring-8 ring-white">
                      {step.num}
                    </div>
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 shadow-sm border border-slate-100 transition-transform hover:scale-110">
                      <step.icon className="w-8 h-8 text-[#10B981]" />
                    </div>
                    <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TRUST SECTION */}
        <section id="fiyatlandirma" className="py-24 bg-[#F8FAFC] scroll-mt-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-bold text-center mb-20 text-[#0F172A]">Güvenli ve sade tasarlandı</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: ShieldCheck,
                  title: "Veri gizliliği odaklı",
                  desc: "Verilerin şifrelenir ve üçüncü taraflarla paylaşılmaz. Güvenliğin bizim için önemli."
                },
                {
                  icon: Sparkles,
                  title: "Sade finansal içgörüler",
                  desc: "Anlaşılır, sade ve eyleme dönüştürülebilir içgörüler sunar. Karmaşayı ortadan kaldırır."
                },
                {
                  icon: Info,
                  title: "Yatırım tavsiyesi vermez",
                  desc: "FinWise AI yatırım tavsiyesi vermez. Kişisel bütçe ve finansal farkındalık desteği sağlar."
                }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-5 p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                    <item.icon className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-3 text-[#0F172A]">{item.title}</h3>
                    <p className="text-slate-500 leading-relaxed text-[15px]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white pt-24 pb-12 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-20">
            {/* Brand */}
              <Link href="/" className="flex items-center gap-2 mb-6 group">
                <OwlIcon className="h-12 w-12" />
                <span className="text-2xl font-bold tracking-tight text-[#0F172A]">FinWise AI</span>
              </Link>
            
            <p className="text-slate-500 text-lg leading-relaxed mb-10">
              AI destekli kişisel finans koçu ile finansal hayatını yönetmeye başla. 
              Paranı kontrol et, hedeflerine ulaş.
            </p>

            {/* Newsletter */}
            <div className="w-full mb-12">
              <h4 className="font-bold text-[#0F172A] mb-4">Finansal ipuçlarını kaçırma</h4>
              <div className="flex flex-col sm:flex-row gap-3 p-2 border border-slate-200 rounded-3xl bg-slate-50 focus-within:bg-white focus-within:border-[#10B981] focus-within:ring-8 focus-within:ring-[#10B981]/5 transition-all max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="E-posta adresiniz" 
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  className="flex-1 px-4 py-2 bg-transparent text-sm focus:outline-none text-center sm:text-left"
                />
                <button onClick={handleNewsletterSubmit} disabled={newsletterLoading} className="bg-[#10B981] text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-[#059669] transition-all shadow-lg shadow-[#10B981]/20 disabled:opacity-60">
                  {newsletterLoading ? "Kaydediliyor..." : "Abone Ol"}
                </button>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-400 text-sm">© 2024 FinWise AI. Tüm hakları saklıdır.</p>
            <div className="flex items-center gap-8">
              <Link href="/security" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Güvenlik</Link>
              <Link href="/privacy" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Gizlilik</Link>
              <Link href="/cookies" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">Çerezler</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
