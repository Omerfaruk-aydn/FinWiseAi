"use client";

import * as React from "react";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart2,
  Bell,
  Camera,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileJson,
  Loader2,
  Lock,
  LogOut,
  RefreshCw,
  Shield,
  Smartphone,
  Target,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterSelect } from "@/components/ui/filter-select";

type FeedbackState = "idle" | "loading" | "success" | "error";
type SectionId = "profil" | "finans" | "bildirimler" | "guvenlik" | "veri";
type Currency = "TRY" | "USD" | "EUR" | "GBP";
type IncomeFrequency = "MONTHLY" | "WEEKLY" | "YEARLY" | "ONE_TIME";
type FinancialGoalType =
  | "EMERGENCY_FUND"
  | "HOME"
  | "CAR"
  | "RETIREMENT"
  | "PAY_OFF_DEBT"
  | "TRAVEL"
  | "EDUCATION"
  | "OTHER";
type RiskTolerance = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";

type UserProfile = {
  city?: string | null;
  occupation?: string | null;
  incomeFrequency?: IncomeFrequency | null;
  financialGoalType?: FinancialGoalType | null;
  riskTolerance?: RiskTolerance | null;
  weeklyDigest?: boolean | null;
  budgetAlerts?: boolean | null;
  actionPlanReminders?: boolean | null;
};

type UserMe = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  currency?: Currency | null;
  sessionVersion?: number;
  lastLoginAt?: string | null;
  createdAt?: string;
  profile?: UserProfile | null;
};

type SettingsForm = {
  name: string;
  email: string;
  image: string | null;
  city: string;
  occupation: string;
  currency: Currency;
  incomeFrequency: IncomeFrequency;
  financialGoalType: FinancialGoalType;
  riskTolerance: RiskTolerance;
  weeklyDigest: boolean;
  budgetAlerts: boolean;
  actionPlanReminders: boolean;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: {
    message?: string;
    details?: unknown;
  };
  message?: string;
};

type SessionInfo = {
  id: string;
  current: boolean;
  browser: string;
  os: string;
  ip: string;
  signedInAt: string | null;
  lastActiveAt: string;
};

const AVATAR_MAX_BYTES = 650 * 1024;
const DELETE_CONFIRMATION = "HESABIMI SIL";

const DEFAULT_SETTINGS: SettingsForm = {
  name: "",
  email: "",
  image: null,
  city: "",
  occupation: "",
  currency: "TRY",
  incomeFrequency: "MONTHLY",
  financialGoalType: "EMERGENCY_FUND",
  riskTolerance: "BALANCED",
  weeklyDigest: true,
  budgetAlerts: true,
  actionPlanReminders: true,
};

const NAV_ITEMS: Array<{
  id: SectionId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "profil", label: "Profil", description: "Kimlik ve iletişim", icon: User },
  {
    id: "finans",
    label: "Finans Tercihleri",
    description: "Para birimi ve risk profili",
    icon: Wallet,
  },
  { id: "bildirimler", label: "Bildirimler", description: "Uyarı ve özetler", icon: Bell },
  { id: "guvenlik", label: "Güvenlik", description: "Şifre ve oturum", icon: Shield },
  { id: "veri", label: "Veri ve Gizlilik", description: "Dışa aktarım ve silme", icon: Lock },
];

