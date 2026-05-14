"use client";

import * as React from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DatePickerField } from "@/components/ui/date-picker";
import { FilterSelect } from "@/components/ui/filter-select";

type AdminReport = {
  id: string;
  title: string;
  type: "WEEKLY" | "MONTHLY";
  periodStart: string;
  periodEnd: string;
  summary: string | null;
  contentJson: string | null;
  pdfUrl: string | null;
  createdAt: string;
  user: { name: string; email: string };
};

type Stats = {
  totalReports: number;
  thisMonth: number;
  pdfReady: number;
  pdfMissing: number;
};

const formatDate = (date: string, withTime = false) =>
  new Date(date).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });

export default function AdminReportsPage() {
  const [reports, setReports] = React.useState<AdminReport[]>([]);
  const [stats, setStats] = React.useState<Stats>({ totalReports: 0, thisMonth: 0, pdfReady: 0, pdfMissing: 0 });
  const [selectedReportId, setSelectedReportId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState("ALL");
  const [status, setStatus] = React.useState("ALL");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null;
  const totalPages = Math.max(Math.ceil(total / 10), 1);

  const fetchReports = React.useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search.trim()) params.set("search", search.trim());
    if (type !== "ALL") params.set("type", type);
    if (status !== "ALL") params.set("status", status);
    if (start) params.set("start", start);
    if (end) params.set("end", end);

    try {
      const res = await fetch(`/api/admin/reports?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);

      setReports(json.data.reports);
      setStats(json.data.stats);
      setTotal(json.meta?.total ?? 0);
      setSelectedReportId((current) => current ?? json.data.reports[0]?.id ?? null);
    } catch {
      toast.error("Raporlar yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  }, [end, page, search, start, status, type]);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const runReportAction = async (action: "regenerate" | "retry-pdf") => {
    if (!selectedReport) return;

    try {
      const res = await fetch(`/api/admin/reports/${selectedReport.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message);

      toast.success(action === "regenerate" ? "Rapor yeniden oluşturuldu." : "PDF üretimi yeniden denendi.");
      await fetchReports();
    } catch {
      toast.error("İşlem tamamlanamadı.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 font-sans text-slate-900 pb-8 h-full">
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapor Yönetimi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kullanıcılar tarafından oluşturulan finans raporlarını ve PDF üretim durumlarını incele.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Rapor veya kullanıcı ara..."
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20"
            />
          </div>

          <FilterSelect
            value={type as "ALL" | "WEEKLY" | "MONTHLY"}
            onChange={(value) => { setType(value); setPage(1); }}
            options={[
              { value: "ALL", label: "Tüm Türler" },
              { value: "WEEKLY", label: "Haftalık" },
              { value: "MONTHLY", label: "Aylık" },
            ]}
            ariaLabel="Rapor türü filtresi"
            triggerClassName="w-40"
          />

          <FilterSelect
            value={status as "ALL" | "READY" | "MISSING_PDF"}
            onChange={(value) => { setStatus(value); setPage(1); }}
            options={[
              { value: "ALL", label: "Tüm Durumlar" },
              { value: "READY", label: "PDF Hazır" },
              { value: "MISSING_PDF", label: "PDF Eksik" },
            ]}
            ariaLabel="PDF durumu filtresi"
            triggerClassName="w-40"
          />

          <DatePickerField
            ariaLabel="Rapor başlangıç tarihi"
            value={start}
            onChange={(value) => {
              setStart(value);
              setPage(1);
            }}
            placeholder="Başlangıç"
            triggerClassName="h-10 w-40"
          />
          <DatePickerField
            ariaLabel="Rapor bitiş tarihi"
            value={end}
            onChange={(value) => {
              setEnd(value);
              setPage(1);
            }}
            placeholder="Bitiş"
            triggerClassName="h-10 w-40"
          />

          <button onClick={fetchReports} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] ml-auto shadow-sm">
            <Filter className="w-4 h-4" /> Filtrele
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Toplam Rapor", value: stats.totalReports, icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Bu Ay Oluşturulan", value: stats.thisMonth, icon: Calendar, color: "text-[#10B981]", bg: "bg-green-50" },
            { label: "PDF Hazır", value: stats.pdfReady, icon: Download, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "PDF Eksik", value: stats.pdfMissing, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0", item.bg)}>
                <item.icon className={cn("w-6 h-6", item.color)} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1">{item.label}</div>
                <div className="text-2xl font-bold text-slate-900 leading-none">{item.value.toLocaleString("tr-TR")}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-5 py-4 font-semibold">Rapor</th>
                  <th className="px-5 py-4 font-semibold">Kullanıcı</th>
                  <th className="px-5 py-4 font-semibold">Tür</th>
                  <th className="px-5 py-4 font-semibold">Dönem</th>
                  <th className="px-5 py-4 font-semibold">Durum</th>
                  <th className="px-5 py-4 font-semibold">Oluşturulma</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Yükleniyor...</td></tr>
                ) : reports.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Rapor bulunamadı.</td></tr>
                ) : reports.map((item) => (
                  <tr key={item.id} className={cn("border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50/70", selectedReport?.id === item.id && "bg-slate-50")} onClick={() => setSelectedReportId(item.id)}>
                    <td className="px-5 py-3 font-medium text-slate-800"><FileText className="w-4 h-4 text-[#10B981] inline-block mr-2" />{item.title}</td>
                    <td className="px-5 py-3 text-slate-600 font-medium">{item.user.email}</td>
                    <td className="px-5 py-3">{item.type === "MONTHLY" ? "Aylık" : "Haftalık"}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(item.periodStart)} - {formatDate(item.periodEnd)}</td>
                    <td className="px-5 py-3">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold", item.pdfUrl ? "text-[#10B981] bg-green-50" : "text-red-500 bg-red-50")}>
                        {item.pdfUrl ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {item.pdfUrl ? "PDF Hazır" : "PDF Eksik"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(item.createdAt, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-auto px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">{total.toLocaleString("tr-TR")} rapor</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs font-semibold text-slate-700">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(value + 1, totalPages))} className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[360px] shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full sticky top-[84px]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Rapor Detayı</h2>
            <button onClick={() => setSelectedReportId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>

          {selectedReport ? (
            <div className="p-5 flex-1 flex flex-col overflow-y-auto">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center shrink-0 text-[#10B981]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm mb-1">{selectedReport.title}</div>
                  <div className="text-[10px] font-bold text-blue-600">{selectedReport.type === "MONTHLY" ? "Aylık" : "Haftalık"} Rapor</div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs mb-6">
                <div className="flex justify-between"><span className="text-slate-500">Kullanıcı</span><span className="font-medium text-slate-900">{selectedReport.user.email}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Dönem</span><span className="font-medium text-slate-900">{formatDate(selectedReport.periodStart)} - {formatDate(selectedReport.periodEnd)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Oluşturulma</span><span className="font-medium text-slate-900">{formatDate(selectedReport.createdAt, true)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Rapor ID</span><span className="font-medium text-slate-900">{selectedReport.id}</span></div>
              </div>

              <div className="space-y-3 mb-6">
                <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">Özet</h3>
                <p className="text-xs text-slate-700 leading-relaxed">{selectedReport.summary || "Bu rapor için özet kaydı bulunmuyor."}</p>
              </div>

              <div className="space-y-3 mb-6">
                <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">PDF Durumu</h3>
                <div className={cn("rounded-lg p-4 border", selectedReport.pdfUrl ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100")}>
                  <div className={cn("flex items-center gap-1.5 text-xs font-bold mb-1", selectedReport.pdfUrl ? "text-[#10B981]" : "text-red-600")}>
                    {selectedReport.pdfUrl ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {selectedReport.pdfUrl ? "Hazır" : "PDF Eksik"}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-auto">
                <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">İşlemler</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => runReportAction("regenerate")} className="flex-1 h-9 rounded-lg border border-[#10B981] text-[#10B981] text-xs font-bold hover:bg-green-50 flex items-center justify-center gap-1.5">
                    <RefreshCcw className="w-3.5 h-3.5" /> Yeniden Oluştur
                  </button>
                  <button onClick={() => runReportAction("retry-pdf")} className="flex-1 h-9 rounded-lg bg-[#10B981] text-white text-xs font-bold hover:bg-[#059669] flex items-center justify-center gap-1.5">
                    PDF Üretimini Dene
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-slate-500">Detay görmek için bir rapor seçin.</div>
          )}
        </div>
      </div>
    </div>
  );
}
