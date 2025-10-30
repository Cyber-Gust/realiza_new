// Remova o 'import "../globals.css";' daqui. Ele só deve estar no root layout.
import Link from "next/link";

export const metadata = {
  title: "Realiza Imóveis",
  description: "Transforme o sonho da casa própria em realidade.",
};

// O layout aninhado não tem <html> ou <body>
export default function SiteLayout({ children }) {
  return (
    // Usamos um 'div' para manter a estrutura de sticky footer (flex-col)
    // que você tinha no seu <body>
    <div className="min-h-screen flex flex-col">
      <header className="w-full bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img
              src="/logo.png"
              alt="Logo Realiza Imóveis"
              className="h-10 w-auto"
            />
            <span className="font-bold text-lg text-foreground">
              Realiza Imóveis
            </span>
          </Link>

          {/* Menu */}
          <nav className="flex items-center space-x-6">
            <Link href="/" className="hover:text-accent transition-colors">
              Início
            </Link>
            <Link href="/imoveis" className="hover:text-accent transition-colors">
              Imóveis
            </Link>
            <Link href="/contato" className="hover:text-accent transition-colors">
              Contato
            </Link>
            <Link
              href="/login"
              className="bg-accent text-accent-foreground px-4 py-2 rounded-md hover:opacity-90 transition"
            >
              Painel
            </Link>
          </nav>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="w-full bg-card border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 text-sm text-muted text-center">
          <p>© {new Date().getFullYear()} Realiza Imóveis. Todos os direitos reservados.</p>
          <p className="mt-1">
            Desenvolvido com 💚 por{" "}
            <span className="text-accent font-semibold">BitBloomAI</span>
          </p>
        </div>
      </footer>
    </div>
  );
}