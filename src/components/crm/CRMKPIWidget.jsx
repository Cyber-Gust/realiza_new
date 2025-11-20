"use client";
import { BarChart3 } from "lucide-react";

/**
 * Widget de KPI — versão enterprise
 * label: descrição
 * value: número/string exibido
 * icon: ícone (Lucide)
 * color: cor do valor/ícone
 */
export default function CRMKPIWidget({
  label,
  value,
  icon: Icon = BarChart3,
  color = "text-primary",
}) {
  return (
    <div
      className="
        rounded-2xl border border-border bg-panel-card
        p-5 shadow-sm
        hover:shadow-lg hover:-translate-y-[2px]
        transition-all duration-200
        flex flex-col gap-3
      "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted-foreground tracking-tight">
          {label}
        </p>

        {/* Ícone em cápsula suave */}
        <div
          className={`
            flex items-center justify-center
            h-8 w-8 rounded-lg
            bg-muted/40 border border-border/70
            ${color}
          `}
        >
          <Icon size={16} />
        </div>
      </div>

      {/* VALOR */}
      <p
        className={`
          text-4xl font-semibold leading-none tracking-tight 
          ${color}
        `}
      >
        {value}
      </p>
    </div>
  );
}
