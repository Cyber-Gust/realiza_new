"use client";

import { useCRMRelatorios } from "@/hooks/useCRMRelatorios";
import KPIWidget from "@/components/admin/layout/KPIWidget";
import { Users, TrendingUp, Calendar, FileText } from "lucide-react";

export default function LeadStats() {
  const { data, loading } = useCRMRelatorios();

  const items = [
    { icon: Users, label: "Leads Ativos", value: data.leads_ativos },
    { icon: TrendingUp, label: "Taxa de Conversão", value: `${(data.taxa_conversao * 100).toFixed(1)}%` },
    { icon: Calendar, label: "Visitas Agendadas", value: data.visitas_agendadas },
    { icon: FileText, label: "Propostas Enviadas", value: data.propostas_enviadas },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((kpi) => (
        <KPIWidget
          key={kpi.label}
          icon={kpi.icon} // ✅ passa a referência do componente, não o JSX
          label={kpi.label}
          value={loading ? "..." : kpi.value}
        />
      ))}
    </div>
  );
}
