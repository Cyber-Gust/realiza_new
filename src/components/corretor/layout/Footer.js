import { cn } from "@/lib/utils";

export function Footer() {
  return (
    // AQUI: Mesmo background (bg-panel-card/80) e blur do Header
    <footer className="w-full border-t border-border/40 bg-panel-card/80 backdrop-blur-md py-6 transition-all">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 text-xs text-muted-foreground md:flex-row">
        
        {/* Copyright com um tom um pouco mais suave */}
        <p className="font-medium opacity-80">
          © 2025 Imobiliária System. Todos os direitos reservados.
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-6">
          <nav className="flex gap-6">
            <a href="#" className="hover:text-foreground hover:underline underline-offset-4 transition-all">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-foreground hover:underline underline-offset-4 transition-all">
              Política de Privacidade
            </a>
            <a href="#" className="hover:text-foreground hover:underline underline-offset-4 transition-all">
              Suporte
            </a>
          </nav>
          
          {/* Separador vertical sutil */}
          <div className="hidden md:block h-3 w-px bg-border/60" />

          {/* Badge de versão estilizado */}
          <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-muted/40 border border-border/40">
            <span className="font-mono text-[10px] tracking-tight">v1.0.2</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}