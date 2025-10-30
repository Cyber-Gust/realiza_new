import { CircleUser } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-panel-card px-6">
      {/* Ocupa o espaço à esquerda. Pode ter Breadcrumbs ou Busca */}
      <div className="flex-1">
        {/* Ex: <Breadcrumbs /> */}
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
      </div>

      {/* Botões à direita */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        {/* BOTÃO DE USUÁRIO (AJUSTADO):
          - Removido 'border' e 'bg-panel-bg'
          - Adicionado 'bg-transparent' e 'hover:bg-muted' para um efeito "ghost"
          - Adicionado 'focus-visible:ring-ring' para acessibilidade
        */}
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <CircleUser className="h-5 w-5 text-muted-foreground" />
          <span className="sr-only">Menu do Usuário</span>
        </button>
      </div>
    </header>
  );
}