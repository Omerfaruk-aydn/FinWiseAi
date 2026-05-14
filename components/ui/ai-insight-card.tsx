"use client";

import * as React from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AIInsight {
  text: string;
  type?: "info" | "warning" | "success";
}

interface AIInsightCardProps {
  title?: string;
  summary?: string;
  insights?: AIInsight[];
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  loading?: boolean;
  variant?: "default" | "warning" | "compact";
  className?: string;
}

function AIInsightCard({
  title = "AI Tespiti",
  summary,
  insights,
  ctaLabel,
  ctaHref,
  onCtaClick,
  loading = false,
  variant = "default",
  className,
}: AIInsightCardProps) {
  const variantStyles = {
    default: "border-l-4 border-accent bg-green-50",
    warning: "border-l-4 border-warning bg-amber-50",
    compact: "border-l-4 border-accent bg-green-50",
  };

  if (loading) {
    return (
      <div className={cn("rounded-xl border border-border p-4", variantStyles[variant], className)}>
        <div className="flex items-center gap-2 mb-3">
          <div className="skeleton h-4 w-4 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
        <div className="space-y-2">
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-4/5 rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("rounded-xl border border-border p-4", variantStyles[variant], className)}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
      </div>

      {summary && (
        <p className="text-sm leading-relaxed text-primary/80 mb-3">{summary}</p>
      )}

      {insights && insights.length > 0 && (
        <ul className="space-y-1.5 mb-3" role="list">
          {insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-primary/80">
              <span
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  insight.type === "warning" ? "bg-warning" :
                  insight.type === "success" ? "bg-accent" : "bg-accent"
                )}
                aria-hidden="true"
              />
              {insight.text}
            </li>
          ))}
        </ul>
      )}

      {(ctaLabel && ctaHref) && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-dark transition-colors"
        >
          {ctaLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}

      {(ctaLabel && onCtaClick && !ctaHref) && (
        <button
          onClick={onCtaClick}
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-dark transition-colors"
        >
          {ctaLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}

export { AIInsightCard };
export type { AIInsightCardProps, AIInsight };
