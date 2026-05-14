"use client";

import * as React from "react";
import { Command } from "cmdk";
import { cn } from "@/lib/utils";
import { AGENT_META, type AgentMeta } from "./agent-config";
import type { AgentType } from "@/lib/ai/orchestrator";

interface SlashCommandPopoverProps {
  open: boolean;
  query: string; // text after "/"
  onSelect: (agent: AgentType, hint: string) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function SlashCommandPopover({
  open,
  query,
  onSelect,
  onClose,
  anchorRef,
}: SlashCommandPopoverProps) {
  const [position, setPosition] = React.useState({ bottom: 0, left: 0 });
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPosition({
      bottom: window.innerHeight - rect.top + 6,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - 300)),
    });
  }, [open, anchorRef]);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const filtered: AgentMeta[] = query
    ? AGENT_META.filter(
        (m) =>
          m.slashCommand.includes(query.toLowerCase()) ||
          m.label.toLowerCase().includes(query.toLowerCase()) ||
          m.description.toLowerCase().includes(query.toLowerCase()),
      )
    : AGENT_META;

  return (
    <div
      ref={listRef}
      style={{ position: "fixed", bottom: position.bottom, left: position.left }}
      className="z-50 w-72 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
    >
      <Command>
        <div className="px-3 py-2 border-b border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Ajan Seç
          </p>
        </div>
        <Command.List className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-3 py-3 text-xs text-slate-400 text-center">
              Eşleşen komut bulunamadı
            </div>
          )}
          {filtered.map((m) => (
            <Command.Item
              key={m.agent}
              value={m.slashCommand + " " + m.label}
              onSelect={() => onSelect(m.agent, m.hint)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg mx-1 my-0.5",
                "text-sm text-slate-700 hover:bg-slate-50",
                "data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900",
                "aria-selected:bg-slate-100",
              )}
            >
              <span className="text-base w-5 text-center shrink-0">{m.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900">{m.label}</span>
                  <code className="text-[10px] font-mono text-[#059669] bg-[#ECFDF5] px-1 rounded">
                    {m.slashCommand}
                  </code>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{m.description}</p>
              </div>
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
