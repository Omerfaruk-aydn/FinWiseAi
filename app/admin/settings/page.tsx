"use client";

import * as React from "react";
import { 
  Settings, 
  Sparkles, 
  Shield, 
  Bell, 
  Sliders, 
  ListChecks,
  Trash2,
  Archive,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FilterSelect } from "@/components/ui/filter-select";

type AdminSettings = {
  provider: "Gemini" | "OpenAI" | "Anthropic";
  modelRouting: boolean;
  grounding: boolean;
  cache: boolean;
  blockInvestmentAdvice: boolean;
  requireDisclaimer: boolean;
  blockAssetRecommendations: boolean;
  structuredJsonValidation: boolean;
  logAiInput: boolean;
  keepErrorStack: boolean;
  logAiOutput: boolean;
  auditLogEnabled: boolean;
  dailyAiRequestLimit: number;
  dailyReportLimit: number;
  dailyPdfLimit: number;
};

const defaultSettings: AdminSettings = {
  provider: "Gemini",
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

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn("w-10 h-5 rounded-full relative cursor-pointer shrink-0 transition-colors", checked ? "bg-[#10B981]" : "bg-slate-300")}
    >
      <div className={cn("w-4 h-4 bg-white rounded-full absolute top-[2px] shadow-sm transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
    </button>
  );
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = React.useState("ai");
  const [settings, setSettings] = React.useState<AdminSettings>(defaultSettings);
  const [hasSavedSettings, setHasSavedSettings] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const generalRef = React.useRef<HTMLDivElement | null>(null);
  const aiRef = React.useRef<HTMLDivElement | null>(null);
  const securityRef = React.useRef<HTMLDivElement | null>(null);
  const limitsRef = React.useRef<HTMLDivElement | null>(null);
  const loggingRef = React.useRef<HTMLDivElement | null>(null);
  const maintenanceRef = React.useRef<HTMLDivElement | null>(null);

  const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    genel: generalRef,
    ai: aiRef,
    guvenlik: securityRef,
    limitler: limitsRef,
    denetim: loggingRef,
    bakim: maintenanceRef,
  };

  const navigateToSection = (tab: string) => {
    setActiveTab(tab);
    sectionRefs[tab]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  React.useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings", { cache: "no-store" });
        const json = await res.json();
        if (res.ok && json.success) {
          setSettings(json.data.settings);
          setHasSavedSettings(Boolean(json.data.hasSavedSettings));
        }
      } catch {
        toast.error("Admin ayarları yüklenemedi.");
      }
    }

    loadSettings();
  }, []);

  const updateSetting = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);
      toast.success("Ayarlar kaydedildi.");
    } catch {
      toast.error("Ayarlar kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const runMaintenance = async (action: "clear-cache" | "archive-logs") => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);
      toast.success(action === "clear-cache" ? "Cache temizlendi." : "AI logları arşivlendi.");
    } catch {
      toast.error("İşlem tamamlanamadı.");
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 pb-8 h-full">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Ayarları</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sistem, AI, güvenlik ve bildirim ayarlarını yönet.
        </p>
      </div>

      {!hasSavedSettings && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Kayıtlı sistem ayarı bulunamadı. Başlangıç değerleri gösteriliyor; kaydettikten sonra bu değerler denetim kaydı olarak saklanır.
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigateToSection("genel")}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors", 
            activeTab === "genel" ? "bg-green-50 text-[#10B981] border-l-4 border-[#10B981] pl-3" : "text-slate-600 hover:bg-slate-50")}
          >
            <Settings className="w-4 h-4" /> Genel
          </button>
          
          <button
            type="button"
            onClick={() => navigateToSection("ai")}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors", 
            activeTab === "ai" ? "bg-green-50 text-[#10B981] border-l-4 border-[#10B981] pl-3" : "text-slate-600 hover:bg-slate-50")}
          >
            <Sparkles className="w-4 h-4" /> AI Ayarları
          </button>

          <button
            type="button"
            onClick={() => navigateToSection("guvenlik")}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors", 
            activeTab === "guvenlik" ? "bg-green-50 text-[#10B981] border-l-4 border-[#10B981] pl-3" : "text-slate-600 hover:bg-slate-50")}
          >
            <Shield className="w-4 h-4" /> Güvenlik
          </button>

          <button
            type="button"
            onClick={() => navigateToSection("bakim")}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors", 
            activeTab === "bakim" ? "bg-green-50 text-[#10B981] border-l-4 border-[#10B981] pl-3" : "text-slate-600 hover:bg-slate-50")}
          >
            <Bell className="w-4 h-4" /> Bakım
          </button>

          <button
            type="button"
            onClick={() => navigateToSection("limitler")}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors", 
            activeTab === "limitler" ? "bg-green-50 text-[#10B981] border-l-4 border-[#10B981] pl-3" : "text-slate-600 hover:bg-slate-50")}
          >
            <Sliders className="w-4 h-4" /> Limitler
          </button>

          <button
            type="button"
            onClick={() => navigateToSection("denetim")}
            className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors", 
            activeTab === "denetim" ? "bg-green-50 text-[#10B981] border-l-4 border-[#10B981] pl-3" : "text-slate-600 hover:bg-slate-50")}
          >
            <ListChecks className="w-4 h-4" /> Denetim
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
          
          {/* Section: AI Provider & Basic Settings */}
          <div ref={generalRef} id="admin-settings-genel" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col xl:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">AI Provider</label>
                <FilterSelect
                  value={settings.provider}
                  onChange={(value) => updateSetting("provider", value as AdminSettings["provider"])}
                  options={[
                    { value: "Gemini", label: "Gemini" },
                    { value: "OpenAI", label: "OpenAI" },
                    { value: "Anthropic", label: "Anthropic" },
                  ]}
                  ariaLabel="AI sağlayıcı seçimi"
                  triggerClassName="w-full max-w-sm justify-between text-sm font-semibold text-slate-700"
                />
                <p className="text-[10px] text-slate-500 font-medium mt-1">Sistem genelinde kullanılacak AI sağlayıcısını seçin.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between max-w-sm gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Model routing enabled</h3>
                    <p className="text-[10px] text-slate-500 font-medium">İstekleri modele ve yüke göre yönlendir.</p>
                  </div>
                  <ToggleSwitch checked={settings.modelRouting} onChange={() => updateSetting("modelRouting", !settings.modelRouting)} />
                </div>

                <div className="flex items-start justify-between max-w-sm gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Grounding enabled</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Güncel bilgiler için web grounding kullan.</p>
                  </div>
                  <ToggleSwitch checked={settings.grounding} onChange={() => updateSetting("grounding", !settings.grounding)} />
                </div>

                <div className="flex items-start justify-between max-w-sm gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Cache enabled</h3>
                    <p className="text-[10px] text-slate-500 font-medium">AI yanıtlarını önbelleğe alarak performansı artır.</p>
                  </div>
                  <ToggleSwitch checked={settings.cache} onChange={() => updateSetting("cache", !settings.cache)} />
                </div>
              </div>
            </div>

            <div className="w-full xl:w-[320px] flex flex-col gap-4">
              <div className="bg-[#ECFDF5] border border-green-100 rounded-xl p-5 shadow-sm text-center flex flex-col items-center justify-center relative overflow-hidden flex-1">
                <div className="absolute right-0 top-0 w-24 h-24 bg-white rounded-bl-full opacity-30 z-0"></div>
                <Sparkles className="w-6 h-6 text-[#10B981] mb-2 z-10" />
                <div className="text-[10px] text-slate-500 font-medium z-10">Mevcut Model</div>
                <div className="text-lg font-bold text-slate-900 mb-2 z-10">{settings.provider}</div>
                <span className="text-[10px] font-bold text-[#10B981] bg-white border border-green-100 px-3 py-1 rounded-full z-10">Aktif</span>
                <div className="text-[9px] text-slate-400 mt-4 z-10">Son güncelleme: 08.05.2026 09:15</div>
              </div>
              <button onClick={saveSettings} disabled={isSaving} className="h-10 w-full rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] shadow-sm transition-colors mt-auto disabled:opacity-60">
                {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </button>
            </div>
          </div>

          {/* Section: AI Güvenlik Kuralları */}
          <div
            ref={(node) => {
              aiRef.current = node;
              securityRef.current = node;
            }}
            id="admin-settings-guvenlik"
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
          >
            <h2 className="text-sm font-bold text-slate-900 mb-6">AI Güvenlik Kuralları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              <div className="flex items-start gap-4">
                <div className="mt-0.5"><div className="w-4 h-4 rounded bg-[#10B981] flex items-center justify-center text-white"><CheckCircle2 className="w-3 h-3" /></div></div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Yatırım tavsiyesi engelle</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">AI'ın yatırım tavsiyesi vermesini engeller.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-0.5"><div className="w-4 h-4 rounded bg-[#10B981] flex items-center justify-center text-white"><CheckCircle2 className="w-3 h-3" /></div></div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Disclaimer zorunlu</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Tüm AI yanıtlarında yasal uyarı (disclaimer) zorunlu.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-0.5"><div className="w-4 h-4 rounded bg-[#10B981] flex items-center justify-center text-white"><CheckCircle2 className="w-3 h-3" /></div></div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Hisse/kripto önerisi engelle</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Hisse senedi veya kripto para önerilerini engeller.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-0.5"><div className="w-4 h-4 rounded bg-[#10B981] flex items-center justify-center text-white"><CheckCircle2 className="w-3 h-3" /></div></div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Structured JSON validation</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">AI yanıtlarının JSON şemasına uygunluğunu doğrular.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Section: Kullanım Limitleri */}
          <div ref={limitsRef} id="admin-settings-limitler" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-6">Kullanım Limitleri</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Günlük AI istek limiti</label>
                <div className="flex items-center">
                  <input type="number" value={settings.dailyAiRequestLimit} onChange={(e) => updateSetting("dailyAiRequestLimit", Number(e.target.value))} className="w-full h-10 px-3 rounded-l-lg border border-slate-200 border-r-0 text-sm font-semibold text-slate-700 focus:outline-none bg-white" />
                  <div className="h-10 px-2 border border-slate-200 rounded-r-lg bg-slate-50 flex flex-col justify-center gap-1">
                    <div className="w-2 h-2 border-l border-t border-slate-400 rotate-45 transform translate-y-0.5 cursor-pointer"></div>
                    <div className="w-2 h-2 border-r border-b border-slate-400 rotate-45 transform -translate-y-0.5 cursor-pointer"></div>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-1">Kullanıcı başına günlük maksimum istek</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Rapor üretim limiti (günlük)</label>
                <div className="flex items-center">
                  <input type="number" value={settings.dailyReportLimit} onChange={(e) => updateSetting("dailyReportLimit", Number(e.target.value))} className="w-full h-10 px-3 rounded-l-lg border border-slate-200 border-r-0 text-sm font-semibold text-slate-700 focus:outline-none bg-white" />
                  <div className="h-10 px-2 border border-slate-200 rounded-r-lg bg-slate-50 flex flex-col justify-center gap-1">
                    <div className="w-2 h-2 border-l border-t border-slate-400 rotate-45 transform translate-y-0.5 cursor-pointer"></div>
                    <div className="w-2 h-2 border-r border-b border-slate-400 rotate-45 transform -translate-y-0.5 cursor-pointer"></div>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-1">Kullanıcı başına günlük maksimum rapor</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">PDF indirme limiti (günlük)</label>
                <div className="flex items-center">
                  <input type="number" value={settings.dailyPdfLimit} onChange={(e) => updateSetting("dailyPdfLimit", Number(e.target.value))} className="w-full h-10 px-3 rounded-l-lg border border-slate-200 border-r-0 text-sm font-semibold text-slate-700 focus:outline-none bg-white" />
                  <div className="h-10 px-2 border border-slate-200 rounded-r-lg bg-slate-50 flex flex-col justify-center gap-1">
                    <div className="w-2 h-2 border-l border-t border-slate-400 rotate-45 transform translate-y-0.5 cursor-pointer"></div>
                    <div className="w-2 h-2 border-r border-b border-slate-400 rotate-45 transform -translate-y-0.5 cursor-pointer"></div>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-1">Kullanıcı başına günlük maksimum PDF</p>
              </div>

            </div>
          </div>

          {/* Section: Loglama */}
          <div ref={loggingRef} id="admin-settings-denetim" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-6">Loglama</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">AI input logla</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">AI'a gönderilen tüm girdileri logla.</p>
                </div>
                <ToggleSwitch checked={settings.logAiInput} onChange={() => updateSetting("logAiInput", !settings.logAiInput)} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Error stack sakla</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Hata stack trace bilgilerini sakla.</p>
                </div>
                <ToggleSwitch checked={settings.keepErrorStack} onChange={() => updateSetting("keepErrorStack", !settings.keepErrorStack)} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">AI output logla</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">AI yanıtlarını logla.</p>
                </div>
                <ToggleSwitch checked={settings.logAiOutput} onChange={() => updateSetting("logAiOutput", !settings.logAiOutput)} />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Admin audit log aktif</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Admin işlemlerini denetim loglarında sakla.</p>
                </div>
                <ToggleSwitch checked={settings.auditLogEnabled} onChange={() => updateSetting("auditLogEnabled", !settings.auditLogEnabled)} />
              </div>

            </div>
          </div>

          {/* Section: Danger Actions */}
          <div ref={maintenanceRef} id="admin-settings-bakim" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white text-orange-500 flex items-center justify-center shrink-0 border border-orange-200">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-orange-600 mb-0.5">Sistem cache temizle</h3>
                  <p className="text-[10px] text-orange-600/80 font-medium">Sistem genelindeki tüm önbellekleri temizler. Performansı artırabilir.</p>
                </div>
              </div>
              <button onClick={() => runMaintenance("clear-cache")} className="shrink-0 h-9 px-4 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors">
                Cache Temizle
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white text-slate-500 flex items-center justify-center shrink-0 border border-slate-200">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-0.5">AI loglarını arşivle</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Eski AI loglarını arşivleyerek disk kullanımını azaltabilirsiniz.</p>
                </div>
              </div>
              <button onClick={() => runMaintenance("archive-logs")} className="shrink-0 h-9 px-4 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 text-xs font-bold transition-colors shadow-sm">
                Arşivle
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
