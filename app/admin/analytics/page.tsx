"use client";

import * as React from "react";
import {
  Users,
  Cpu,
  Zap,
  CheckCircle2,
  ChevronDown,
  Home,
  Bot,
  Wallet,
  Target,
  FileText,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserTrendItem {
  month: number;
  year: number;
  label: string;
  newUsers: number;
}

interface AITrendItem {
  date: string;
  requests: number;
}

interface TopAgent {
  type: string;
  count: number;
}

interface AnalyticsData {
  period: number;
  userTrend: UserTrendItem[];
  aiTrend: AITrendItem[];
  topAgents: TopAgent[];
  periodRequests: number;
  activeUsers: number;
  successRate: number;
  avgDurationMs: number;
}

// ─── Agent colour palette (cycle if more than 9 agents) ───────────────────────

const AGENT_COLORS = [
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#06B6D4",
  "#EF4444",
  "#EC4899",
  "#F97316",
  "#84CC16",
];

// Module icon map (best-effort by name substring)
const MODULE_ICONS: Record<string, React.ReactNode> = {
  dashboard: <Home className="w-3 h-3 text-slate-500" />,
  asistan: <Bot className="w-3 h-3 text-slate-500" />,
  bütçe: <Wallet className="w-3 h-3 text-slate-500" />,
  hedef: <Target className="w-3 h-3 text-slate-500" />,
  rapor: <FileText className="w-3 h-3 text-slate-500" />,
};

function agentIcon(name: string): React.ReactNode {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(MODULE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return <Bot className="w-3 h-3 text-slate-500" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: "7 Gün", value: 7 },
  { label: "30 Gün", value: 30 },
  { label: "90 Gün", value: 90 },
];

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = React.useState<7 | 30 | 90>(30);
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAnalytics = React.useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data as AnalyticsData);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const agentDist = React.useMemo(() => {
    if (!data?.topAgents?.length) return [];
    const total = data.topAgents.reduce((s, a) => s + a.count, 0);
    return data.topAgents.map((a, i) => ({
      name: a.type,
      value: a.count,
      percent: total > 0 ? Math.round((a.count / total) * 1000) / 10 : 0,
      color: AGENT_COLORS[i % AGENT_COLORS.length],
    }));
  }, [data]);

  const totalAgentRequests = agentDist.reduce((s, a) => s + a.value, 0);

  // User trend for the area chart — use userTrend (monthly new users)
  const userTrendChart = React.useMemo(
    () => (data?.userTrend ?? []).map((d) => ({ name: d.label, value: d.newUsers })),
    [data]
  );

  // AI trend
  const aiTrendChart = React.useMemo(
    () => (data?.aiTrend ?? []).map((d) => ({ name: d.date, value: d.requests })),
    [data]
  );

  // Module-usage simulation from topAgents (we map agents to modules for the bar)
  const maxModuleVal = agentDist.length > 0 ? agentDist[0].value : 1;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 pb-8 h-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sistem Analitiği</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kullanıcı büyümesi, AI kullanımı, rapor üretimi ve finansal sağlık trendlerini takip et.
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value as 7 | 30 | 90)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                period === opt.value
                  ? "bg-[#10B981] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {opt.label}
            </button>
          ))}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 border-l border-slate-100 pl-4 ml-1">
                Aylık <ChevronDown className="inline-block w-3.5 h-3.5 ml-1" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={8}
                align="end"
                className="z-50 min-w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <DropdownMenu.Item
                    key={opt.value}
                    className="cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50"
                    onSelect={() => setPeriod(opt.value as 7 | 30 | 90)}
                  >
                    {opt.label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <button
            onClick={() => fetchAnalytics(period)}
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 border-l border-slate-100 pl-4 ml-1"
            aria-label="Analitiği yenile"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 1 — 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Aktif Kullanıcı */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-[#10B981]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-1">Aktif Kullanıcı</div>
              <div className="text-2xl font-bold text-slate-900 leading-none mb-1 flex items-center gap-2">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  <>
                    {(data?.activeUsers ?? 0).toLocaleString("tr-TR")}
                    <span className="text-[10px] font-bold text-[#10B981] flex items-center">↗</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-slate-400">Son {period} güne göre</div>
            </div>
          </div>
        </div>

        {/* Günlük AI İsteği */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <Cpu className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-1">Toplam AI İsteği</div>
              <div className="text-2xl font-bold text-slate-900 leading-none mb-1 flex items-center gap-2">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  <>
                    {(data?.periodRequests ?? 0).toLocaleString("tr-TR")}
                    <span className="text-[10px] font-bold text-[#10B981] flex items-center">↗</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-slate-400">Son {period} günde</div>
            </div>
          </div>
        </div>

        {/* Ortalama Yanıt Süresi */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-1">Ortalama Yanıt Süresi</div>
              <div className="text-2xl font-bold text-slate-900 leading-none mb-1 flex items-center gap-2">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  <>
                    {data?.avgDurationMs ? `${(data.avgDurationMs / 1000).toFixed(2)}s` : "—"}
                    <span className="text-[10px] font-bold text-[#10B981] flex items-center">↘</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-slate-400">Son {period} güne göre</div>
            </div>
          </div>
        </div>

        {/* AI Başarı Oranı */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-1">AI Başarı Oranı</div>
              <div className="text-2xl font-bold text-slate-900 leading-none mb-1 flex items-center gap-2">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  <>
                    %{data?.successRate ?? 0}
                    <span className="text-[10px] font-bold text-[#10B981] flex items-center">↗</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-slate-400">Son {period} güne göre</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 — Kullanıcı Büyümesi + AI Kullanım Dağılımı */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        {/* Kullanıcı Büyümesi */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-slate-900">Kullanıcı Büyümesi</h2>
            <button className="flex items-center gap-1 text-[11px] font-medium text-slate-600 border border-slate-200 px-2 py-1 rounded hover:bg-slate-50">
              Aylık <ChevronDown className="w-3 h-3 ml-1" />
            </button>
          </div>
          <div className="h-[240px] w-full mt-2 relative">
            <div className="absolute top-0 left-10 flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 z-10">
              <div className="w-3 h-1 bg-[#10B981] rounded-sm"></div> Yeni Kullanıcı
            </div>
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userTrendChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsersAn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748B" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748B" }} />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Kullanıcı"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorUsersAn)"
                    activeDot={{ r: 6, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Agent Kullanım Dağılımı */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-slate-900">Agent Kullanım Dağılımı</h2>
          </div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : agentDist.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">Veri yok</div>
          ) : (
            <div className="flex flex-1 items-center justify-between">
              <div className="w-48 h-48 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={agentDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {agentDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-500 font-medium mb-0.5">Toplam</span>
                  <span className="text-xl font-bold text-slate-900 leading-none mb-1">
                    {totalAgentRequests.toLocaleString("tr-TR")}
                  </span>
                  <span className="text-[9px] text-slate-400">istek</span>
                </div>
              </div>

              <div className="flex-1 pl-4 space-y-3">
                {agentDist.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></div>
                      <span className="font-semibold text-slate-700 truncate max-w-[80px]">{item.name}</span>
                    </div>
                    <div className="font-bold text-slate-900 w-12 text-right">{item.value.toLocaleString("tr-TR")}</div>
                    <div className="text-slate-500 font-medium w-12 text-right">({item.percent}%)</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3 — AI Kullanım Trendi + Agent Dağılımı (bar) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* AI İstek Trendi */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-6">AI İstek Trendi ({period} Gün)</h2>
          <div className="h-[200px] w-full relative mt-2">
            <div className="absolute top-0 left-10 flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 z-10">
              <div className="w-3 h-1 bg-[#10B981] rounded-sm"></div> İstek Sayısı
            </div>
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aiTrendChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "#64748B" }}
                    dy={10}
                    interval={period <= 7 ? 0 : period <= 30 ? 4 : 9}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#64748B" }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="İstek"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReports)"
                    dot={period <= 14 ? { r: 4, fill: "#10B981", stroke: "#fff", strokeWidth: 2 } : false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* En Çok Kullanılan Agentlar (bar) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-6">En Çok Kullanılan Agentlar</h2>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          ) : agentDist.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">Veri yok</div>
          ) : (
            <div className="space-y-4">
              {agentDist.map((mod) => (
                <div key={mod.name} className="flex items-center text-xs">
                  <div className="w-36 flex items-center gap-2 font-medium text-slate-700 truncate">
                    {agentIcon(mod.name)}
                    <span className="truncate">{mod.name}</span>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="h-3 bg-slate-100 rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-[#10B981]"
                        style={{ width: `${maxModuleVal > 0 ? (mod.value / maxModuleVal) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-24 text-right font-bold text-slate-900 shrink-0">
                    {mod.value.toLocaleString("tr-TR")}{" "}
                    <span className="text-slate-500 font-medium">({mod.percent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-right mt-4 text-[9px] font-medium text-slate-400">
            Son {period} günde toplam agent kullanımına göre
          </div>
        </div>
      </div>
    </div>
  );
}

const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
