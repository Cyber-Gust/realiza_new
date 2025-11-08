"use client";
import { cn } from "@/lib/utils";

/**
 * Badge estilizado com variantes e mapeamento de status global
 */
export default function Badge({ status, children, variant = "soft", className }) {
  const value = status?.toLowerCase() || children?.toLowerCase();

  const colorMap = {
    admin: "emerald",
    corretor: "purple",
    ativo: "emerald",
    disponivel: "emerald",
    pendente: "amber",
    reservado: "amber",
    vendido: "blue",
    pago: "emerald",
    atrasado: "red",
    alugado: "purple",
    inativo: "gray",
    novo: "sky",
    qualificado: "indigo",
    visita_agendada: "amber",
    proposta_feita: "emerald",
    documentacao: "purple",
    concluido: "emerald",
    perdido: "red",
  };

  const color = colorMap[value] || "gray";

  const base =
    "inline-flex items-center justify-center rounded-full text-xs font-semibold px-3 py-1 select-none whitespace-nowrap transition";

  const variants = {
    soft: `bg-${color}-500/15 text-${color}-700 border border-${color}-400/30`,
    solid: `bg-${color}-600 text-white`,
    outline: `border border-${color}-500 text-${color}-700 bg-transparent`,
  };

  return (
    <span className={cn(base, variants[variant], className)}>
      {status || children}
    </span>
  );
}
