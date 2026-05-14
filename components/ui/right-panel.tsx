"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RightPanelProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

function RightPanel({ title, description, children, className, sticky = true }: RightPanelProps) {
  return (
    <div className={cn("flex flex-col gap-4", sticky && "lg:sticky lg:top-4 lg:self-start", className)}>
      {(title || description) && (
        <div>
          {title && <h2 className="text-base font-semibold text-primary">{title}</h2>}
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export { RightPanel };
