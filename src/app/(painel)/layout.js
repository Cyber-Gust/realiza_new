// src/app/(painel)/layout.js

"use client";

// Importe seus providers
import { Providers } from "../providers"; // <-- Ajuste o caminho de volta para /src/app/providers.js

// Este é o layout "pai" que aplica o sistema de temas
// APENAS às rotas filhas (admin e corretor).
export default function PainelLayout({ children }) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}