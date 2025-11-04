"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import clsx from "clsx";
import {
  LayoutDashboard,
  Home,
  UsersRound,
  UserCog,
  FileText,
  CircleDollarSign,
  CalendarClock,
  Wrench,
  Megaphone,
  Settings,
  PanelLeftClose,
  PanelRightClose,
  LogOut,
} from "lucide-react";

// Lista de links do menu (sem alteração)
const navItems = [
  // ... (itens do menu permanecem os mesmos)
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
      className={clsx(
        "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-panel-card text-panel-foreground transition-all duration-300 ease-in-out",
        "shadow-lg",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo e Toggle */}
      <div
        className={clsx(
          "relative flex h-16 items-center justify-center border-b border-border px-6",
          "shadow-sm"
        )}
      >
        <Link
          href="/admin/dashboard"
          className="flex items-center font-semibold"
          // Adiciona aria-label para acessibilidade quando a imagem estiver oculta
          aria-label="Ir para o Dashboard"
        >
          {/* --- MODIFICADO --- */}
          <Image
            src="/logo.png" 
            alt="Logo Completa"
            width={843} 
            height={590}
            className={clsx(
              "h-14 transition-all duration-300 ease-in-out", // Mantém altura e transição
              isCollapsed ? "hidden" : "block w-auto" // <-- AQUI A MUDANÇA
            )}
            priority 
          />
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors hover:bg-muted"
          aria-label={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {isCollapsed ? (
            <PanelRightClose className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {/* Navegação (Sem alterações) */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              "group flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-panel-active hover:text-panel-active-foreground",
              pathname.startsWith(item.href)
                ? "bg-panel-active text-panel-active-foreground"
                : "text-muted-foreground",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className="h-5 w-5" />
            <span
              className={clsx(
                "ml-3 transition-opacity duration-200",
                isCollapsed && "hidden"
              )}
            >
              {item.name}
            </span>
          </Link>
        ))}
      </nav>

      {/* Footer da Sidebar (Botão Sair) (Sem alterações) */}
      <div className="mt-auto border-t border-border p-4 shadow-inner">
        <button
          onClick={handleLogout}
          className={clsx(
            "group flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-panel-active hover:text-panel-active-foreground",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? "Sair" : undefined}
        >
          <LogOut className="h-5 w-5" />
          <span
            className={clsx(
              "ml-3 transition-opacity duration-200",
              isCollapsed && "hidden"
            )}
          >
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
}