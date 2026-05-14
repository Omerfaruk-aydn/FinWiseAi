"use client";

import * as React from "react";
import {
  Check,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: {
    role: string;
    preview: string;
    createdAt: string;
  } | null;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "şimdi";
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa önce`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}g önce`;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

interface ConversationListProps {
  conversations: ConversationSummary[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  loading?: boolean;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  loading,
}: ConversationListProps) {
  const [menuOpen, setMenuOpen] = React.useState<string | null>(null);
  const [renaming, setRenaming] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const renameRef = React.useRef<HTMLInputElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (renaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [renaming]);

  React.useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  const startRename = (conv: ConversationSummary) => {
    setRenaming(conv.id);
    setRenameValue(conv.title);
    setMenuOpen(null);
  };

  const commitRename = (id: string) => {
    const trimmed = renameValue.trim();
    if (trimmed) onRename(id, trimmed);
    setRenaming(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni Sohbet
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {loading && conversations.length === 0 && (
          <div className="flex items-center justify-center py-8 text-xs text-slate-400">
            Yükleniyor...
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-xs text-slate-400">
            <MessageSquare className="h-6 w-6 opacity-40" />
            Henüz konuşma yok
          </div>
        )}

        {conversations.map((conv) => {
          const isMenuOpen = menuOpen === conv.id;
          const isActive = activeId === conv.id;

          return (
            <div
              key={conv.id}
              className={cn(
                "group relative mx-2 mb-0.5 rounded-lg transition-colors",
                isActive ? "bg-[#ECFDF5] ring-1 ring-emerald-100" : "hover:bg-slate-50",
                isMenuOpen && !isActive && "bg-slate-50",
              )}
            >
              {renaming === conv.id ? (
                <div className="flex items-center gap-1 px-3 py-2">
                  <input
                    ref={renameRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(conv.id);
                      if (e.key === "Escape") setRenaming(null);
                    }}
                    className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#10B981]"
                    maxLength={80}
                  />
                  <button
                    type="button"
                    onClick={() => commitRename(conv.id)}
                    className="shrink-0 text-[#10B981] hover:text-[#059669]"
                    title="Kaydet"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenaming(null)}
                    className="shrink-0 text-slate-400 hover:text-slate-600"
                    title="Vazgeç"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!isMenuOpen) onSelect(conv.id);
                  }}
                  className="w-full px-3 py-2.5 pr-8 text-left"
                >
                  <div
                    className={cn(
                      "truncate text-xs font-medium leading-snug",
                      isActive ? "text-emerald-950" : "text-slate-800",
                    )}
                  >
                    {conv.title}
                  </div>
                  {conv.lastMessage && (
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="flex-1 truncate text-[10px] text-slate-400">
                        {conv.lastMessage.preview}
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {relativeTime(conv.updatedAt)}
                      </span>
                    </div>
                  )}
                </button>
              )}

              {renaming !== conv.id && (
                <div
                  ref={isMenuOpen ? menuRef : undefined}
                  className={cn(
                    "absolute right-1 top-1/2 z-40 -translate-y-1/2 transition-opacity",
                    isMenuOpen
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                  )}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(isMenuOpen ? null : conv.id);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                    title="Sohbet seçenekleri"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 top-7 z-50 w-40 rounded-lg border border-slate-200 bg-white py-1 text-xs shadow-lg">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(conv);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Yeniden adlandır
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(null);
                          onDelete(conv.id);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Sil
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
