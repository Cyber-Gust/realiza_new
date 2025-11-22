"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils"; 
import { Sidebar } from "@/components/admin/layout/Sidebar";
import { Header } from "@/components/admin/layout/Header";
import { Footer } from "@/components/admin/layout/Footer";
// 🔄 MUDANÇA AQUI: Importar do nosso novo contexto
import { ToastProvider } from "@/contexts/ToastContext"; 

export default function AdminClientLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    // ✅ O Provider envolve tudo
    <ToastProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        
        {/* Sidebar */}
        <div className={cn(
          "fixed inset-y-0 z-50 transition-all duration-300 ease-in-out",
          isMobileOpen ? "flex w-64" : "hidden md:flex",
        )}>
           <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </div>

        {/* Conteúdo Principal */}
        <div
          className={cn(
            "flex min-h-screen flex-1 flex-col transition-[margin] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]",
            isCollapsed ? "md:ml-20" : "md:ml-64",
            "ml-0"
          )}
        >
          <Header 
            isCollapsed={isCollapsed} 
            onMobileToggle={() => setIsMobileOpen(!isMobileOpen)} 
            isMobile={isMobileOpen}
          />

          <main className="flex-1 overflow-x-hidden p-6 bg-panel-bg">
            <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
               {children}
            </div>
          </main>

          <Footer />
        </div>

        {/* Overlay Mobile */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </div>
    </ToastProvider>
  );
}