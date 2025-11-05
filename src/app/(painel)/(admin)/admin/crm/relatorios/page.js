"use client";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import KPIWidget from "@/components/admin/layout/KPIWidget";
import { useCRMRelatorios } from "@/hooks/useCRMRelatorios";
import { useEffect, useState } from "react";
import { BarChart3, Users, TrendingUp, CalendarCheck } from "lucide-react";
import LeadStats from "@/components/crm/LeadStats";

export default function RelatoriosPage() {
  const { relatorios, loading, loadRelatorios } = useCRMRelatorios();
  const [stats, setStats] = useState({
    total_leads: 0,
    propostas: 0,
    visitas: 0,
    conversao: 0,
  });

  // 🔹 Carrega dados ao montar
  useEffect(() => {
    loadRelatorios();
  }, [loadRelatorios]);

  // 🔹 Atualiza KPIs quando dados chegam
  useEffect(() => {
    if (relatorios) {
      setStats({
        total_leads: relatorios.total_leads ?? 0,
        propostas: relatorios.total_propostas ?? 0,
        visitas: relatorios.total_visitas ?? 0,
        conversao: relatorios.taxa_conversao ?? 0,
      });
    }
  }, [relatorios]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Relatórios e Indicadores"
        description="Visualize métricas e insights do desempenho comercial."
      />

      {/* 🔢 KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIWidget
          label="Leads Ativos"
          value={stats.total_leads}
          icon={<Users className="text-[hsl(var(--accent))]" size={18} />}
        />
        <KPIWidget
          label="Visitas Agendadas"
          value={stats.visitas}
          icon={<CalendarCheck className="text-[hsl(var(--accent))]" size={18} />}
        />
        <KPIWidget
          label="Propostas Enviadas"
          value={stats.propostas}
          icon={<BarChart3 className="text-[hsl(var(--accent))]" size={18} />}
        />
        <KPIWidget
          label="Taxa de Conversão"
          value={`${stats.conversao.toFixed(1)}%`}
          icon={<TrendingUp className="text-[hsl(var(--accent))]" size={18} />}
        />
      </div>

      {/* 🔍 Detalhamento por status */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Distribuição de Leads</h3>
        <LeadStats compact />
      </Card>

      {/* 🔮 Insights futuros */}
      <Card className="p-6 bg-muted/40 text-sm text-muted-foreground rounded-2xl border-dashed border">
        <p className="font-medium text-foreground mb-2">💡 Próximos passos</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Integrar comparativo de conversão por corretor</li>
          <li>Exibir histórico de performance mensal</li>
          <li>Gerar relatórios exportáveis em CSV/PDF</li>
        </ul>
      </Card>
    </div>
  );
}
