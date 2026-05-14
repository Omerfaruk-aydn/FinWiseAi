"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  className?: string;
  accentColor?: "accent" | "warning" | "danger" | "info";
  loading?: boolean;
}

const accentMap: Record<string, { bg: string; text: string; iconBg: string }> = {
  accent: {
    bg: "bg-green-50",
    text: "text-accent",
    iconBg: "bg-green-100",
  },
  warning: {
    bg: "bg-yellow-50",
    text: "text-warning",
    iconBg: "bg-yellow-100",
  },
  danger: {
    bg: "bg-red-50",
    text: "text-danger",
    iconBg: "bg-red-100",
  },
  info: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    iconBg: "bg-blue-100",
  },
};

function StatCard({
  icon,
  title,
  value,
  trend,
  trendLabel,
  className,
  accentColor = "accent",
  loading = false,
}: StatCardProps) {
  const colors = accentMap[accentColor];

  const trendIcon =
    trend === undefined ? null : trend > 0 ? (
      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
    ) : trend < 0 ? (
      <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
    ) : (
      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
    );

  const trendColor =
    trend === undefined
      ? ""
      : trend > 0
      ? "text-accent"
      : trend < 0
      ? "text-danger"
      : "text-muted";

  if (loading) {
    return (
      <div className={cn("stat-card", className)} aria-busy="true">
        <div className="flex items-start justify-between">
          <div className="skeleton h-9 w-9 rounded-md" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-7 w-28 rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("stat-card", className)}
    >
      <div className="flex items-start justify-between">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-md", colors.iconBg, colors.text)}>
          {icon}
        </div>

        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
            {trendIcon}
            <span>
              {trend > 0 ? "+" : ""}
              {trend.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{title}</p>
        <p className="mt-0.5 text-h3 font-semibold text-primary">{value}</p>
        {trendLabel && (
          <p className="mt-1 text-xs text-muted">{trendLabel}</p>
        )}
      </div>
    </motion.div>
  );
}

export { StatCard };
export type { StatCardProps };
