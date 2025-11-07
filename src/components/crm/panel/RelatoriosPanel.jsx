"use client";

import { useEffect, useState } from "react";
import Card from "@/components/admin/ui/Card";
import KPIWidget from "@/components/admin/layout/KPIWidget";
import LeadStats from "@/components/crm/LeadStats";
import { useCRMRelatorios } from "@/hooks/useCRMRelatorios";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  TrendingUp,
  CalendarCheck,
  Activity,
} from "lucide-react";

export default function RelatoriosPanel() {
  const { relatorios, loading, loadRelatorios } = useCRMRelatorios();
  const [stats, setStats] = useState({
    total_leads: 0,
    propostas: 0,
    visitas: 0,
    conversao: 0,
  });

  useEffect(() => {
    loadRelatorios();
  }, [loadRelatorios]);

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
    <section className="space-y-10 animate-fadeIn">
      {/* 🔢 KPIs Principais */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <KPIWidget
          label="Leads Ativos"
          value={stats.total_leads}
          icon={Users}
          color="text-sky-500"
        />
        <KPIWidget
          label="Visitas Agendadas"
          value={stats.visitas}
          icon={CalendarCheck}
          color="text-amber-500"
        />
        <KPIWidget
          label="Propostas Enviadas"
          value={stats.propostas}
          icon={BarChart3}
          color="text-emerald-500"
        />
        <KPIWidget
          label="Taxa de Conversão"
          value={`${stats.conversao.toFixed(1)}%`}
          icon={TrendingUp}
          color="text-violet-500"
        />
      </motion.div>

      {/* 📊 Distribuição de Leads */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Activity size={18} className="text-accent" />
              Distribuição de Leads
            </h3>
            <span className="text-xs text-muted-foreground">
              Atualizado em {new Date().toLocaleDateString("pt-BR")}
            </span>
          </div>

          {/* Componente de gráfico/tabela */}
          <LeadStats compact />
        </Card>
      </motion.div>

      {/* 🔮 Bloco de insights futuros */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card
          className="
            p-6 bg-gradient-to-br from-muted/50 to-muted/20
            border border-dashed border-border rounded-2xl
            text-sm text-muted-foreground backdrop-blur-sm
          "
        >
          <p className="font-semibold text-foreground mb-3 flex items-center gap-2">
            💡 Insights e Próximos Passos
          </p>
          <ul className="list-disc ml-5 space-y-1.5 marker:text-accent">
            <li>Comparar taxa de conversão por corretor</li>
            <li>Histórico de performance mensal e sazonalidade</li>
            <li>Exportação avançada (CSV / PDF / Excel)</li>
            <li>Integração com Google Data Studio</li>
          </ul>
        </Card>
      </motion.div>
    </section>
  );
}