const CURRENCY_OPTIONS: Array<{ value: Currency; label: string }> = [
  { value: "TRY", label: "TRY - Türk Lirası" },
  { value: "USD", label: "USD - Amerikan Doları" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - Sterlin" },
];

const INCOME_OPTIONS: Array<{ value: IncomeFrequency; label: string }> = [
  { value: "MONTHLY", label: "Aylık" },
  { value: "WEEKLY", label: "Haftalık" },
  { value: "YEARLY", label: "Yıllık" },
  { value: "ONE_TIME", label: "Tek seferlik / düzensiz" },
];

const GOAL_OPTIONS: Array<{ value: FinancialGoalType; label: string }> = [
  { value: "EMERGENCY_FUND", label: "Acil durum fonu" },
  { value: "HOME", label: "Ev" },
  { value: "CAR", label: "Araç" },
  { value: "RETIREMENT", label: "Emeklilik" },
  { value: "PAY_OFF_DEBT", label: "Borç kapatma" },
  { value: "TRAVEL", label: "Seyahat" },
  { value: "EDUCATION", label: "Eğitim" },
  { value: "OTHER", label: "Diğer" },
];

const RISK_OPTIONS: Array<{
  value: RiskTolerance;
  label: string;
  description: string;
}> = [
  {
    value: "CONSERVATIVE",
    label: "Temkinli",
    description: "Daha düşük risk, daha dengeli büyüme.",
  },
  {
    value: "BALANCED",
    label: "Dengeli",
    description: "Risk ve getiri arasında orta yol.",
  },
  {
    value: "AGGRESSIVE",
    label: "Agresif",
    description: "Daha yüksek risk, daha yüksek büyüme hedefi.",
  },
];

function getApiErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const body = payload as ApiEnvelope<unknown>;
    return body.error?.message ?? body.message ?? fallback;
  }

  return fallback;
}

function toSettingsForm(user: UserMe): SettingsForm {
  return {
    name: user.name ?? "",
    email: user.email ?? "",
    image: user.image ?? null,
    city: user.profile?.city ?? "",
    occupation: user.profile?.occupation ?? "",
    currency: user.currency ?? "TRY",
    incomeFrequency: user.profile?.incomeFrequency ?? "MONTHLY",
    financialGoalType: user.profile?.financialGoalType ?? "EMERGENCY_FUND",
    riskTolerance: user.profile?.riskTolerance ?? "BALANCED",
    weeklyDigest: user.profile?.weeklyDigest ?? true,
    budgetAlerts: user.profile?.budgetAlerts ?? true,
    actionPlanReminders: user.profile?.actionPlanReminders ?? true,
  };
}

function isDirty(form: SettingsForm, saved: SettingsForm | null) {
  if (!saved) return false;
  return JSON.stringify(form) !== JSON.stringify(saved);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Bilinmiyor";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Görsel okunamadı."));
    reader.readAsDataURL(file);
  });
}

function SectionCard({
  id,
  title,
  description,
  children,
  className,
}: {
  id: SectionId;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "min-w-0 scroll-mt-24 rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {hint && <span className="block text-xs font-medium text-slate-500">{hint}</span>}
    </label>
  );
}

function SelectField<T extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  disabled?: boolean;
}) {
  return (
    <FilterSelect<T>
      ariaLabel="Ayar seçimi"
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      triggerClassName="h-11 w-full rounded-xl px-3 text-sm"
    />
  );
}

function SaveButton({
  state,
  disabled,
  onClick,
  label = "Değişiklikleri Kaydet",
}: {
  state: FeedbackState;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || state === "loading"}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60",
        state === "success"
          ? "bg-emerald-600 text-white"
          : state === "error"
            ? "bg-red-500 text-white"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
      )}
    >
      {state === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
      {state === "success" && <CheckCircle2 className="h-4 w-4" />}
      {state === "error" && <AlertTriangle className="h-4 w-4" />}
      {state === "loading"
        ? "Kaydediliyor..."
        : state === "success"
          ? "Kaydedildi"
          : state === "error"
            ? "Tekrar Dene"
            : label}
    </button>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus:ring-4 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-emerald-500" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
          checked ? "left-6" : "left-1"
        )}
      />
    </button>
  );
}

