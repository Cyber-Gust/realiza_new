"use client";
import { useCRMRelatorios } from "@/hooks/useCRMRelatorios";
import KPIWidget from "@/components/admin/layout/KPIWidget";

export default function LeadStats() {
  const { data, loading } = useCRMRelatorios();

  const items = [
    { label: "Leads Ativos", value: data.leads_ativos },
    { label: "Taxa de Conversão", value: `${(data.taxa_conversao * 100).toFixed(1)}%` },
    { label: "Visitas Agendadas", value: data.visitas_agendadas },
    { label: "Propostas Enviadas", value: data.propostas_enviadas },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((kpi) => (
        <KPIWidget key={kpi.label} label={kpi.label} value={loading ? "..." : kpi.value} />
      ))}
    </div>
  );
}
