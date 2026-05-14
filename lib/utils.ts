import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string, format: "short" | "long" | "relative" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (format === "relative") {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Bugün";
    if (diffDays === 1) return "Dün";
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
    return d.toLocaleDateString("tr-TR", { month: "short", day: "numeric" });
  }

  if (format === "long") {
    return d.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
  }

  return d.toLocaleDateString("tr-TR", { year: "numeric", month: "short", day: "numeric" });
}

export function formatPercent(value: number, decimals = 1): string {
  return `%${value.toFixed(decimals)}`;
}

export function getMonthName(month: number): string {
  return new Date(2024, month - 1, 1).toLocaleDateString("tr-TR", { month: "long" });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function getHealthScoreColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#3B82F6";
  if (score >= 40) return "#F59E0B";
  return "#EF4444";
}

export function getHealthScoreLabel(score: number): string {
  if (score >= 80) return "Güçlü";
  if (score >= 60) return "İyi";
  if (score >= 40) return "Dikkat";
  return "Riskli";
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}
