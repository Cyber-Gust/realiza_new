import { cn } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-panel-bg py-6">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 text-xs text-muted-foreground md:flex-row">
        
        <p>© 2025 Imobiliária System. Todos os direitos reservados.</p>
        
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-foreground transition-colors">
            Termos de Uso
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Política de Privacidade
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Suporte
          </a>
          
          <div className="flex items-center gap-1 opacity-60">
            <span>v1.0.2</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>
    </footer>
  );
}