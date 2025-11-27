"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils"; 
import { Sidebar } from "@/components/admin/layout/Sidebar";
import { Header } from "@/components/admin/layout/Header";
import { Footer } from "@/components/admin/layout/Footer";
import { ToastProvider } from "@/contexts/ToastContext"; 
import { UserProvider } from "@/contexts/UserContext";

export default function AdminClientLayout({ children, user, profile }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <ToastProvider>
      <UserProvider user={user} profile={profile}>
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">

          <div className={cn(
            "fixed inset-y-0 left-0 z-50 transition-all duration-300",
            isMobileOpen ? "flex w-64 shadow-2xl" : "hidden md:flex",
          )}>
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          </div>

          <div
            className={cn(
              "flex flex-col h-full flex-1 transition-[margin] duration-300",
              isCollapsed ? "md:ml-20" : "md:ml-64",
              "ml-0"
            )}
          >
            <Header 
              user={user}
              profile={profile}
              isCollapsed={isCollapsed} 
              onMobileToggle={() => setIsMobileOpen(!isMobileOpen)} 
              isMobile={isMobileOpen}
            />

            <main className="flex-1 overflow-y-auto bg-panel-bg p-6">
              <div className="mx-auto max-w-7xl space-y-6">
                {children}
              </div>
            </main>

            <Footer />
          </div>

          {isMobileOpen && (
            <div 
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
          )}

          {/* 🔥 AGORA O MODAL ROOT FAZ PARTE DO USER PROVIDER */}
          <div id="modal-root"></div>
          <div id="drawer-root"></div>

        </div>
      </UserProvider>
    </ToastProvider>
  );
}
