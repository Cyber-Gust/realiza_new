"use client";

import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Bell, 
  ChevronDown, 
  Slash, 
  LayoutDashboard,
  Menu // Adicionei o ícone Menu caso decida usar o botão mobile no futuro
} from "lucide-react";

// Adicionei onMobileToggle aqui nos props para não quebrar a passagem do Layout, mesmo se não usado visualmente ainda
export function Header({ user, profile, onMobileToggle }) {
  const avatarUrl = profile?.avatar_url || "/placeholder-avatar.png";
  
  // Lógica robusta para nome
  const userName =
    profile?.nome_completo ||
    profile?.nome ||
    user?.user_metadata?.nome_completo ||
    user?.user_metadata?.nome ||
    user?.email?.split("@")[0] ||
    "Usuário";

  const role = profile?.role || user?.user_metadata?.role || "Admin";

  return (
    <header 
      className="
        sticky top-0 z-40 w-full h-16 px-6 
        flex items-center justify-between
        bg-panel-card/80 backdrop-blur-md 
        border-b border-border/40 shadow-sm
        transition-all duration-300
      "
    >
      {/* LEFT: Breadcrumbs / Título Contextual */}
      <div className="flex items-center gap-2 text-muted-foreground animate-in fade-in slide-in-from-left-4 duration-500">
        
        {/* Botão Mobile (Opcional - Adicionei comentado caso precise) */}
        {/* <button onClick={onMobileToggle} className="md:hidden p-2 -ml-2 hover:bg-muted/50 rounded-md">
          <Menu className="h-5 w-5" />
        </button> 
        */}

        <h2 className="text-sm font-medium text-foreground tracking-tight flex items-center gap-2">
          Painel Administrativo
        </h2>
      </div>

      {/* RIGHT: Ações e Perfil */}
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Ações Rápidas */}
        <div className="flex items-center gap-2 pr-2">
            <ThemeToggle />
          
        </div>

        {/* Separador Vertical Sutil */}
        <div className="h-6 w-px bg-border/40 mx-1 hidden md:block" />

        {/* User Profile - Estilo "Pill" Interativo */}
        <button 
            className="
                group flex items-center gap-3 pl-1 pr-3 py-1 rounded-full 
                border border-transparent hover:border-border/40 hover:bg-muted/40 
                transition-all duration-200 outline-none focus:ring-2 focus:ring-ring/20
            "
        >
          <div className="relative h-9 w-9 overflow-hidden rounded-full border border-border/60 shadow-sm group-hover:scale-105 transition-transform">
            <Image
              src={avatarUrl}
              alt={userName}
              fill
              className="object-cover"
              sizes="36px"
              priority
            />
          </div>

          <div className="hidden lg:flex flex-col items-start text-left">
            <p className="text-sm font-semibold text-foreground leading-none group-hover:text-primary transition-colors">
                {userName}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5 capitalize tracking-wide">
                {role}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}