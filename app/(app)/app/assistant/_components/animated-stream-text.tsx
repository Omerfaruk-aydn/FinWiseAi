"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "./markdown-components";

interface AnimatedStreamTextProps {
  content: string;
  isStreaming?: boolean;
}

export function AnimatedStreamText({ content, isStreaming }: AnimatedStreamTextProps) {
  const [displayedContent, setDisplayedContent] = React.useState(content);
  const displayedRef = React.useRef(content);
  const targetRef = React.useRef(content);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldRenderMarkdown = React.useMemo(
    () => /(^|\n)#{1,6}\s|(^|\n)\|.+\||(^|\n)[-*]\s|\*\*|`/.test(content),
    [content],
  );

  React.useEffect(() => {
    targetRef.current = content;

    if (!isStreaming) {
      displayedRef.current = content;
      setDisplayedContent(content);
    }
  }, [content, isStreaming]);

  React.useEffect(() => {
    if (!isStreaming) return;

    let active = true;

    const getDelay = (text: string, remaining: number) => {
      const lastChar = text.at(-1) ?? "";
      if (lastChar === "\n") return 70;
      if (/[.!?]/.test(lastChar)) return 120;
      if (/[,;:]/.test(lastChar)) return 60;
      if (remaining > 220) return 12;
      if (remaining > 120) return 18;
      if (remaining > 60) return 24;
      if (remaining > 20) return 30;
      return 36;
    };

    const tick = () => {
      if (!active) return;

      const target = targetRef.current;
      const current = displayedRef.current;

      if (current.length >= target.length) {
        timerRef.current = setTimeout(tick, 90);
        return;
      }

      const remaining = target.length - current.length;
      const step = Math.max(1, Math.min(8, Math.ceil(remaining / 12)));
      const next = target.slice(0, current.length + step);

      displayedRef.current = next;
      setDisplayedContent(next);
      timerRef.current = setTimeout(tick, getDelay(next, target.length - next.length));
    };

    timerRef.current = setTimeout(tick, 12);

    return () => {
      active = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isStreaming]);

  if (isStreaming || !shouldRenderMarkdown) {
    return (
      <div className="min-w-0 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
        {displayedContent}
        {isStreaming ? (
          <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse rounded-full bg-[#10B981]" />
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
