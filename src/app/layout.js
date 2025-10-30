import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Imobiliária - Plataforma Digital",
  description: "Gestão de Imóveis, Vendas e Locação",
};

export default function RootLayout({ children }) {
  return (
    // Adicione suppressHydrationWarning aqui
    <html lang="pt-BR" suppressHydrationWarning> 
      <body className={`${inter.className} bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}