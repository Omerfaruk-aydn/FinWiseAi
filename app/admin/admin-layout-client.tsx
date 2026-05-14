"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Users,
  LayoutGrid,
  FileText,
  BarChart2,
  Settings,
  Menu,
  X,
  ChevronDown,
  Bell
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useSession, SessionProvider } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { OwlIcon } from "@/components/brand/owl-icon";

// ─── Nav Items ────────────────────────────────────────────────────────────────

const adminNavItems = [
  { label: "Admin Dashboard", href: "/admin", icon: <Home className="w-[18px] h-[18px]" /> },
  { label: "Kullanıcılar", href: "/admin/users", icon: <Users className="w-[18px] h-[18px]" /> },
  { label: "Kategoriler", href: "/admin/categories", icon: <LayoutGrid className="w-[18px] h-[18px]" /> },
  { label: "AI Logları", href: "/admin/ai-logs", icon: <FileText className="w-[18px] h-[18px]" /> },
  { label: "Raporlar", href: "/admin/reports", icon: <FileText className="w-[18px] h-[18px]" /> },
  { label: "Analitik", href: "/admin/analytics", icon: <BarChart2 className="w-[18px] h-[18px]" /> },
  { label: "Ayarlar", href: "/admin/settings", icon: <Settings className="w-[18px] h-[18px]" /> },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function AdminSidebar({ pathname }: { pathname: string }) {
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const userName = session?.user?.name ?? "Admin User";
  const userEmail = session?.user?.email ?? "admin@finwise.ai";
  const initials = getInitials(userName);

  return (
    <div className="flex h-full flex-col bg-[#0F172A] text-slate-300">
      {/* Logo */}
      <div className="flex h-[72px] items-center gap-3 px-6 shrink-0">
        <OwlIcon className="h-10 w-10" />
        <span className="text-xl font-bold text-white tracking-tight">FinWise Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6" aria-label="Admin navigasyon">
        <ul role="list" className="space-y-1.5 px-3">
          {adminNavItems.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-white/10 text-white" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className={cn("shrink-0", isActive ? "text-[#10B981]" : "text-slate-400")} aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 mt-auto">
        <button 
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex items-center justify-between w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold text-white truncate w-full text-left">{userName}</span>
              <span className="text-[10px] text-slate-400 truncate w-full text-left">{userEmail}</span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        </button>
      </div>
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function AdminTopbar({ onMobileMenuOpen }: { onMobileMenuOpen: () => void }) {
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const pathname = usePathname();
  const userName = session?.user?.name ?? "Admin";
  const initials = getInitials(userName);

  const currentPage = adminNavItems.find((i) =>
    i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href)
  );

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#10B981] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
          <span className="text-slate-400">Admin</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900">{currentPage?.label ?? "Dashboard"}</span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative text-slate-500 hover:text-slate-900 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border border-white">
            3
          </span>
        </button>
        
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-bold text-slate-900 leading-none">{userName}</span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">Sistem Yöneticisi</span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block ml-2" />
        </div>
      </div>
    </header>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
        {/* Desktop Sidebar */}
        <aside className="hidden w-[260px] shrink-0 flex-col lg:flex">
          <AdminSidebar pathname={pathname} />
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
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                key="drawer"
                className="fixed inset-y-0 left-0 z-50 w-[260px] shadow-2xl lg:hidden bg-[#0F172A]"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <AdminSidebar pathname={pathname} />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminTopbar onMobileMenuOpen={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative">
            {children}
            {/* Footer inside main scroll area */}
            <footer className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-4 relative z-0">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm z-10 relative">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-[10px]">Güvenli ve uyumlu</span>
                  <span className="text-[9px] flex items-center gap-1">Tüm sistemler izleniyor <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span></span>
                </div>
              </div>
              <div className="text-right">
                © {new Date().getFullYear()} FinWise AI<br/>Tüm hakları saklıdır.
              </div>
            </footer>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}

const ShieldCheck = (props:any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
