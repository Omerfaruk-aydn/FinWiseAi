"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type OwlIconProps = {
  className?: string;
  pulsing?: boolean;
  contained?: boolean;
};

function OwlSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
    >
      <path d="M18 40V24h7v16h-7Zm11 0V16h7v24h-7Zm11 0V28h7v12h-7Z" fill="#10b981" />
      <path d="M15 45h34" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function OwlIcon({ className, pulsing = false, contained = false }: OwlIconProps) {
  if (!contained) return <OwlSvg className={className} />;

  return (
    <div
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center",
        pulsing && "shadow-md shadow-emerald-400/40",
        className,
      )}
    >
      <OwlSvg className="h-full w-full" />
    </div>
  );
}
