"use client";
import { cn } from "@/lib/utils";

export default function Badge({ status }) {
  const colorMap = {
    admin: "bg-emerald-600 text-white",
    corretor: "bg-purple-600 text-white",
    ativo: "bg-emerald-600 text-white",
    disponivel: "bg-emerald-600 text-white",
    pendente: "bg-yellow-500 text-white",
    reservado: "bg-yellow-500 text-white",
    vendido: "bg-blue-600 text-white",
    pago: "bg-emerald-600 text-white",
    atrasado: "bg-red-600 text-white",
    alugado: "bg-purple-600 text-white",
    inativo: "bg-gray-400 text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
        colorMap[status?.toLowerCase()] || "bg-gray-400 text-white"
      )}
    >
      {status}
    </span>
  );
}
