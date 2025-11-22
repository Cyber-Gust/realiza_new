"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { cn } from "@/lib/utils"; // Usando seu utilitário
import {
  LayoutDashboard, Home, UsersRound, UserCog, FileText,
  CircleDollarSign, CalendarClock, Wrench, Megaphone, Settings,
  PanelLeftClose, PanelRightClose, LogOut, ChevronRight
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "CRM", href: "/admin/crm", icon: UsersRound },
  { name: "Imóveis", href: "/admin/imoveis", icon: Home },
  { name: "Perfis", href: "/admin/perfis", icon: UserCog },
  { name: "Contratos", href: "/admin/contratos", icon: FileText },
  { name: "Financeiro", href: "/admin/financeiro", icon: CircleDollarSign },
  { name: "Aluguéis", href: "/admin/alugueis", icon: CalendarClock },
  { name: "Manutenção", href: "/admin/manutencao", icon: Wrench },
  { name: "Marketing", href: "/admin/marketing", icon: Megaphone },
  { name: "Configurações", href: "/admin/configuracoes", icon: Settings },
];

export function Sidebar({ isCollapsed, setIsCollapsed }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-panel-bg text-foreground transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* --- Header da Sidebar (Logo) --- */}
      <div className="flex h-16 items-center justify-center border-b border-border px-4">
        <Link
          href="/admin/dashboard"
          className={cn(
            "flex items-center justify-center overflow-hidden transition-all duration-300",
            isCollapsed ? "w-10" : "w-full"
          )}
        >
          {/* Lógica: Se colapsado, mostra icone pequeno (idealmente), se não, logo full */}
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
          {/* Opcional: Ícone de fallback quando colapsado se a logo sumir totalmente */}
          {isCollapsed && <div className="absolute font-bold text-xl text-accent">IM</div>}
        </Link>
      </div>

      {/* --- Botão Toggle (Estilo Flutuante) --- */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-panel-card text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <PanelLeftClose size={14} />}
      </button>

      {/* --- Navegação --- */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6 scrollbar-thin scrollbar-thumb-border">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                // Estados Ativos vs Inativos
                isActive
                  ? "bg-panel-active text-panel-active-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-panel-active-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              
              <span
                className={cn(
                  "ml-3 truncate transition-all duration-300",
                  isCollapsed ? "w-0 opacity-0 translate-x-[-10px]" : "w-auto opacity-100 translate-x-0"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* --- Footer da Sidebar --- */}
      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className={cn(
            "group flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
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
  );
}