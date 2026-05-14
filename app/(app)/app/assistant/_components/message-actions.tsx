"use client";

import * as React from "react";
import { Copy, ThumbsUp, ThumbsDown, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
  content: string;
  messageId?: string;
  onRegenerate?: () => void;
  disabled?: boolean;
}

export function MessageActions({
  content,
  messageId,
  onRegenerate,
  disabled,
}: MessageActionsProps) {
  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = React.useState<1 | -1 | null>(null);
  const [feedbackPending, setFeedbackPending] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleFeedback = async (rating: 1 | -1) => {
    if (feedbackPending || !messageId) return;
    const next = feedback === rating ? null : rating;
    setFeedback(next);
    if (next === null) return;

    setFeedbackPending(true);
    try {
      await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating: next }),
      });
    } catch {
      // ignore — feedback is non-critical
    } finally {
      setFeedbackPending(false);
    }
  };

  return (
    <div className="flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
      <ActionButton
        onClick={handleCopy}
        title={copied ? "Kopyalandı" : "Kopyala"}
        active={copied}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </ActionButton>

      {onRegenerate && (
        <ActionButton
          onClick={onRegenerate}
          title="Yeniden üret"
          disabled={disabled}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", disabled && "animate-spin")} />
        </ActionButton>
      )}

      <ActionButton
        onClick={() => handleFeedback(1)}
        title="Beğen"
        active={feedback === 1}
        disabled={feedbackPending}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </ActionButton>

      <ActionButton
        onClick={() => handleFeedback(-1)}
        title="Beğenme"
        active={feedback === -1}
        disabled={feedbackPending}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </ActionButton>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  title,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors",
        "hover:bg-slate-100 hover:text-slate-600",
        active && "text-[#10B981]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {children}
    </button>
  );
}
