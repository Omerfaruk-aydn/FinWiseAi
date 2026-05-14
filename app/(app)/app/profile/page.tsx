"use client";

import * as React from "react";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Save,
  HeartPulse,
  Target,
  CheckCircle2,
  Coins,
} from "lucide-react";

function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return "—";
  }
}

type UserData = {
  name: string;
  email: string;
  image?: string;
  createdAt: string;
  role?: "USER" | "ADMIN";
  currency?: string;
};

type OverviewData = {
  totalIncome: number;
  totalExpense: number;
  totalDebt: number;
  healthScore: number;
  stats?: {
    healthScore?: number;
  };
  goals?: Array<unknown> | { active?: number; length?: number } | null;
  activeGoals?: number;
};

export default function ProfilePage() {
  const [user, setUser] = React.useState<UserData | null>(null);
  const [overview, setOverview] = React.useState<OverviewData | null>(null);
  const [name, setName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [saveError, setSaveError] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/user/me").then((r) => r.json()),
      fetch("/api/analytics/overview").then((r) => r.json()),
    ])
      .then(([uData, oData]) => {
        if (uData.success) {
          setUser(uData.data);
          setName(uData.data.name ?? "");
        }
        if (oData.success) setOverview(oData.data);
      })
      .catch(() => {/* fail gracefully */})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    setSaveError(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setUser((prev) => (prev ? { ...prev, name } : prev));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setSaveError(true);
        setTimeout(() => setSaveError(false), 3000);
      }
    } catch {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const healthScore: number | null = overview?.stats?.healthScore ?? overview?.healthScore ?? null;
  const activeGoals: number | null =
    Array.isArray(overview?.goals)
      ? overview.goals.length
      : (overview?.goals?.active ?? overview?.activeGoals ?? null);

  const roleLabel = user?.role === "ADMIN" ? "Admin" : "Kullanıcı";
  const roleColor =
    user?.role === "ADMIN"
      ? "bg-purple-50 text-purple-600 border border-purple-200"
      : "bg-green-50 text-[#10B981] border border-green-200";

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 pb-8 bg-[#F8FAFC] min-h-full">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Profilim</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hesap bilgilerini görüntüle ve güncelle
        </p>
      </div>

      {isLoading ? (
        /* Skeleton loader */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-slate-100" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/4" />
              </div>
            </div>
            <div className="h-10 bg-slate-100 rounded-lg" />
            <div className="h-10 bg-slate-100 rounded-lg" />
            <div className="h-10 bg-slate-100 rounded-lg w-32 ml-auto" />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-pulse space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ── Left: Profile Info Card (2/3) ── */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
            <h2 className="text-sm font-bold text-slate-900">Profil Bilgileri</h2>

            {/* Avatar + name/role */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0 border-2 border-[#10B981]/20 select-none overflow-hidden">
                {user?.image ? (
                  <img src={user.image} alt={user?.name ?? "Profil"} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-[#10B981]">
                    {getInitials(name || user?.name || "")}
                  </span>
                )}
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">
                  {user?.name ?? "—"}
                </p>
                <span
                  className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${roleColor}`}
                >
                  <Shield className="w-3 h-3" />
                  {roleLabel}
                </span>
              </div>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adınızı girin"
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/15 transition-colors"
                />
              </div>

              {/* Email — read-only */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  E-posta
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400">
                    Salt okunur
                  </span>
                </label>
                <input
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-500 bg-slate-50 cursor-not-allowed select-all focus:outline-none"
                />
              </div>
            </div>

            {/* Save button + feedback */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {saved ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-[#10B981]">
                  <CheckCircle2 className="w-4 h-4" />
                  Değişiklikler kaydedildi
                </span>
              ) : saveError ? (
                <span className="text-sm font-medium text-red-500">
                  Kaydetme başarısız. Lütfen tekrar deneyin.
                </span>
              ) : (
                <span />
              )}

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 h-10 px-6 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Kaydediliyor…" : "Kaydet"}
              </button>
            </div>
          </div>

          {/* ── Right: Account Stats Card (1/3) ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
            <h2 className="text-sm font-bold text-slate-900">Hesap Bilgileri</h2>

            {/* Member since */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Üyelik tarihi</p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {formatDate(user?.createdAt)}
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Health Score */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <HeartPulse className="w-5 h-5 text-[#10B981]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500">Finansal sağlık skoru</p>
                {healthScore !== null ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm font-bold text-slate-900">{healthScore}</p>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#10B981]"
                        style={{ width: `${Math.min(100, healthScore)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-400">—</p>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Active Goals */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Aktif hedefler</p>
                <p className="text-sm font-bold text-slate-900">
                  {activeGoals !== null ? `${activeGoals} hedef` : "—"}
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Currency */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5 text-violet-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Para birimi</p>
                <p className="text-sm font-bold text-slate-900">
                  {user?.currency ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
