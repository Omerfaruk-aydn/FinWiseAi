"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Bot,
  TrendingUp,
  TrendingDown,
  List,
  BarChart2,
  Wallet,
  Target,
  CreditCard,
  RefreshCcw,
  HeartPulse,
  CheckSquare,
  FileText,
  Settings,
  ChevronsLeft,
  ChevronRight,
  Sparkles,
  X,
  PieChart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { OwlIcon } from "@/components/brand/owl-icon";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/app", icon: <Home className="h-[18px] w-[18px]" /> },
  { label: "AI Asistan", href: "/app/assistant", icon: <Bot className="h-[18px] w-[18px]" /> },
  { label: "Gelirler", href: "/app/income", icon: <TrendingUp className="h-[18px] w-[18px]" /> },
  { label: "Giderler", href: "/app/expenses", icon: <TrendingDown className="h-[18px] w-[18px]" /> },
  { label: "İşlemler", href: "/app/transactions", icon: <List className="h-[18px] w-[18px]" /> },
  { label: "Analizler", href: "/app/analytics", icon: <BarChart2 className="h-[18px] w-[18px]" /> },
  { label: "Bütçe", href: "/app/budget", icon: <Wallet className="h-[18px] w-[18px]" /> },
  { label: "Hedefler", href: "/app/goals", icon: <Target className="h-[18px] w-[18px]" /> },
  { label: "Borçlar", href: "/app/debts", icon: <CreditCard className="h-[18px] w-[18px]" /> },
  { label: "Abonelikler", href: "/app/subscriptions", icon: <RefreshCcw className="h-[18px] w-[18px]" /> },
  { label: "Sağlık Skoru", href: "/app/health-score", icon: <HeartPulse className="h-[18px] w-[18px]" /> },
  { label: "Aksiyon Planı", href: "/app/action-plan", icon: <CheckSquare className="h-[18px] w-[18px]" /> },
  { label: "Raporlar", href: "/app/reports", icon: <FileText className="h-[18px] w-[18px]" /> },
  { label: "Ayarlar", href: "/app/settings", icon: <Settings className="h-[18px] w-[18px]" /> },
];

interface AppSidebarProps {
  collapsed?: boolean;
  onCollapse?: (v: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({
  collapsed,
  pathname,
  onCollapse
}: {
  collapsed: boolean;
  pathname: string;
  onCollapse?: (v: boolean) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center px-6",
          collapsed ? "justify-center px-0" : "gap-3"
        )}
      >
        <OwlIcon contained className="h-10 w-10" />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              key="logo-text"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap text-xl font-bold text-primary"
            >
              FinWise AI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4" aria-label="Ana navigasyon">
        <ul role="list" className="space-y-1.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive 
                      ? "bg-green-50/80 text-accent font-semibold" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    collapsed && "justify-center px-0"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        key="label"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Button */}
      <div className="mt-auto px-4 pb-6">
        {onCollapse && (
          <button
            onClick={() => onCollapse(!collapsed)}
            className={cn(
              "flex w-full items-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-900",
              collapsed ? "justify-center" : "gap-2 px-2"
            )}
            aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronsLeft className="h-5 w-5" />
                <span>Menüyü Daralt</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function AppSidebar({
  collapsed = false,
  onCollapse,
  mobileOpen = false,
  onMobileClose,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "relative hidden flex-col border-r border-slate-100 bg-surface transition-all duration-300 lg:flex",
          collapsed ? "w-[80px]" : "w-[260px]"
        )}
        aria-label="Yan menü"
      >
        <SidebarContent collapsed={collapsed} pathname={pathname} onCollapse={onCollapse} />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-50 w-[260px] bg-surface shadow-2xl lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              aria-label="Mobil yan menü"
            >
              <SidebarContent collapsed={false} pathname={pathname} />

              {/* Close button */}
              <button
                onClick={onMobileClose}
                className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Menüyü kapat"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export { AppSidebar };
export type { AppSidebarProps };
