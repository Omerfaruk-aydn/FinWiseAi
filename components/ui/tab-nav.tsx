"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabNavProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
}

function TabNav({ tabs, activeTab, onTabChange, className }: TabNavProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-lg border border-border bg-secondary/50 p-1",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            activeTab === tab.id
              ? "bg-white text-primary shadow-sm"
              : "text-muted hover:text-primary hover:bg-white/60"
          )}
        >
          {tab.icon && <span className="h-4 w-4 shrink-0" aria-hidden="true">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

function TabPanel({ id, activeTab, children, className }: TabPanelProps) {
  if (activeTab !== id) return null;
  return (
    <div
      id={`tabpanel-${id}`}
      role="tabpanel"
      aria-labelledby={id}
      className={className}
    >
      {children}
    </div>
  );
}

export { TabNav, TabPanel };
export type { TabItem, TabNavProps };
