"use client";

import * as React from "react";
import {
  Search,
  Calendar,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Brain,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X,
  Copy,
  Loader2
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
import { FilterSelect } from "@/components/ui/filter-select";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AILog {
  id: string;
  userId: string;
  type: string;
  isError: boolean;
  errorMessage: string | null;
  durationMs: number | null;
  score: number | null;
  createdAt: string;
  user: { name: string | null; email: string } | null;
}

interface ApiMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).replace(",", "");
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  return `${ms}ms`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminAILogsPage() {
  // Data state
  const [logs, setLogs] = React.useState<AILog[]>([]);
  const [meta, setMeta] = React.useState<ApiMeta>({ total: 0, page: 1, limit: 20, hasMore: false });
  const [loading, setLoading] = React.useState(true);

  // Filter state
  const [search, setSearch] = React.useState("");
  const [agentFilter, setAgentFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"" | "true" | "false">("");
  const [page, setPage] = React.useState(1);

  // Detail panel
  const [selectedLogId, setSelectedLogId] = React.useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchLogs = React.useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: "20" });
      if (agentFilter) params.set("type", agentFilter);
      if (statusFilter !== "") params.set("isError", statusFilter);

      const res = await fetch(`/api/admin/ai-logs?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setLogs(json.data as AILog[]);
        setMeta(json.meta as ApiMeta);
        // Auto-select first log
        if (json.data.length > 0 && currentPage === 1) {
          setSelectedLogId((json.data as AILog[])[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [agentFilter, statusFilter]);

  React.useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [agentFilter, statusFilter, fetchLogs]);

  // ── Derived / filtered data ─────────────────────────────────────────────────

  const filteredLogs = React.useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        (l.user?.email ?? "").toLowerCase().includes(q) ||
        l.type.toLowerCase().includes(q)
    );
  }, [logs, search]);

  // Stat calculations from current page data
  const totalLogs = meta.total;
  const successCount = logs.filter((l) => !l.isError).length;
  const errorCount = logs.filter((l) => l.isError).length;
  const successRate =
    logs.length > 0
      ? Math.round((successCount / logs.length) * 1000) / 10
      : 0;
  const avgDuration =
    logs.length > 0
      ? Math.round(
          logs.reduce((sum, l) => sum + (l.durationMs ?? 0), 0) / logs.length
        )
      : 0;

  // All agent types from current data
  const agentTypes = React.useMemo(
    () => Array.from(new Set(logs.map((l) => l.type))).sort(),
    [logs]
  );

  // Selected log detail
  const selectedLog = filteredLogs.find((l) => l.id === selectedLogId) ?? null;

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));
  const visiblePages = React.useMemo(() => {
    const pages: number[] = [];
    for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) {
      pages.push(p);
    }
    return pages;
  }, [page, totalPages]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchLogs(newPage);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row gap-6 font-sans text-slate-900 pb-8 h-full">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Log Denetimi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Agent çıktıları, kullanıcı istekleri, hata durumları ve performans metriklerini incele.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Kullanıcı veya agent ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/20"
            />
          </div>

          {/* Agent type filter */}
          <FilterSelect
            value={agentFilter || "ALL"}
            onChange={(value) => setAgentFilter(value === "ALL" ? "" : value)}
            options={[
              { value: "ALL", label: "Tüm Agentlar" },
              ...agentTypes.map((t) => ({ value: t, label: t })),
            ]}
            ariaLabel="Agent filtresi"
            triggerClassName="w-44"
          />

          <FilterSelect
            value={statusFilter === "" ? "ALL" : statusFilter}
            onChange={(value) => setStatusFilter(value === "ALL" ? "" : (value as "" | "true" | "false"))}
            options={[
              { value: "ALL", label: "Başarılı / Hatalı" },
              { value: "false", label: "Başarılı" },
              { value: "true", label: "Hatalı" },
            ]}
            ariaLabel="Durum filtresi"
            triggerClassName="w-40"
          />

          <button
            onClick={() => fetchLogs(page)}
            className="flex items-center justify-between w-56 h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 bg-white"
            aria-label="Logları yenile"
          >
            <Calendar className="w-4 h-4 text-slate-400" /> Son 30 Gün <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => fetchLogs(page)}
            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#10B981] text-white text-sm font-bold hover:bg-[#059669] shadow-sm ml-auto"
          >
            Filtrele
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
              <Brain className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="text-xs font-medium text-slate-600 mb-1">Toplam Log</div>
            <div className="text-2xl font-bold text-slate-900 mb-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" /> : totalLogs.toLocaleString("tr-TR")}
            </div>
            <div className="text-[10px] font-bold text-[#10B981] flex items-center gap-1 justify-center">
              <span className="w-3 h-3 flex items-center justify-center">↗</span> Güncel veriler
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="text-xs font-medium text-slate-600 mb-1">Başarı Oranı</div>
            <div className="text-2xl font-bold text-slate-900 mb-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" /> : `%${successRate}`}
            </div>
            <div className="text-[10px] font-bold text-[#10B981] flex items-center gap-1 justify-center">
              <span className="w-3 h-3 flex items-center justify-center">↗</span> Bu sayfadaki kayıtlar
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-xs font-medium text-slate-600 mb-1">Ort. Süre</div>
            <div className="text-2xl font-bold text-slate-900 mb-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" /> : `${avgDuration}ms`}
            </div>
            <div className="text-[10px] font-bold text-[#10B981] flex items-center gap-1 justify-center">
              <span className="w-3 h-3 flex items-center justify-center">↘</span> Bu sayfadaki kayıtlar
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-xs font-medium text-slate-600 mb-1">Hatalı Sayısı</div>
            <div className="text-2xl font-bold text-slate-900 mb-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" /> : errorCount}
            </div>
            <div className="text-[10px] font-bold text-red-500 flex items-center gap-1 justify-center">
              <span className="w-3 h-3 flex items-center justify-center">↗</span> Bu sayfadaki kayıtlar
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-5 py-4 font-semibold">Tarih <ChevronDown className="w-3 h-3 inline-block" /></th>
                  <th className="px-5 py-4 font-semibold">Kullanıcı</th>
                  <th className="px-5 py-4 font-semibold">Agent</th>
                  <th className="px-5 py-4 font-semibold text-center">Durum</th>
                  <th className="px-5 py-4 font-semibold text-center">Süre</th>
                  <th className="px-5 py-4 font-semibold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <div className="text-xs">Yükleniyor...</div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-xs">
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className={cn(
                        "border-b border-slate-50 last:border-0 cursor-pointer transition-colors hover:bg-slate-50/50",
                        selectedLogId === log.id && "bg-slate-50/80"
                      )}
                      onClick={() => setSelectedLogId(log.id)}
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-700">{formatDate(log.createdAt)}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{log.user?.email ?? log.userId}</td>
                      <td className="px-5 py-3.5">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">{log.type}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border",
                          !log.isError
                            ? "text-[#10B981] bg-green-50 border-green-100"
                            : "text-red-500 bg-red-50 border-red-100"
                        )}>
                          {!log.isError ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {!log.isError ? "Başarılı" : "Hatalı"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium text-slate-600">{formatDuration(log.durationMs)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            className="px-3 py-1 text-[10px] font-bold border border-slate-200 rounded hover:bg-slate-50 text-slate-600 shadow-sm"
                            onClick={(e) => { e.stopPropagation(); setSelectedLogId(log.id); }}
                          >
                            Detay
                          </button>
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button
                                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                onClick={(event) => event.stopPropagation()}
                                aria-label={`${log.id} log menüsü`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content
                                sideOffset={8}
                                align="end"
                                className="z-50 min-w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
                              >
                                <DropdownMenu.Item
                                  className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50"
                                  onSelect={() => setSelectedLogId(log.id)}
                                >
                                  Detayı Aç
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                  className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50"
                                  onSelect={() => navigator.clipboard?.writeText(log.id).catch(() => {})}
                                >
                                  Log ID kopyala
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                  className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50"
                                  onSelect={() => navigator.clipboard?.writeText(log.user?.email ?? log.userId).catch(() => {})}
                                >
                                  Kullanıcı bilgisini kopyala
                                </DropdownMenu.Item>
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-auto px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Toplam {meta.total.toLocaleString("tr-TR")} kayıt</span>
            <div className="flex items-center gap-1">
              <button
                className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              {page > 3 && (
                <>
                  <button className="w-6 h-6 rounded text-slate-600 text-xs font-medium flex items-center justify-center hover:bg-slate-50" onClick={() => handlePageChange(1)}>1</button>
                  {page > 4 && <span className="text-xs text-slate-400">...</span>}
                </>
              )}
              {visiblePages.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={cn(
                    "w-6 h-6 rounded text-xs font-medium flex items-center justify-center",
                    p === page
                      ? "bg-[#10B981] text-white border border-[#10B981]"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {p}
                </button>
              ))}
              {page < totalPages - 2 && (
                <>
                  {page < totalPages - 3 && <span className="text-xs text-slate-400">...</span>}
                  <button className="w-6 h-6 rounded text-slate-600 text-xs font-medium flex items-center justify-center hover:bg-slate-50" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
                </>
              )}
              <button
                className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"
                onClick={() => handlePageChange(page + 1)}
                disabled={!meta.hasMore}
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-2 border border-slate-200 rounded px-2 py-1 bg-white">
              <span className="text-[10px] text-slate-600 font-medium">20 / sayfa</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (Sidebar) - AI Log Detayı */}
      <div className="w-full lg:w-[420px] shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full sticky top-[84px]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
            <h2 className="text-sm font-bold text-slate-900">AI Log Detayı</h2>
            <button className="text-slate-400 hover:text-slate-600" onClick={() => setSelectedLogId(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex-1 flex flex-col gap-6 overflow-y-auto">
            {!selectedLog ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs text-center">
                Detaylarını görmek için<br />bir log satırına tıklayın.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium mb-1">Tarih</div>
                    <div className="text-xs font-bold text-slate-900">{formatDate(selectedLog.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium mb-1">Durum</div>
                    {selectedLog.isError ? (
                      <div className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded w-max">Hatalı</div>
                    ) : (
                      <div className="text-[10px] font-bold text-[#10B981] bg-green-50 border border-green-100 px-2 py-0.5 rounded w-max">Başarılı</div>
                    )}
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium mb-1">Agent</div>
                    <div className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-max">{selectedLog.type}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium mb-1">Süre</div>
                    <div className="text-xs font-bold text-slate-900">{formatDuration(selectedLog.durationMs)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-medium mb-1">Kullanıcı</div>
                    <div className="text-xs font-bold text-slate-900 truncate">{selectedLog.user?.email ?? selectedLog.userId}</div>
                  </div>
                  {selectedLog.score !== null && (
                    <div>
                      <div className="text-[10px] text-slate-500 font-medium mb-1">Skor</div>
                      <div className="text-xs font-bold text-slate-900">{selectedLog.score}</div>
                    </div>
                  )}
                </div>

                {selectedLog.isError && selectedLog.errorMessage && (
                  <div>
                    <div className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
                      Hata Mesajı
                      <button
                        className="text-slate-400 hover:text-slate-600"
                        onClick={() => navigator.clipboard.writeText(selectedLog.errorMessage ?? "")}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-[10px] font-mono text-red-600 whitespace-pre-wrap overflow-x-auto">
                      {selectedLog.errorMessage}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold text-slate-900 mb-1">Log ID</div>
                  <p className="text-[10px] text-slate-500 font-mono break-all">{selectedLog.id}</p>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-900 mb-1">Hata mesajı</div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {selectedLog.errorMessage ?? "Yok"}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto">
                  <div className="text-[10px] font-bold text-slate-700">Durum kontrolü</div>
                  {selectedLog.isError ? (
                    <div className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <X className="w-3 h-3" /> Hatalı
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-[#10B981] bg-green-50 border border-green-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Başarılı
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
