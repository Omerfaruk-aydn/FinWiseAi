import * as React from "react";
import { cn } from "@/lib/utils";

export const markdownComponents: React.ComponentProps<
  typeof import("react-markdown").default
>["components"] = {
  h1: ({ children }) => (
    <h1 className="text-base font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-100 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold text-slate-800 mt-3 mb-1.5 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-slate-700 mt-2 mb-1 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-slate-700 leading-relaxed my-1.5 first:mt-0 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
  ul: ({ children }) => <ul className="my-2 space-y-1 pl-0">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 space-y-1 pl-0 list-none">{children}</ol>,
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-sm text-slate-700">
      <span className="mt-2 w-1.5 h-1.5 min-w-[6px] rounded-full bg-[#10B981]" />
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 pl-3 border-l-2 border-[#10B981]/40 text-slate-600 text-sm italic bg-slate-50/50 py-1 rounded-r">
      {children}
    </blockquote>
  ),
  code: ({ children, ...props }) => {
    const isInline = (props as { inline?: boolean }).inline;
    if (!isInline) {
      return (
        <code className="block my-2 rounded-lg bg-slate-900 text-emerald-300 p-3 text-xs font-mono overflow-x-auto">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[11px] font-mono text-slate-700">
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="my-3 overflow-hidden rounded-lg border border-slate-200 shadow-sm">
      <table className="w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-slate-100">{children}</tbody>,
  tr: ({ children }) => (
    <tr className="hover:bg-slate-50/60 transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2.5 text-left font-semibold text-slate-700 text-[11px] uppercase tracking-wide whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{children}</td>
  ),
  hr: () => <hr className="my-3 border-slate-100" />,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#10B981] font-medium underline-offset-2 hover:underline"
    >
      {children}
    </a>
  ),
};
