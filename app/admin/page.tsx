"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Activity,
  Bot,
  FileText,
  HeartPulse,
  Server,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  Clock,
  UserCheck,
  CheckCircle2
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
import { cn } from "@/lib/utils";
import { FilterSelect } from "@/components/ui/filter-select";

type ActivityRow = {
  id: string;
  user: string;
  action: string;
  time: string;
  avatar: string;
  bg: string;
};

type ErrorRow = {
  id: string;
  time: string;
  agent: string;
  status: string;
  statusColor: string;
  desc: string;
};

type OverviewData = {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  totalTransactions: number;
  totalAIRequests: number;
  totalReports: number;
  avgHealthScore: number;
  period: number;
  userTrend: Array<{ name: string; value: number }>;
  agentDistribution: Array<{ name: string; value: number; count: number; color: string }>;
  recentActivities: ActivityRow[];
  errorLogs: ErrorRow[];
  systemHealth: {
    apiUptime: number;
    aiSuccessRate: number;
    avgResponseTime: number;
    errorRate: number;
  };
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = React.useState<OverviewData | null>(null);
  const [period, setPeriod] = React.useState(30);

  React.useEffect(() => {
    fetch(`/api/admin/overview?period=${period}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setOverview(json.data);
      })
      .catch(() => { /* veri yüklenemedi — overview null kalır, UI boş gösterir */ });
  }, [period]);

  const usageData = overview?.userTrend ?? [];
  const agentData = overview?.agentDistribution ?? [];
  const activityRows = overview?.recentActivities ?? [];
  const errorRows = overview?.errorLogs ?? [];
  const systemHealth = overview?.systemHealth ?? {
    apiUptime: 0,
    aiSuccessRate: 0,
    avgResponseTime: 0,
    errorRate: 0,
  };

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 pb-8 h-full">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          FinWise AI sistem kullanımı, AI performansı ve kullanıcı aktivitelerini izle.
        </p>
      </div>

      {/* Row 1 — 5 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="text-xs font-semibold text-slate-600">Toplam Kullanıcı</div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {overview ? overview.totalUsers.toLocaleString("tr-TR") : "—"}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#10B981]">
            <TrendingUp className="w-3 h-3" /> Bu ay +{overview ? overview.newUsersThisMonth : "—"}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="text-xs font-semibold text-slate-600">Aktif Kullanıcı</div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {overview ? overview.activeUsers.toLocaleString("tr-TR") : "—"}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#10B981]">
            <TrendingUp className="w-3 h-3" /> Son 30 gün
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xs font-semibold text-slate-600">AI İstek Sayısı</div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {overview ? overview.totalAIRequests.toLocaleString("tr-TR") : "—"}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#10B981]">
            <TrendingUp className="w-3 h-3" /> Toplam
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xs font-semibold text-slate-600">Oluşturulan Rapor</div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {overview ? overview.totalReports.toLocaleString("tr-TR") : "—"}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#10B981]">
            <TrendingUp className="w-3 h-3" /> Toplam
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <HeartPulse className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-xs font-semibold text-slate-600">Ortalama Sağlık Skoru</div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {overview ? overview.avgHealthScore : "—"}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
            Ortalama skor
          </div>
        </div>
      </div>

      {/* Row 2 — Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        {/* Kullanıcı Artışı */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Kullanıcı Artışı</h2>
              <div className="text-[10px] text-slate-400 font-medium">Son {period} gun</div>
            </div>
            <FilterSelect<"7" | "30" | "90">
              value={String(period) as "7" | "30" | "90"}
              onChange={(value) => setPeriod(Number(value))}
              options={[
                { value: "7", label: "Son 7 Gün" },
                { value: "30", label: "Son 30 Gün" },
                { value: "90", label: "Son 90 Gün" },
              ]}
              ariaLabel="Admin dashboard dönem seçimi"
              triggerClassName="h-7 min-w-28 px-2.5 text-[10px] font-medium text-slate-600"
            />
          </div>
          <div className="h-[200px] w-full mt-2 relative">
            {/* Legend inside chart */}
            <div className="absolute top-0 left-10 flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 z-10">
              <div className="w-2 h-0.5 bg-[#10B981]"></div> Toplam Kullanıcı
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B' }} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" dot={{ r: 3, fill: "#10B981" }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Kullanım Dağılımı */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">AI Kullanım Dağılımı</h2>
              <div className="text-[10px] text-slate-400 font-medium">Son {period} gun</div>
            </div>
          </div>
          <div className="flex items-center flex-1">
            <div className="w-40 h-40 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={agentData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                    {agentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-500 font-medium mb-0.5">Toplam</span>
                <span className="text-base font-bold text-slate-900 leading-none">
                  {overview ? overview.totalAIRequests.toLocaleString("tr-TR") : "—"}
                </span>
                <span className="text-[9px] text-slate-400">istek</span>
              </div>
            </div>

            <div className="flex-1 pl-6 space-y-3">
              {agentData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <div className="font-bold text-slate-900">
                    {overview ? item.count.toLocaleString("tr-TR") : "-"}
                    {" "}<span className="text-slate-400 font-medium">({item.value}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 — Son Kullanıcı Aktiviteleri + Sistem Sağlığı */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
        {/* Son Kullanıcı Aktiviteleri */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Son Kullanıcı Aktiviteleri</h2>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-3 font-semibold">Kullanıcı</th>
                  <th className="pb-3 font-semibold">İşlem</th>
                  <th className="pb-3 font-semibold text-right">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {activityRows.map(item => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5 font-medium text-slate-800">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0", item.bg)}>
                          {item.avatar}
                        </div>
                        {item.user}
                      </div>
                    </td>
                    <td className="py-2.5 font-medium text-slate-600">{item.action}</td>
                    <td className="py-2.5 text-right text-slate-500">{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-50">
            <button onClick={() => router.push("/admin/users")} className="text-[10px] font-bold text-[#10B981] hover:underline flex items-center gap-1">
              Tüm aktiviteleri görüntüle <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Sistem Sağlığı */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Sistem Sağlığı</h2>
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-[#10B981] shrink-0 border border-green-100">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 mb-0.5">API uptime</div>
                  <div className="text-[9px] text-slate-500">Son {period} gun</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                %{systemHealth.apiUptime.toFixed(2)}
                <span className="text-[9px] text-[#10B981] font-semibold flex items-center">↑ %0.02</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-[#10B981] shrink-0 border border-green-100">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 mb-0.5">AI success rate</div>
                  <div className="text-[9px] text-slate-500">Son {period} gun</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                %{systemHealth.aiSuccessRate.toFixed(2)}
                <span className="text-[9px] text-[#10B981] font-semibold flex items-center">↑ %1.23</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 border border-blue-100">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 mb-0.5">Average response time</div>
                  <div className="text-[9px] text-slate-500">Son {period} gun</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                {systemHealth.avgResponseTime}ms
                <span className="text-[9px] text-red-500 font-semibold flex items-center">↑ %8.7</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-500 shrink-0 border border-red-100">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 mb-0.5">Error rate</div>
                  <div className="text-[9px] text-slate-500">Son {period} gun</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                %{systemHealth.errorRate.toFixed(2)}
                <span className="text-[9px] text-[#10B981] font-semibold flex items-center">↓ -0.12</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4 — Son AI Hataları */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Son AI Hataları</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="pb-3 font-semibold">Tarih</th>
                <th className="pb-3 font-semibold">Agent</th>
                <th className="pb-3 font-semibold text-center">Durum</th>
                <th className="pb-3 font-semibold">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {errorRows.map(item => (
                <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="py-3 font-medium text-slate-700">{item.time}</td>
                  <td className="py-3 font-semibold text-slate-800">{item.agent}</td>
                  <td className="py-3 text-center">
                    <span className={cn("inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded", item.statusColor)}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 font-medium">{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-center border-t border-slate-50 pt-3">
          <button onClick={() => router.push("/admin/ai-logs")} className="text-[10px] font-bold text-[#10B981] hover:underline flex items-center gap-1">
            Tüm hataları görüntüle <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

    </div>
  );
}
