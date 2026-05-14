"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getAgentMeta } from "./agent-config";

export function AgentBadge({
  agentUsed,
  className,
}: {
  agentUsed: string;
  className?: string;
}) {
  const meta = getAgentMeta(agentUsed);
  if (!meta) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5",
        "rounded-full border border-emerald-100 bg-[#ECFDF5] text-[#059669]",
        className,
      )}
    >
      <span>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
