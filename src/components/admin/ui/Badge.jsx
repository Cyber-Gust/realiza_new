"use client";
import { cn } from "@/lib/utils";

export default function Badge({ status }) {
  const colorMap = {
    ativo: "bg-emerald-700/20 text-emerald-400 border-emerald-800/50",
    disponivel: "bg-emerald-700/20 text-emerald-400 border-emerald-800/50",
    inativo: "bg-muted text-muted-foreground border-border",
    pendente: "bg-yellow-600/20 text-yellow-400 border-yellow-700/40",
    reservado: "bg-yellow-600/20 text-yellow-400 border-yellow-700/40",
    vendido: "bg-yellow-600/20 text-yellow-400 border-yellow-700/40",
    pago: "bg-emerald-600/20 text-emerald-400 border-emerald-700/40",
    atrasado: "bg-red-600/20 text-red-400 border-red-700/40"
  };
  return (
    <span
      className={cn(
        "px-3 py-1 rounded-full border text-xs font-medium",
        colorMap[status] || "bg-muted text-muted-foreground border-border"
      )}
    >
      {status}
    </span>
  );
}
