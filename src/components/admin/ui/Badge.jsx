import { cn } from "@/lib/utils";

// Mapeamento baseado nos ENUMs do seu SQL
const statusConfig = {
  // Status Imóvel
  disponivel: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200/50",
  reservado: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200/50",
  alugado: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200/50",
  vendido: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400 border-indigo-200/50",
  inativo: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/50",
  
  // Status Lead
  novo: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 border-sky-200/50",
  qualificado: "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400 border-purple-200/50",
  perdido: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 border-red-200/50",
  
  // Default
  default: "bg-secondary text-secondary-foreground border-border",
};

export default function Badge({ status, children, className }) {
  // Normaliza a string para garantir o match (ex: "Visita Agendada" -> "visita_agendada")
  const statusKey = status?.toString().toLowerCase().replace(/ /g, "_") || "default";
  const styleClass = statusConfig[statusKey] || statusConfig.default;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        "shadow-[0_1px_2px_rgb(0,0,0,0.05)]", // Sombra sutil estilo Apple
        styleClass,
        className
      )}
    >
      {children || status}
    </span>
  );
}