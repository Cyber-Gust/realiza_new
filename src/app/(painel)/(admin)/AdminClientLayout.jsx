"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils"; 
import { Sidebar } from "@/components/admin/layout/Sidebar";
import { Header } from "@/components/admin/layout/Header";
import { Footer } from "@/components/admin/layout/Footer";
import { ToastProvider } from "@/contexts/ToastContext"; 

// 👇 1. Adicione user e profile aqui nos argumentos
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
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        
        {/* Sidebar (Fixa à esquerda) */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]",
          isMobileOpen ? "flex w-64 shadow-2xl" : "hidden md:flex",
        )}>
           <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>

        {/* Wrapper do Conteúdo (Lado Direito) */}
        <div
          className={cn(
            "flex flex-col h-full flex-1 transition-[margin] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]",
            isCollapsed ? "md:ml-20" : "md:ml-64",
            "ml-0"
          )}
        >
          
          {/* 👇 2. Passe user e profile para o Header aqui */}
          <Header 
            user={user}
            profile={profile}
            isCollapsed={isCollapsed} 
            onMobileToggle={() => setIsMobileOpen(!isMobileOpen)} 
            isMobile={isMobileOpen}
          />

          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-panel-bg p-6 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent">
            <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {children}
            </div>
          </main>

          <Footer />
        </div>

        {/* Overlay Mobile */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] md:hidden animate-in fade-in duration-300"
            onClick={() => setIsMobileOpen(false)}
          />
        )}

        <div id="modal-root"></div>
        <div id="drawer-root"></div>
        
      </div>
    </ToastProvider>
  );
}