function PasswordRequirement({ valid, label }: { valid: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
        valid ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      )}
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [saveState, setSaveState] = React.useState<FeedbackState>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length > 0 && hasMinLength && hasUppercase && hasNumber && passwordsMatch;

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrorMsg(null);
    setSaveState("idle");
  }

  async function handleSubmit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setErrorMsg(null);

    if (!canSubmit) {
      setErrorMsg("Yeni şifre en az 8 karakter, bir büyük harf ve bir rakam içermelidir.");
      return;
    }

    setSaveState("loading");
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = (await res.json().catch(() => ({}))) as ApiEnvelope<unknown>;

      if (!res.ok) throw new Error(getApiErrorMessage(json, "Şifre değiştirilemedi."));

      setSaveState("success");
      setTimeout(() => resetForm(), 1600);
    } catch (error) {
      setSaveState("error");
      setErrorMsg(error instanceof Error ? error.message : "Bir hata oluştu.");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      {saveState === "success" ? (
        <motion.div
          key="password-success"
          layout
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center shadow-sm"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm"
          >
            <CheckCircle2 className="h-6 w-6" />
          </motion.div>
          <h3 className="mt-3 text-sm font-bold text-emerald-900">Şifre güncellendi</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-emerald-700">
            Yeni şifreniz başarıyla kaydedildi. Birkaç saniye içinde forma geri dönülecek.
          </p>
        </motion.div>
      ) : (
    <motion.form
      key="password-form"
      layout
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.99 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-950">Şifre Değiştir</h3>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
          Yeni şifreniz güvenlik kriterlerine uygun olmalıdır.
        </p>
      </div>

      <div className="space-y-2.5">
        <FormField label="Mevcut şifre">
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 pr-11 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((value) => !value)}
              aria-label={showCurrentPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <FormField label="Yeni şifre">
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 pr-11 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((value) => !value)}
              aria-label={showNewPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <FormField label="Yeni şifre tekrar">
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 pr-11 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              aria-label={showConfirmPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <PasswordRequirement valid={hasMinLength} label="8+ karakter" />
        <PasswordRequirement valid={hasUppercase} label="Büyük harf" />
        <PasswordRequirement valid={hasNumber} label="Rakam" />
        <PasswordRequirement valid={passwordsMatch} label="Eşleşiyor" />
      </div>

      {errorMsg && (
        <p className="mt-2.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
          {errorMsg}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={resetForm}
          className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={!canSubmit || saveState === "loading"}
          className={cn(
            "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
            saveState === "error"
              ? "bg-red-500 text-white"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          )}
        >
          {saveState === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
          {saveState === "loading"
            ? "Güncelleniyor..."
            : "Güncelle"}
        </button>
      </div>
    </motion.form>
      )}
    </AnimatePresence>
  );
}

export default function SettingsPage() {
  const { update: updateSession } = useSession();
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = React.useState<SectionId>("profil");
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState<SettingsForm>(DEFAULT_SETTINGS);
  const [savedForm, setSavedForm] = React.useState<SettingsForm | null>(null);
  const [saveState, setSaveState] = React.useState<FeedbackState>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [avatarState, setAvatarState] = React.useState<FeedbackState>("idle");
  const [avatarError, setAvatarError] = React.useState<string | null>(null);

  const [sessions, setSessions] = React.useState<SessionInfo[]>([]);
  const [sessionsState, setSessionsState] = React.useState<FeedbackState>("idle");
  const [sessionsError, setSessionsError] = React.useState<string | null>(null);

  const [exportState, setExportState] = React.useState<FeedbackState>("idle");
  const [exportError, setExportError] = React.useState<string | null>(null);

  const [deletePassword, setDeletePassword] = React.useState("");
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");
  const [deleteState, setDeleteState] = React.useState<FeedbackState>("idle");
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const hasChanges = isDirty(form, savedForm);

  const setField = <K extends keyof SettingsForm>(field: K, value: SettingsForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrorMsg(null);
    if (saveState !== "idle") setSaveState("idle");
  };

  const loadSessions = React.useCallback(async () => {
    setSessionsState("loading");
    setSessionsError(null);
    try {
      const res = await fetch("/api/user/sessions");
      const json = (await res.json().catch(() => ({}))) as ApiEnvelope<{
        sessions: SessionInfo[];
      }>;

      if (!res.ok || !json.data) {
        throw new Error(getApiErrorMessage(json, "Oturum bilgileri yüklenemedi."));
      }

      setSessions(json.data.sessions);
      setSessionsState("success");
      setTimeout(() => setSessionsState("idle"), 1200);
    } catch (error) {
      setSessionsState("error");
      setSessionsError(error instanceof Error ? error.message : "Oturum bilgileri yüklenemedi.");
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const res = await fetch("/api/user/me");
        const json = (await res.json().catch(() => ({}))) as ApiEnvelope<UserMe>;

        if (!res.ok || !json.data) {
          throw new Error(getApiErrorMessage(json, "Kullanıcı bilgileri yüklenemedi."));
        }

        const nextForm = toSettingsForm(json.data);
        if (!mounted) return;

        setForm(nextForm);
        setSavedForm(nextForm);
      } catch (error) {
        if (!mounted) return;
        setErrorMsg(error instanceof Error ? error.message : "Kullanıcı bilgileri yüklenemedi.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUser();
    loadSessions();

    return () => {
      mounted = false;
    };
  }, [loadSessions]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveTab(visible.target.id as SectionId);
        }
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0.1, 0.25, 0.5] }
    );

    NAV_ITEMS.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const scrollToHashSection = () => {
      const hash = window.location.hash.replace("#", "") as SectionId | "";
      if (!hash) return;
      if (!NAV_ITEMS.some((item) => item.id === hash)) return;
      window.requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "auto", block: "start" });
      });
    };

    scrollToHashSection();
    window.addEventListener("hashchange", scrollToHashSection);

    return () => window.removeEventListener("hashchange", scrollToHashSection);
  }, []);

  function scrollToSection(id: SectionId) {
    setActiveTab(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSave() {
    setErrorMsg(null);

    const trimmedName = form.name.trim();
    if (trimmedName.length < 2) {
      setErrorMsg("Ad soyad en az 2 karakter olmalıdır.");
      return;
    }

    setSaveState("loading");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          currency: form.currency,
          city: form.city.trim() || undefined,
          occupation: form.occupation.trim() || undefined,
          incomeFrequency: form.incomeFrequency,
          financialGoalType: form.financialGoalType,
          riskTolerance: form.riskTolerance,
          weeklyDigest: form.weeklyDigest,
          budgetAlerts: form.budgetAlerts,
          actionPlanReminders: form.actionPlanReminders,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as ApiEnvelope<UserMe>;

      if (!res.ok || !json.data) throw new Error(getApiErrorMessage(json, "Ayarlar güncellenemedi."));

      const nextForm = toSettingsForm(json.data);
      setForm(nextForm);
      setSavedForm(nextForm);
      await updateSession({
        name: nextForm.name,
        currency: nextForm.currency,
        sessionVersion: json.data.sessionVersion,
      });
      setSaveState("success");
      setTimeout(() => setSaveState("idle"), 2200);
    } catch (error) {
      setSaveState("error");
      setErrorMsg(error instanceof Error ? error.message : "Bir hata oluştu.");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

  async function handleAvatarSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setAvatarError("Sadece PNG, JPG veya WebP görsel yükleyebilirsiniz.");
      event.target.value = "";
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError("Profil görseli en fazla 650 KB olmalıdır.");
      event.target.value = "";
      return;
    }

    setAvatarState("loading");
    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      const res = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      });
      const json = (await res.json().catch(() => ({}))) as ApiEnvelope<{
        image: string | null;
        name: string;
        currency: string;
        sessionVersion: number;
      }>;

      if (!res.ok || !json.data) throw new Error(getApiErrorMessage(json, "Profil görseli kaydedilemedi."));

      setForm((current) => ({ ...current, image: json.data?.image ?? null }));
      setSavedForm((current) => (current ? { ...current, image: json.data?.image ?? null } : current));
      await updateSession({
        name: json.data.name,
        currency: json.data.currency,
        sessionVersion: json.data.sessionVersion,
      });
      setAvatarState("success");
      setTimeout(() => setAvatarState("idle"), 1800);
    } catch (error) {
      setAvatarState("error");
      setAvatarError(error instanceof Error ? error.message : "Profil görseli kaydedilemedi.");
      setTimeout(() => setAvatarState("idle"), 2500);
    } finally {
      event.target.value = "";
    }
  }

  async function handleRemoveAvatar() {
    setAvatarError(null);
    setAvatarState("loading");
    try {
      const res = await fetch("/api/user/avatar", { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as ApiEnvelope<{
        image: string | null;
        name: string;
        currency: string;
        sessionVersion: number;
      }>;

      if (!res.ok || !json.data) throw new Error(getApiErrorMessage(json, "Profil görseli kaldırılamadı."));

      setForm((current) => ({ ...current, image: null }));
      setSavedForm((current) => (current ? { ...current, image: null } : current));
      await updateSession({
        name: json.data.name,
        currency: json.data.currency,
        sessionVersion: json.data.sessionVersion,
      });
      setAvatarState("success");
      setTimeout(() => setAvatarState("idle"), 1800);
    } catch (error) {
      setAvatarState("error");
      setAvatarError(error instanceof Error ? error.message : "Profil görseli kaldırılamadı.");
      setTimeout(() => setAvatarState("idle"), 2500);
    }
  }

  async function handleExportData() {
    setExportError(null);
    setExportState("loading");
    try {
      const res = await fetch("/api/user/export");
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as ApiEnvelope<unknown>;
        throw new Error(getApiErrorMessage(json, "Veriler dışa aktarılamadı."));
      }

      const blob = await res.blob();
      const fileName =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ?? "finwise-export.json";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setExportState("success");
      setTimeout(() => setExportState("idle"), 1800);
    } catch (error) {
      setExportState("error");
      setExportError(error instanceof Error ? error.message : "Veriler dışa aktarılamadı.");
      setTimeout(() => setExportState("idle"), 2500);
    }
  }

  async function handleRevokeAllSessions() {
    setSessionsError(null);
    setSessionsState("loading");
    try {
      const res = await fetch("/api/user/sessions", { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as ApiEnvelope<unknown>;
      if (!res.ok) throw new Error(getApiErrorMessage(json, "Oturumlar kapatılamadı."));

      await signOut({ callbackUrl: "/auth/login" });
    } catch (error) {
      setSessionsState("error");
      setSessionsError(error instanceof Error ? error.message : "Oturumlar kapatılamadı.");
      setTimeout(() => setSessionsState("idle"), 2500);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError(null);

    if (!deletePassword || deleteConfirmation !== DELETE_CONFIRMATION) {
      setDeleteError(`Devam etmek için şifrenizi ve ${DELETE_CONFIRMATION} onay metnini girin.`);
      return;
    }

    setDeleteState("loading");
    try {
      const res = await fetch("/api/user/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: deletePassword,
          confirmation: deleteConfirmation,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as ApiEnvelope<unknown>;

      if (!res.ok) throw new Error(getApiErrorMessage(json, "Hesap silinemedi."));

      await signOut({ callbackUrl: "/auth/login?deleted=1" });
    } catch (error) {
      setDeleteState("error");
      setDeleteError(error instanceof Error ? error.message : "Hesap silinemedi.");
      setTimeout(() => setDeleteState("idle"), 2500);
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col gap-6 overflow-x-hidden pb-8 text-slate-900">
      <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <Shield className="h-3.5 w-3.5" />
              Hesap merkezi
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Kullanıcı Ayarları
            </h1>
            <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
              Profil, finans tercihleri, bildirimler, güvenlik ve veri işlemlerini tek yerden yönetin.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div
              className={cn(
                "rounded-xl px-3 py-2 text-center text-xs font-bold",
                hasChanges ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"
              )}
            >
              {loading
                ? "Ayarlar yükleniyor"
                : hasChanges
                  ? "Kaydedilmemiş değişiklik var"
                  : "Tüm değişiklikler kayıtlı"}
            </div>
            <SaveButton state={saveState} onClick={handleSave} disabled={loading || !hasChanges} />
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="px-3 py-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Ayar Bölümleri
              </p>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",
                      active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        active ? "bg-white text-emerald-600 shadow-sm" : "bg-slate-100"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">{item.label}</span>
                      <span className="block truncate text-xs font-medium opacity-70">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          <SectionCard
            id="profil"
            title="Profil Bilgileri"
            description="Hesabınızın görünen adını, profil görselini ve temel detaylarını güncelleyin."
          >
            <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
              <div className="flex flex-col items-start gap-3">
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 text-slate-300">
                    {form.image ? (
                      <img
                        src={form.image}
                        alt={form.name || "Profil görseli"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-11 w-11" />
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={avatarState === "loading"}
                    onClick={() => avatarInputRef.current?.click()}
                    title="Profil görseli yükle"
                    className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {avatarState === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarSelected}
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={avatarState === "loading"}
                    onClick={() => avatarInputRef.current?.click()}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Yükle
                  </button>
                  {form.image && (
                    <button
                      type="button"
                      disabled={avatarState === "loading"}
                      onClick={handleRemoveAvatar}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Kaldır
                    </button>
                  )}
                </div>

                <p className="text-xs font-medium leading-5 text-slate-500">
                  PNG, JPG veya WebP. Maksimum 650 KB.
                </p>

                {avatarError && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                    {avatarError}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Ad Soyad">
                  {loading ? (
                    <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
                  ) : (
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => setField("name", event.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  )}
                </FormField>

                <FormField
                  label="E-posta"
                  hint="E-posta adresi güvenlik nedeniyle bu ekrandan değiştirilemez."
                >
                  {loading ? (
                    <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
                  ) : (
                    <input
                      type="email"
                      value={form.email}
                      disabled
                      className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500 outline-none"
                    />
                  )}
                </FormField>

                <FormField label="Şehir">
                  <input
                    type="text"
                    value={form.city}
                    disabled={loading}
                    onChange={(event) => setField("city", event.target.value)}
                    placeholder="Örn. İstanbul"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </FormField>

                <FormField label="Meslek">
                  <input
                    type="text"
                    value={form.occupation}
                    disabled={loading}
                    onChange={(event) => setField("occupation", event.target.value)}
                    placeholder="Örn. Yazılım geliştirici"
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </FormField>
            </div>
          </div>
          </SectionCard>

          <SectionCard
            id="finans"
            title="Finans Tercihleri"
            description="Analiz, öneri ve raporlamada kullanılacak kişisel finans varsayımlarını belirleyin."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Para birimi">
                <SelectField
                  value={form.currency}
                  disabled={loading}
                  onChange={(value) => setField("currency", value)}
                  options={CURRENCY_OPTIONS}
                />
              </FormField>

              <FormField label="Gelir sıklığı">
                <SelectField
                  value={form.incomeFrequency}
                  disabled={loading}
                  onChange={(value) => setField("incomeFrequency", value)}
                  options={INCOME_OPTIONS}
                />
              </FormField>

              <FormField label="Ana finansal hedef">
                <SelectField
                  value={form.financialGoalType}
                  disabled={loading}
                  onChange={(value) => setField("financialGoalType", value)}
                  options={GOAL_OPTIONS}
                />
              </FormField>

              <FormField label="Risk toleransı">
                <SelectField
                  value={form.riskTolerance}
                  disabled={loading}
                  onChange={(value) => setField("riskTolerance", value)}
                  options={RISK_OPTIONS}
                />
              </FormField>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {RISK_OPTIONS.map((option) => {
                const selected = form.riskTolerance === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={loading}
                    onClick={() => setField("riskTolerance", option.value)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                      selected
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    )}
                  >
                    <span className="text-sm font-bold">{option.label}</span>
                    <span className="mt-1 block text-xs font-medium leading-5 opacity-75">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            id="bildirimler"
            title="Bildirimler"
            description="Bildirim tercihlerinizi kaydedin. E-posta ve anlık bildirimler şu an geliştirme aşamasındadır; tercihleriniz hazır olduğunda devreye girecektir."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <BarChart2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">Haftalık finans özeti</h3>
                    <p className="mt-1 text-sm font-medium leading-5 text-slate-500">
                      Gelir, gider ve tasarruf görünümünüzü haftalık olarak alın.
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={form.weeklyDigest}
                  disabled={loading}
                  label="Haftalık finans özeti"
                  onChange={(value) => setField("weeklyDigest", value)}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">Bütçe limit uyarıları</h3>
                    <p className="mt-1 text-sm font-medium leading-5 text-slate-500">
                      Kategori limitlerine yaklaştığınızda uyarı alın.
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={form.budgetAlerts}
                  disabled={loading}
                  label="Bütçe limit uyarıları"
                  onChange={(value) => setField("budgetAlerts", value)}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4 md:col-span-2">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">
                      Aksiyon planı hatırlatıcıları
                    </h3>
                    <p className="mt-1 text-sm font-medium leading-5 text-slate-500">
                      AI tarafından önerilen görevleri ve hedef adımlarını takipte tutun.
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={form.actionPlanReminders}
                  disabled={loading}
                  label="Aksiyon planı hatırlatıcıları"
                  onChange={(value) => setField("actionPlanReminders", value)}
                />
              </div>
            </div>
          </SectionCard>

          <div id="guvenlik" className="grid scroll-mt-24 items-start gap-4 lg:grid-cols-2">
            <PasswordChangeForm />

            <div className="h-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Aktif Oturum</h3>
                  <p className="mt-1 text-sm font-medium leading-5 text-slate-500">
                    JWT tabanlı oturumlarda mevcut cihaz bilgisi gösterilir; tüm oturumları kapatmak session sürümünü yeniler.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">
                          {session.browser} · {session.os}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          IP: {session.ip}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                        Aktif
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      Giriş: {formatDateTime(session.signedInAt)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Son kontrol: {formatDateTime(session.lastActiveAt)}
                    </p>
                  </div>
                ))}

                {sessionsError && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                    {sessionsError}
                  </p>
                )}

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <button
                    type="button"
                    onClick={loadSessions}
                    disabled={sessionsState === "loading"}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sessionsState === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Yenile
                  </button>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/auth/login" })}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Bu Oturumdan Çık
                  </button>
                  <button
                    type="button"
                    onClick={handleRevokeAllSessions}
                    disabled={sessionsState === "loading"}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 xl:col-span-1"
                  >
                    <Shield className="h-4 w-4" />
                    Tüm Oturumları Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div id="veri" className="grid scroll-mt-24 items-start gap-4 lg:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FileJson className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Veri dışa aktarma</h3>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                    Profil, gelir, gider, bütçe, hedef, borç, rapor, sohbet ve bildirim verilerinizi JSON olarak indirin.
                  </p>
                </div>
              </div>

              {exportError && (
                <p className="mb-2.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                  {exportError}
                </p>
              )}

              <button
                type="button"
                disabled={exportState === "loading"}
                onClick={handleExportData}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exportState === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : exportState === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {exportState === "success" ? "İndirildi" : "JSON Olarak İndir"}
              </button>
            </div>

            <div className="h-full min-w-0 rounded-2xl border border-red-100 bg-red-50 p-3 shadow-sm">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-700">Hesabı Sil</h3>
                  <p className="mt-1 text-xs font-medium leading-5 text-red-600/80">
                    Bu işlem hesabınızı ve ilişkili finans verilerinizi kalıcı olarak siler. Geri alınamaz.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <FormField label="Mevcut şifre">
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                    className="h-10 w-full rounded-xl border border-red-100 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-400/10"
                  />
                </FormField>
                <FormField label={`Onay metni: ${DELETE_CONFIRMATION}`}>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    className="h-10 w-full rounded-xl border border-red-100 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-400/10"
                  />
                </FormField>

                {deleteError && (
                  <p className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-red-600">
                    {deleteError}
                  </p>
                )}

                <button
                  type="button"
                  disabled={
                    deleteState === "loading" ||
                    !deletePassword ||
                    deleteConfirmation !== DELETE_CONFIRMATION
                  }
                  onClick={handleDeleteAccount}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleteState === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Hesabımı Kalıcı Olarak Sil
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold text-slate-950">
                {hasChanges ? "Kaydedilmeyi bekleyen ayarlar var" : "Ayarlar güncel"}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Tüm değişiklikler profilinize tek seferde kaydedilir.
              </p>
            </div>
            <SaveButton state={saveState} onClick={handleSave} disabled={loading || !hasChanges} />
          </div>
        </main>
      </div>
    </div>
  );
}
