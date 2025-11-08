"use client";

import { useEffect, useState } from "react";
import { Users, CheckCircle2, TrendingUp, XCircle } from "lucide-react";
import Card from "@/components/admin/ui/Card";
import KPIWidget from "@/components/admin/layout/KPIWidget";
import { Button } from "@/components/ui/button";
import Modal from "@/components/admin/ui/Modal";
import LeadTable from "@/components/crm/LeadTable";
import LeadForm from "@/components/crm/LeadForm";
import { useLeads } from "@/hooks/useLeads";
import { motion } from "framer-motion";

export default function LeadsPanel() {
  const { leads, loading, createLead, deleteLead, loadLeads } = useLeads();
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState({
    novo: 0,
    qualificado: 0,
    visita_agendada: 0,
    proposta_feita: 0,
    documentacao: 0,
    concluido: 0,
    perdido: 0,
  });

  // 🔹 Carrega os leads na montagem
  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔹 Atualiza os KPIs toda vez que a lista muda
  useEffect(() => {
    if (!Array.isArray(leads)) return;

    const summary = leads.reduce(
      (acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      },
      {
        novo: 0,
        qualificado: 0,
        visita_agendada: 0,
        proposta_feita: 0,
        documentacao: 0,
        concluido: 0,
        perdido: 0,
      }
    );

    setStats(summary);
  }, [leads]);

  return (
    <section className="space-y-10 animate-fadeIn">
      {/* 📊 KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"
      >
        <KPIWidget label="Novos" value={stats.novo} icon={Users} color="text-sky-500" />
        <KPIWidget label="Qualificados" value={stats.qualificado} icon={TrendingUp} color="text-indigo-500" />
        <KPIWidget label="Visitas" value={stats.visita_agendada} icon={CheckCircle2} color="text-amber-500" />
        <KPIWidget label="Propostas" value={stats.proposta_feita} color="text-emerald-500" />
        <KPIWidget label="Docs" value={stats.documentacao} color="text-purple-500" />
        <KPIWidget label="Concluídos" value={stats.concluido} color="text-emerald-600" />
        <KPIWidget label="Perdidos" value={stats.perdido} icon={XCircle} color="text-red-500" />
      </motion.div>

      {/* 📋 Tabela de leads */}
      <Card className="p-0 overflow-hidden border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
        {loading ? (
          <p className="p-8 text-center text-muted-foreground animate-pulse">
            Carregando leads...
          </p>
        ) : (
          <LeadTable
            data={leads}
            loading={loading}
            onReload={loadLeads}
            onCreate={createLead}
            onDelete={deleteLead}
          />
        )}
      </Card>

      {/* ➕ Novo Lead */}
      <Modal open={open} onOpenChange={setOpen} title="Novo Lead">
        <LeadForm
          onSave={async (lead) => {
            await createLead(lead);
            setOpen(false);
            await loadLeads();
          }}
          onClose={() => setOpen(false)}
        />
      </Modal>

      {/* Botão flutuante (reserva futura) */}
      <div className="flex justify-end"></div>
    </section>
  );
}
