"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Home, UsersRound, UserCog, FileText,
  CircleDollarSign, CalendarClock, Wrench, Megaphone, Settings,
  PanelLeftClose, LogOut, ChevronRight, Menu
} from "lucide-react";

export const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "CRM", href: "/admin/crm", icon: UsersRound },
  { name: "Imóveis", href: "/admin/imoveis", icon: Home },
  { name: "Perfis", href: "/admin/perfis", icon: UserCog },
  { name: "Contratos", href: "/admin/contratos", icon: FileText },
  { name: "Financeiro", href: "/admin/financeiro", icon: CircleDollarSign },
  { name: "Aluguéis", href: "/admin/alugueis", icon: CalendarClock },
  { name: "Manutenção", href: "/admin/manutencao", icon: Wrench },
  { name: "Configurações", href: "/admin/configuracoes", icon: Settings },
];

export function Sidebar({ isCollapsed, setIsCollapsed }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* BOTÃO MOBILE */}
      <button
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 rounded-md bg-panel-card border border-border shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu size={22} />
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] bg-panel-card/80 text-foreground border-r border-border/40 shadow-2xl shadow-black/5",
          isCollapsed ? "w-20" : "w-64",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* LOGO */}
        <div
          className={cn(
            "flex h-20 items-center justify-center px-4 mb-2",
            !isCollapsed && "border-b border-dashed border-border/40 mx-4"
          )}
        >
          <Link
            href="/admin/dashboard"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center justify-center overflow-hidden transition-all duration-300",
              isCollapsed ? "w-10" : "w-full"
            )}
          >
            <Image
              src="/logo.png"
              alt="Logo"
              width={843}
              height={590}
              className={cn(
                "object-contain transition-all duration-300",
                isCollapsed ? "h-8 w-8 opacity-0" : "h-10 w-auto opacity-100"
              )}
              priority
            />
            {isCollapsed && <div className="absolute font-bold text-xl text-primary">IM</div>}
          </Link>
        </div>

        {/* TOGGLE DESKTOP */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-24 z-50 h-6 w-6 items-center justify-center rounded-full border border-border bg-panel-card text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground hover:scale-105 transition-all"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <PanelLeftClose size={14} />}
        </button>

        {/* NAV */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl relative",
                  isCollapsed ? "justify-center px-2" : "",
                  isActive
                    ? "bg-panel-active text-panel-active-foreground shadow-sm ring-1 ring-border/20"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
                title={isCollapsed ? item.name : undefined}
              >
                {isActive && !isCollapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                )}

                <item.icon
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive
                      ? "text-panel-active-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />

                <span
                  className={cn(
                    "ml-3 truncate transition-all duration-300",
                    isCollapsed
                      ? "w-0 opacity-0 translate-x-[-10px]"
                      : "w-auto opacity-100 translate-x-0"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="border-t border-border/40 p-4">
          <button
            onClick={handleLogout}
            className={cn(
              "group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            <span
              className={cn(
                "ml-3 truncate transition-all duration-300",
                isCollapsed ? "hidden" : "block"
              )}
            >
              Sair
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
