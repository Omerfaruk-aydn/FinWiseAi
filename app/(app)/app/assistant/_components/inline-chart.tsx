"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Maximize2, X, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIChart } from "@/lib/ai/schemas";

const PALETTE = [
  "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B",
  "#EF4444", "#06B6D4", "#84CC16", "#EC4899",
];

function formatTick(val: number, unit?: string): string {
  if (unit === "₺" || unit === "TL") {
    if (val >= 1_000_000) return "₺" + (val / 1_000_000).toFixed(1) + "M";
    if (val >= 1_000) return "₺" + (val / 1_000).toFixed(0) + "B";
    return "₺" + val.toLocaleString("tr-TR");
  }
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + "M";
  if (val >= 1_000) return (val / 1_000).toFixed(0) + "B";
  return val.toString() + (unit ? ` ${unit}` : "");
}

function formatFull(val: number, unit?: string): string {
  if (unit === "₺" || unit === "TL") {
    return "₺" + Math.round(val).toLocaleString("tr-TR");
  }
  return Math.round(val).toLocaleString("tr-TR") + (unit ? ` ${unit}` : "");
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; color?: string }>;
  label?: string;
  unit?: string;
}

function CustomTooltip({ active, payload, label, unit }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg text-xs min-w-[120px]">
      {label && <p className="font-semibold text-slate-700 mb-1.5 border-b border-slate-100 pb-1">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color ?? "#10B981" }}
          />
          <span className="font-bold text-slate-900">{formatFull(p.value, unit)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload, unit }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-0.5">{(item as { name?: string }).name}</p>
      <p className="font-bold text-slate-900">{formatFull(item.value, unit)}</p>
    </div>
  );
}

interface InlineChartProps {
  chart: AIChart;
  className?: string;
}

export function InlineChart({ chart, className }: InlineChartProps) {
  const [expanded, setExpanded] = React.useState(false);

  const data = chart.data.map((d, i) => ({
    ...d,
    fill: d.color ?? PALETTE[i % PALETTE.length],
  }));

  const avg = data.length > 0
    ? data.reduce((s, d) => s + d.value, 0) / data.length
    : 0;

  function renderBar(height: number) {
    return (
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <defs>
          {data.map((d, i) => (
            <linearGradient key={i} id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={d.fill} stopOpacity={0.9} />
              <stop offset="100%" stopColor={d.fill} stopOpacity={0.55} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
          width={55}
          tickFormatter={(v) => formatTick(v, chart.unit)}
        />
        <Tooltip content={<CustomTooltip unit={chart.unit} />} cursor={{ fill: "#F8FAFC" }} />
        {height > 200 && (
          <ReferenceLine
            y={avg}
            stroke="#CBD5E1"
            strokeDasharray="4 3"
            label={{ value: "Ort.", position: "insideTopRight", fontSize: 10, fill: "#94A3B8" }}
          />
        )}
        <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive>
          {data.map((_, idx) => (
            <Cell key={idx} fill={`url(#bar-grad-${idx})`} />
          ))}
        </Bar>
      </BarChart>
    );
  }

  function renderLine(height: number) {
    return (
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id="line-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
          width={55}
          tickFormatter={(v) => formatTick(v, chart.unit)}
        />
        <Tooltip content={<CustomTooltip unit={chart.unit} />} />
        {height > 200 && (
          <ReferenceLine
            y={avg}
            stroke="#CBD5E1"
            strokeDasharray="4 3"
            label={{ value: "Ort.", position: "insideTopRight", fontSize: 10, fill: "#94A3B8" }}
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke="#10B981"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#fff", stroke: "#10B981", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }}
          isAnimationActive
        />
      </LineChart>
    );
  }

  function renderPie(outerRadius: number) {
    return (
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={outerRadius}
          innerRadius={outerRadius * 0.5}
          paddingAngle={2}
          isAnimationActive
        >
          {data.map((entry, idx) => (
            <Cell
              key={idx}
              fill={entry.fill}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<PieTooltip unit={chart.unit} />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(val) => (
            <span className="text-[11px] text-slate-600">{val}</span>
          )}
        />
      </PieChart>
    );
  }

  function renderChart(height: number) {
    if (chart.type === "bar") return renderBar(height);
    if (chart.type === "line") return renderLine(height);
    return renderPie(height > 200 ? 110 : 72);
  }

  // Summary stats strip
  const maxItem = data.reduce((a, b) => (a.value > b.value ? a : b), data[0]);
  const minItem = data.reduce((a, b) => (a.value < b.value ? a : b), data[0]);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <>
      <div className={cn("mt-3 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden", className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-[#10B981]" />
            <span className="text-[12px] font-semibold text-slate-800">{chart.title}</span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Büyüt"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Chart */}
        <div className="px-2 pt-2 pb-1">
          <ResponsiveContainer width="100%" height={220}>
            {renderChart(220)}
          </ResponsiveContainer>
        </div>

        {/* Stats strip */}
        {chart.type !== "pie" && data.length > 1 && (
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/40">
            {[
              { label: "En yüksek", value: maxItem?.label, sub: formatFull(maxItem?.value ?? 0, chart.unit), color: "text-emerald-600" },
              { label: "Toplam", value: formatFull(total, chart.unit), sub: `${data.length} kayıt`, color: "text-slate-700" },
              { label: "En düşük", value: minItem?.label, sub: formatFull(minItem?.value ?? 0, chart.unit), color: "text-slate-500" },
            ].map((s, i) => (
              <div key={i} className="px-3 py-2 text-center">
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">{s.label}</p>
                <p className={cn("text-[11px] font-bold mt-0.5 truncate", s.color)}>{s.value}</p>
                <p className="text-[10px] text-slate-400">{s.sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expanded modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setExpanded(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#10B981]" />
                <p className="text-sm font-bold text-slate-900">{chart.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={360}>
                {renderChart(360)}
              </ResponsiveContainer>
            </div>
            {chart.type !== "pie" && data.length > 1 && (
              <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/40">
                {[
                  { label: "En yüksek", value: maxItem?.label, sub: formatFull(maxItem?.value ?? 0, chart.unit), color: "text-emerald-600" },
                  { label: "Toplam", value: formatFull(total, chart.unit), sub: `${data.length} kayıt`, color: "text-slate-700" },
                  { label: "En düşük", value: minItem?.label, sub: formatFull(minItem?.value ?? 0, chart.unit), color: "text-slate-500" },
                ].map((s, i) => (
                  <div key={i} className="px-3 py-2.5 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{s.label}</p>
                    <p className={cn("text-sm font-bold mt-0.5 truncate", s.color)}>{s.value}</p>
                    <p className="text-[11px] text-slate-400">{s.sub}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
