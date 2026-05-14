"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";

function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  if (pathname === "/app/onboarding") {
    return (
      <div className="flex h-screen overflow-y-auto bg-background">
        <main className="flex-1 w-full" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar onMobileMenuOpen={() => setMobileMenuOpen(true)} />

        <main
          id="main-content"
          className="scrollbar-thin flex-1 overflow-y-auto p-4 lg:p-6"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
