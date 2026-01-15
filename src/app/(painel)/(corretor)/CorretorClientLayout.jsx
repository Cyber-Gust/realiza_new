"use client";

import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

import { Sidebar } from "@/components/corretor/layout/Sidebar";
import { Header } from "@/components/corretor/layout/Header";
import { Footer } from "@/components/admin/layout/Footer";

import { ToastProvider } from "@/contexts/ToastContext";
import { UserProvider } from "@/contexts/UserContext";

// Função necessária para o useSyncExternalStore (assinatura vazia já que o status de montagem não muda após o carregamento)
const subscribe = () => () => {};

export default function CorretorClientLayout({ children, user, profile }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  /**
   * useSyncExternalStore substitui o useEffect + mounted.
   * - No servidor: Retorna false.
   * - No cliente: Retorna true.
   * Isso evita o erro de Hydration Mismatch e silencia o aviso do ESLint.
   */
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,  // Valor no cliente
    () => false // Valor no servidor
  );

  // Enquanto não estiver montado no cliente, não renderiza nada para evitar conflitos de DOM
  if (!mounted) return null;

  return (
    <ToastProvider>
      <UserProvider user={user} profile={profile}>
        <div className="flex h-screen w-full bg-background text-foreground overflow-x-hidden">
          
          {/* SIDEBAR */}
          <div
            className={cn(
              "fixed inset-y-0 left-0 z-50 transition-all duration-300 md:flex",
              isMobileOpen ? "flex w-64 shadow-2xl" : "hidden",
              "md:w-64 md:shadow-none"
            )}
          >
            <Sidebar
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
          </div>

          {/* CONTEÚDO PRINCIPAL */}
          <div
            className={cn(
              "flex flex-col h-full flex-1 min-w-0 transition-[margin] duration-300",
              isCollapsed ? "md:ml-20" : "md:ml-64",
              "ml-0"
            )}
          >
            {/* HEADER */}
            <Header
              user={user}
              profile={profile}
              isCollapsed={isCollapsed}
              onMobileToggle={() => setIsMobileOpen(!isMobileOpen)}
              isMobileOpen={isMobileOpen}
              className="fixed top-0 inset-x-0 z-[60] md:relative"
            />

            {/* MAIN */}
            <main className="flex-1 overflow-y-auto min-w-0 bg-panel-bg p-6 pt-20 md:pt-6">
              <div className="mx-auto max-w-7xl space-y-6">
                {children}
              </div>
            </main>

            {/* FOOTER (somente desktop) */}
            <div className="hidden md:block">
              <Footer />
            </div>
          </div>

          {/* OVERLAY MOBILE */}
          {isMobileOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
          )}

          {/* PORTAIS */}
          <div id="modal-root" />
          <div id="drawer-root" />
        </div>
      </UserProvider>
    </ToastProvider>
  );
}