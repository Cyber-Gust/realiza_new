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
        <div className="flex h-screen w-full bg-background text-foreground overflow-x-hidden">

          {/* SIDEBAR — Desktop normal / Mobile só quando abrir o sanduiche */}
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 transition-all duration-300 md:flex",
              isMobileOpen ? "flex w-64 shadow-2xl" : "hidden",
              "md:w-64 md:shadow-none"
            )}
          >
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          </div>

          {/* CONTEÚDO PRINCIPAL */}
          <div
            className={cn(
              "flex flex-col h-full flex-1 min-w-0 transition-[margin] duration-300",

              // Desktop mantém a lógica original
              isCollapsed ? "md:ml-20" : "md:ml-64",

              // Mobile nunca aplica margin-left
              "ml-0"
            )}
          >

            {/* HEADER FIXO NO MOBILE */}
            <Header
              user={user}
              profile={profile}
              isCollapsed={isCollapsed}
              onMobileToggle={() => setIsMobileOpen(!isMobileOpen)}
              isMobile={isMobileOpen}
              className="fixed top-0 inset-x-0 z-[60] md:relative"
            />

            {/* Espaçamento abaixo do header FIXO no mobile */}
            <div className="h-0 md:h-0"></div>

            <main className="flex-1 overflow-y-auto min-w-0 bg-panel-bg p-6">
              <div className="overflow-x-auto">
                <div className="mx-auto max-w-7xl space-y-6">
                  {children}
                </div>
              </div>
            </main>

            {/* FOOTER — só aparece no DESKTOP */}
            <div className="hidden md:block">
              <Footer />
            </div>
          </div>

          {/* OVERLAY para fechar menu no mobile */}
          {isMobileOpen && (
            <div 
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
          )}

          <div id="modal-root"></div>
          <div id="drawer-root"></div>
        </div>
      </UserProvider>
    </ToastProvider>
  );
}
