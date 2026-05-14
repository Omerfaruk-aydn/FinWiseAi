"use client";

import * as React from "react";
import {
  Sparkles,
  Stethoscope,
  Lightbulb,
  ClipboardList,
  Hash,
  CheckSquare,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AIResponseData {
  summary?: string;
  diagnosis?: string;
  insights?: string[];
  recommendations?: string[];
  numbers?: Array<{ label: string; value: string }>;
  actionItems?: string[];
  disclaimer?: string;
}

interface AIResponseCardProps {
  data: AIResponseData;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  title?: string;
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  className?: string;
  children: React.ReactNode;
}

function Section({ icon, title, className, children }: SectionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <span className="text-accent" aria-hidden="true">
          {icon}
        </span>
        {title}
      </div>
      {children}
    </div>
  );
}

function AIResponseCard({
  data,
  className,
  collapsible = false,
  defaultExpanded = true,
  title = "AI Analizi",
}: AIResponseCardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const hasContent =
    data.summary ||
    data.diagnosis ||
    (data.insights && data.insights.length > 0) ||
    (data.recommendations && data.recommendations.length > 0) ||
    (data.numbers && data.numbers.length > 0) ||
    (data.actionItems && data.actionItems.length > 0);

  if (!hasContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("ai-response-card", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
          <h3 className="text-h4 font-semibold text-primary">{title}</h3>
        </div>
        {collapsible && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-secondary hover:text-primary"
            aria-expanded={expanded}
            aria-label={expanded ? "Kapat" : "Aç"}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {(!collapsible || expanded) && (
          <motion.div
            key="content"
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-5">
              {/* Summary */}
              {data.summary && (
                <Section icon={<Sparkles className="h-3.5 w-3.5" />} title="Özet">
                  <p className="text-sm leading-relaxed text-primary">{data.summary}</p>
                </Section>
              )}

              {/* Diagnosis */}
              {data.diagnosis && (
                <Section icon={<Stethoscope className="h-3.5 w-3.5" />} title="Teşhis">
                  <p className="text-sm leading-relaxed text-primary">{data.diagnosis}</p>
                </Section>
              )}

              {/* Numbers */}
              {data.numbers && data.numbers.length > 0 && (
                <Section icon={<Hash className="h-3.5 w-3.5" />} title="Önemli Rakamlar">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {data.numbers.map((item, i) => (
                      <div
                        key={i}
                        className="rounded-md border border-border bg-background px-3 py-2"
                      >
                        <p className="text-xs text-muted">{item.label}</p>
                        <p className="mt-0.5 text-sm font-semibold text-primary">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Insights */}
              {data.insights && data.insights.length > 0 && (
                <Section icon={<Lightbulb className="h-3.5 w-3.5" />} title="İçgörüler">
                  <ul className="space-y-2" role="list">
                    {data.insights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-primary">
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                          aria-hidden="true"
                        />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Recommendations */}
              {data.recommendations && data.recommendations.length > 0 && (
                <Section icon={<ClipboardList className="h-3.5 w-3.5" />} title="Öneriler">
                  <ol className="space-y-2" role="list">
                    {data.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-primary">
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent"
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        {rec}
                      </li>
                    ))}
                  </ol>
                </Section>
              )}

              {/* Action Items */}
              {data.actionItems && data.actionItems.length > 0 && (
                <Section icon={<CheckSquare className="h-3.5 w-3.5" />} title="Aksiyon Adımları">
                  <ul className="space-y-2" role="list">
                    {data.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-primary">
                        <CheckSquare
                          className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Disclaimer */}
              {data.disclaimer && (
                <div className="flex items-start gap-2 rounded-md border border-border-light bg-secondary/60 px-3 py-2.5">
                  <AlertCircle
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                  <p className="disclaimer-text">{data.disclaimer}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export { AIResponseCard };
export type { AIResponseCardProps, AIResponseData };
