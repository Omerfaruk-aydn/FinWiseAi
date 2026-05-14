"use client";

import * as React from "react";
import {
  FileText,
  Calendar,
  PieChart,
  Download,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Wallet,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FilterSelect } from "@/components/ui/filter-select";
import { OwlIcon } from "@/components/brand/owl-icon";

type Report = {
  id: string;
  title: string;
  type: "WEEKLY" | "MONTHLY";
  periodStart: string;
  periodEnd: string;
  summary: string | null;
  pdfUrl: string | null;
  createdAt: string;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} – ${e.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}`;
}

export default function ReportsPage() {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedReport, setSelectedReport] = React.useState<Report | null>(null);
  const [generatingWeekly, setGeneratingWeekly] = React.useState(false);
  const [generatingMonthly, setGeneratingMonthly] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState<"ALL" | "WEEKLY" | "MONTHLY">("ALL");
  const [sortOrder, setSortOrder] = React.useState<"NEWEST" | "OLDEST" | "TITLE">("NEWEST");
  const [visibleCount, setVisibleCount] = React.useState(5);
  const previewRef = React.useRef<HTMLDivElement | null>(null);

  function openReportDetail(report: Report) {
    setSelectedReport(report);
    requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function fetchReports() {
    try {
      setError(null);
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Raporlar yüklenemedi.");
      const json = await res.json();
      const data: Report[] = json.data ?? json;
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerateReport(type: "WEEKLY" | "MONTHLY") {
    const setSending = type === "WEEKLY" ? setGeneratingWeekly : setGeneratingMonthly;
    setSending(true);
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Rapor oluşturulamadı.");
      }
      // Refresh reports list after generating
      setLoading(true);
      await fetchReports();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rapor oluşturulurken bir hata oluştu.");
    } finally {
      setSending(false);
    }
  }

  // Stat calculations
  const totalReports = reports.length;
  const monthlyReportsCount = reports.filter((r) => r.type === "MONTHLY").length;
  const weeklyReportsCount = reports.filter((r) => r.type === "WEEKLY").length;
  const lastReport = reports.length > 0 ? reports[0] : null;
  const pdfCount = reports.filter((r) => r.pdfUrl).length;
  const displayedReports = React.useMemo(() => {
    return reports
      .filter((report) => typeFilter === "ALL" || report.type === typeFilter)
      .sort((a, b) => {
        if (sortOrder === "TITLE") return a.title.localeCompare(b.title, "tr");
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return sortOrder === "NEWEST" ? bTime - aTime : aTime - bTime;
      });
  }, [reports, sortOrder, typeFilter]);
  const visibleReports = displayedReports.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 pb-8 h-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finans Raporları</h1>
          <p className="mt-1 text-sm text-slate-500">
            Haftalık ve aylık AI destekli finans raporlarını oluştur, incele ve PDF olarak indir.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleGenerateReport("WEEKLY")}
            disabled={generatingWeekly || generatingMonthly}
            className="flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm bg-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generatingWeekly ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {generatingWeekly ? "Oluşturuluyor..." : "Haftalık Rapor Oluştur"}
          </button>
          <button
            onClick={() => handleGenerateReport("MONTHLY")}
            disabled={generatingWeekly || generatingMonthly}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generatingMonthly ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {generatingMonthly ? "Oluşturuluyor..." : "Aylık Rapor Oluştur"}
          </button>
        </div>
      </div>

      {/* Row 1 — 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600 mb-1">Oluşturulan Rapor</div>
            <div className="text-2xl font-bold text-slate-900 leading-none mb-1">
              {loading ? "—" : totalReports}
            </div>
            <div className="text-[10px] text-slate-400">Toplam rapor sayısı</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-600 mb-1">Son Rapor</div>
            <div className="text-lg font-bold text-slate-900 leading-none mb-1 truncate">
              {loading ? "—" : lastReport ? lastReport.title : "Yok"}
            </div>
            <div className="text-[10px] text-slate-400">
              {lastReport ? `Oluşturulma: ${formatDate(lastReport.createdAt)}` : "Henüz rapor yok"}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
            <PieChart className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600 mb-1">Aylık Raporlar</div>
            <div className="text-2xl font-bold text-slate-900 leading-none mb-1">
              {loading ? "—" : monthlyReportsCount} <span className="text-xs text-slate-400 font-medium">adet</span>
            </div>
            <div className="text-[10px] text-slate-400">Bu yıl üretilen</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600 mb-1">PDF Mevcut</div>
            <div className="text-2xl font-bold text-slate-900 leading-none mb-1">
              {loading ? "—" : pdfCount}
            </div>
            <div className="text-[10px] text-slate-400">İndirilebilir rapor sayısı</div>
          </div>
        </div>
      </div>

      {/* Row 2 — Raporlarım + Rapor Önizleme */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5">
        {/* Raporlarım List */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-sm font-bold text-slate-900">Raporlarım</h2>
            <div className="flex items-center gap-2">
              <FilterSelect<"ALL" | "WEEKLY" | "MONTHLY">
                ariaLabel="Rapor türü filtresi"
                value={typeFilter}
                onChange={(value) => {
                  setTypeFilter(value);
                  setVisibleCount(5);
                }}
                options={[
                  { value: "ALL", label: "Tümü" },
                  { value: "WEEKLY", label: "Haftalık" },
                  { value: "MONTHLY", label: "Aylık" },
                ]}
                triggerClassName="h-8"
              />
              <FilterSelect<"NEWEST" | "OLDEST" | "TITLE">
                ariaLabel="Rapor sıralama"
                value={sortOrder}
                onChange={setSortOrder}
                options={[
                  { value: "NEWEST", label: "Tarihe göre yeni" },
                  { value: "OLDEST", label: "Tarihe göre eski" },
                  { value: "TITLE", label: "Başlığa göre" },
                ]}
                triggerClassName="h-8 min-w-40"
              />
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#10B981]" />
              <span className="text-sm font-medium">Raporlar yükleniyor...</span>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500">
              <AlertTriangle className="w-8 h-8" />
              <span className="text-sm font-medium">{error}</span>
              <button
                onClick={fetchReports}
                className="mt-1 px-4 py-2 rounded-lg border border-red-200 text-xs font-bold text-red-600 bg-white hover:bg-red-50"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && displayedReports.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <FileText className="w-8 h-8" />
              <span className="text-sm font-medium">Henüz hiç rapor oluşturulmadı.</span>
              <p className="text-xs text-slate-400">Yukarıdaki butonlarla ilk raporunuzu oluşturun.</p>
            </div>
          )}

          {/* Reports list */}
          {!loading && !error && displayedReports.length > 0 && (
            <div className="space-y-4 flex-1">
              {visibleReports.map((report, idx) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={cn(
                    "rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row gap-4 transition-colors hover:border-[#10B981] cursor-pointer",
                    selectedReport?.id === report.id
                      ? "border-[#10B981] shadow-sm bg-green-50/10"
                      : "bg-white"
                  )}
                >
                  <div className="w-12 h-12 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center shrink-0 text-[#10B981]">
                    <FileText className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-slate-900 text-sm">{report.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          report.type === "MONTHLY"
                            ? "text-blue-600 bg-blue-50 border-blue-100"
                            : "text-orange-600 bg-orange-50 border-orange-100"
                        )}
                      >
                        {report.type === "MONTHLY" ? "Aylık" : "Haftalık"}
                      </span>
                      <span className={cn("flex items-center gap-1 text-[10px] font-bold", report.pdfUrl ? "text-[#10B981]" : "text-amber-500")}>
                        {report.pdfUrl ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {report.pdfUrl ? "PDF Hazır" : "PDF Bekliyor"}
                      </span>
                    </div>
                    {report.summary && (
                      <p className="text-xs text-slate-600 font-medium mb-4 line-clamp-2">
                        {report.summary}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[10px] font-medium text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(report.createdAt)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {formatPeriod(report.periodStart, report.periodEnd)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col justify-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          openReportDetail(report);
                        }}
                      >
                        Detay
                      </button>
                      {report.pdfUrl ? (
                        <a
                          href={report.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 rounded-lg bg-[#10B981] text-white text-xs font-bold hover:bg-[#059669] flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF İndir
                        </a>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF Yok
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && displayedReports.length > visibleReports.length && (
            <div className="mt-6 flex justify-center border-t border-slate-100 pt-4">
              <button onClick={() => setVisibleCount((count) => count + 5)} className="text-xs font-bold text-slate-600 flex items-center gap-1 hover:text-slate-900">
                Daha fazla yükle <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Rapor Önizleme */}
        <div ref={previewRef} className="bg-slate-50/50 rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-slate-900">Rapor Önizleme</h2>
          </div>

          {selectedReport ? (
            <div className="bg-white rounded-lg border border-slate-200 shadow-md p-6 flex-1 flex flex-col gap-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-1.5">
                  <OwlIcon className="h-5 w-5" />
                  <span className="font-bold text-slate-900 text-xs">FinWise AI</span>
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  Oluşturulma: {formatDate(selectedReport.createdAt)}
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900 mb-1">{selectedReport.title}</h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  {formatPeriod(selectedReport.periodStart, selectedReport.periodEnd)}
                </p>
              </div>

              {selectedReport.summary && (
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-green-50 flex items-center justify-center text-[#10B981] shrink-0 mt-0.5">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 mb-1">Dönem Özeti</div>
                    <p className="text-[9px] text-slate-600 leading-relaxed font-medium">
                      {selectedReport.summary}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 mb-1">Dönem</div>
                  <p className="text-[9px] text-slate-600 font-medium leading-relaxed">
                    {formatPeriod(selectedReport.periodStart, selectedReport.periodEnd)}
                  </p>
                  <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                    Tür: {selectedReport.type === "MONTHLY" ? "Aylık Rapor" : "Haftalık Rapor"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={cn("w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5", selectedReport?.pdfUrl ? "bg-green-50 text-[#10B981]" : "bg-amber-50 text-amber-500")}>
                  {selectedReport?.pdfUrl ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 mb-1">Durum</div>
                  <span className={cn("text-[9px] font-bold", selectedReport?.pdfUrl ? "text-[#10B981]" : "text-amber-500")}>
                    {selectedReport?.pdfUrl ? "PDF hazır" : "PDF bekliyor"}
                  </span>
                  {selectedReport.pdfUrl && (
                    <div className="mt-2">
                      <a
                        href={selectedReport.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#10B981] text-white text-[9px] font-bold hover:bg-[#059669]"
                      >
                        <Download className="w-3 h-3" /> PDF İndir
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom gradient fade for visual balance */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
            </div>
          ) : (
            /* Empty preview state */
            <div className="bg-white rounded-lg border border-slate-200 shadow-md p-6 flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
              <FileText className="w-10 h-10 text-slate-200" />
              <p className="text-xs font-medium text-center">
                Önizleme için listeden bir rapor seçin.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium justify-center">
        <Info className="w-3.5 h-3.5" />
        Raporlar yatırım tavsiyesi içermez; kişisel bütçe ve finansal farkındalık desteği sağlar.
      </div>
    </div>
  );
}

const Info = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);
