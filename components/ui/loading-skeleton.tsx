import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

function Skeleton({ className, width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    />
  );
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3 rounded"
          style={{ width: i === lines - 1 ? "70%" : "100%" }}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("stat-card", className)} aria-hidden="true">
      <div className="flex items-start justify-between">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-4 w-14 rounded" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-7 w-28 rounded" />
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn("w-full", className)} aria-hidden="true">
      <div className="flex gap-4 border-b border-border pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1 rounded" />
        ))}
      </div>
      <div className="space-y-0.5 pt-1">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 py-3">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1 rounded" style={{ opacity: 1 - r * 0.08 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonPage({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)} aria-busy="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48 rounded" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="card p-5">
        <Skeleton className="mb-4 h-5 w-32 rounded" />
        <SkeletonTable />
      </div>
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonTable, SkeletonPage };
