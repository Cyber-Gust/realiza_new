"use client";
import { BarChart3 } from "lucide-react";

/**
 * Widget genérico de KPI (reutilizável)
 * label: título do indicador
 * value: valor numérico ou percentual
 * icon: ícone opcional (padrão: gráfico)
 * color: classe Tailwind (padrão: text-primary)
 */
export default function CRMKPIWidget({
  label,
  value,
  icon: Icon = BarChart3,
  color = "text-primary",
}) {
  return (
    <div className="rounded-xl border border-border bg-panel-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
        <Icon size={18} className={color} />
      </div>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}
