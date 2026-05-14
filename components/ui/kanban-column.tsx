"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  title: string;
  description?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  dueInDays?: number;
  completed?: boolean;
  onStatusChange?: () => void;
  className?: string;
}

const priorityConfig = {
  HIGH: { label: "Yüksek", className: "bg-red-100 text-danger" },
  MEDIUM: { label: "Orta", className: "bg-yellow-100 text-warning" },
  LOW: { label: "Düşük", className: "bg-green-100 text-accent" },
};

function KanbanCard({
  title,
  description,
  priority,
  dueInDays,
  completed,
  onStatusChange,
  className,
}: KanbanCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-white p-3 shadow-sm transition-shadow hover:shadow-card",
        completed && "opacity-60",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={cn("text-sm font-medium text-primary leading-snug", completed && "line-through")}>{title}</p>
        {priority && (
          <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold", priorityConfig[priority].className)}>
            {priorityConfig[priority].label}
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-muted leading-relaxed mb-2">{description}</p>
      )}

      <div className="flex items-center justify-between">
        {dueInDays !== undefined && (
          <span className={cn("text-xs", dueInDays <= 1 ? "text-danger" : "text-muted")}>
            {dueInDays === 0 ? "Bugün" : dueInDays === 1 ? "Yarın" : `${dueInDays} gün içinde`}
          </span>
        )}
        {onStatusChange && (
          <button
            onClick={onStatusChange}
            className="ml-auto text-xs text-accent hover:underline"
          >
            {completed ? "Geri al" : "Tamamla"}
          </button>
        )}
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  title: string;
  count?: number;
  accentColor?: "default" | "warning" | "success";
  children: React.ReactNode;
  className?: string;
}

function KanbanColumn({ title, count, accentColor = "default", children, className }: KanbanColumnProps) {
  const headerColors = {
    default: "bg-secondary/60 text-muted",
    warning: "bg-yellow-50 text-warning",
    success: "bg-green-50 text-accent",
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className={cn("flex items-center justify-between rounded-lg px-3 py-2", headerColors[accentColor])}>
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        {count !== undefined && (
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold">{count}</span>
        )}
      </div>
      <div className="flex flex-col gap-2 min-h-[120px]">
        {children}
      </div>
    </div>
  );
}

export { KanbanColumn, KanbanCard };
export type { KanbanColumnProps, KanbanCardProps };
