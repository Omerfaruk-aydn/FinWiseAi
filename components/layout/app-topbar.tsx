"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Bell,
  HelpCircle,
  LogOut,
  Menu,
  Settings,
  User,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, getInitials } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

const routeMap: Record<string, string> = {
  "/app": "Dashboard",
  "/app/assistant": "AI Asistan",
  "/app/income": "Gelirler",
  "/app/expenses": "Giderler",
  "/app/transactions": "İşlemler",
  "/app/analytics": "Analizler",
  "/app/budget": "Bütçe",
  "/app/goals": "Hedefler",
  "/app/debts": "Borçlar",
  "/app/subscriptions": "Abonelikler",
  "/app/health-score": "Sağlık Skoru",
  "/app/action-plan": "Aksiyon Planı",
  "/app/reports": "Raporlar",
  "/app/settings": "Ayarlar",
  "/app/profile": "Profil",
};

function useBreadcrumbs(): Breadcrumb[] {
  const pathname = usePathname();
  const label = routeMap[pathname];

  // Base breadcrumb is always "Uygulama"
  const crumbs: Breadcrumb[] = [{ label: "Uygulama", href: "/app" }];

  if (pathname === "/app" || !label) {
    // If we are at root or unknown, just show Dashboard
    crumbs.push({ label: label || "Dashboard" });
    return crumbs;
  }

  crumbs.push({ label });
  return crumbs;
}

interface AppTopbarProps {
  onMobileMenuOpen?: () => void;
}

function AppTopbar({ onMobileMenuOpen }: AppTopbarProps) {
  const { data: session } = useSession();
  const breadcrumbs = useBreadcrumbs();
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [avatarImage, setAvatarImage] = React.useState<string | null>(null);
  const [notifications, setNotifications] = React.useState<Array<{ id: string; title: string; message: string; isRead: boolean }>>([]);

  const userName = session?.user?.name ?? "Kullanıcı";
  const userEmail = session?.user?.email ?? "E-posta yok";
  React.useEffect(() => {
    if (!session?.user?.id) {
      setAvatarImage(null);
      return;
    }

    const controller = new AbortController();

    async function loadAvatar() {
      try {
        const res = await fetch("/api/user/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = (await res.json().catch(() => ({}))) as {
          data?: { image?: string | null };
        };

        if (res.ok) setAvatarImage(json.data?.image ?? null);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setAvatarImage(null);
      }
    }

    loadAvatar();

    return () => controller.abort();
  }, [session?.user?.id, session?.user?.sessionVersion]);

  React.useEffect(() => {
    if (!session?.user?.id) {
      setNotifications([]);
      return;
    }

    const controller = new AbortController();

    async function loadNotifications() {
      try {
        const res = await fetch("/api/notifications", {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = (await res.json().catch(() => ({}))) as {
          data?: Array<{ id: string; title: string; message: string; isRead: boolean }>;
        };
        if (res.ok) setNotifications(json.data ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setNotifications([]);
      }
    }

    loadNotifications();

    return () => controller.abort();
  }, [session?.user?.id]);
  const initials = getInitials(userName);
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-slate-100 bg-white px-6 lg:px-8">
      {/* Left: Mobile menu button + Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 lg:hidden"
          aria-label="Menüyü aç"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Breadcrumb */}
        <nav aria-label="Navigasyon yolu" className="hidden sm:block">
          <ol className="flex items-center text-sm font-medium" role="list">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center">
                {i > 0 && (
                  <span className="mx-2 text-slate-300">/</span>
                )}
                {i === 0 ? (
                  <span className="text-slate-500">{crumb.label}</span>
                ) : (
                  <span className="text-slate-900">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white border border-white"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotifOpen(false)}
                  aria-hidden="true"
                />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-100 bg-white shadow-xl"
                  role="dialog"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <p className="font-semibold text-slate-900">Bildirimler</p>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{unreadCount} yeni</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-500">
                        Henüz yeni bildirim yok.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div key={item.id} className="rounded-lg px-3 py-2 hover:bg-slate-50">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                            {!item.isRead && <span className="mt-1 h-2 w-2 rounded-full bg-accent" />}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Help Icon */}
        <Link href="/app/assistant" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-slate-900 hidden sm:flex" aria-label="Yardım">
          <HelpCircle className="h-5 w-5" />
        </Link>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        {/* User Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2.5 rounded-full pl-1 pr-2 py-1 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent/20">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent text-xs font-semibold text-white">
                {avatarImage ? (
                  <img src={avatarImage} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="hidden items-center gap-1 sm:flex">
                <span className="text-sm font-medium text-slate-900">{userName}</span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </div>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[220px] rounded-xl border border-slate-100 bg-white shadow-xl p-1"
              asChild
            >
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {/* User info header */}
                <div className="mb-1 border-b border-slate-100 px-3 py-3">
                  <p className="text-sm font-medium text-slate-900">{userName}</p>
                  <p className="text-xs text-slate-500">{userEmail}</p>
                </div>

                <DropdownMenu.Item asChild>
                  <Link
                    href="/app/settings#profil"
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none transition-colors hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50"
                  >
                    <User className="h-4 w-4" aria-hidden="true" />
                    Profil
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <Link
                    href="/app/settings"
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none transition-colors hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    Ayarlar
                  </Link>
                </DropdownMenu.Item>

                <div className="my-1 h-px bg-slate-100" />

                <DropdownMenu.Item asChild>
                  <button
                    onClick={() => signOut({ callbackUrl: "/auth/login" })}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger outline-none transition-colors hover:bg-red-50 focus:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Çıkış Yap
                  </button>
                </DropdownMenu.Item>
              </motion.div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}

export { AppTopbar };
export type { AppTopbarProps };

