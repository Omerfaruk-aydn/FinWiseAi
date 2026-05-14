"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "accent" | "warning" | "danger" | "info" | "muted";
  className?: string;
  animate?: boolean;
}

const colorMap: Record<string, string> = {
  accent: "bg-accent",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-blue-500",
  muted: "bg-muted",
};

const sizeMap: Record<string, string> = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  size = "md",
  color = "accent",
  className,
  animate = true,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const autoColor =
    color === "accent"
      ? percentage >= 90
        ? "danger"
        : percentage >= 70
        ? "warning"
        : "accent"
      : color;

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && (
            <span className="text-xs font-medium text-muted">{label}</span>
          )}
          {showValue && (
            <span className="text-xs font-semibold text-primary">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <ProgressPrimitive.Root
        className={cn(
          "relative overflow-hidden rounded-full bg-border",
          sizeMap[size]
        )}
        value={percentage}
        max={100}
        aria-label={label}
      >
        {animate ? (
          <motion.div
            className={cn(
              "h-full rounded-full transition-colors",
              colorMap[autoColor]
            )}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        ) : (
          <ProgressPrimitive.Indicator
            className={cn("h-full rounded-full transition-all", colorMap[autoColor])}
            style={{ width: `${percentage}%` }}
          />
        )}
      </ProgressPrimitive.Root>
    </div>
  );
}

export { ProgressBar };
export type { ProgressBarProps };
