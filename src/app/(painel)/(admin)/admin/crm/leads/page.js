"use client";
import PageHeader from "@/components/admin/layout/PageHeader";
import KPIWidget from "@/components/admin/layout/KPIWidget";
import Card from "@/components/admin/ui/Card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useState, useEffect } from "react";
import LeadTable from "@/components/crm/LeadTable";
import LeadForm from "@/components/crm/LeadForm";
import Modal from "@/components/admin/ui/Modal";
import isEqual from "lodash.isequal";

export default function LeadsPage() {
  const { leads, loading, createLead, loadLeads } = useLeads();
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

  // 🧮 Calcula KPIs locais
  useEffect(() => {
    if (!Array.isArray(leads)) return;

    const summary = leads.reduce(
      (acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      },
      { ...stats }
    );

    setStats((prev) => (isEqual(prev, summary) ? prev : summary));
  }, [leads]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Leads"
        description="Acompanhe, qualifique e avance leads no funil comercial."
        rightSection={
          <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
            <Plus size={16} /> Novo Lead
          </Button>
        }
      />

      {/* KPIs locais (por status) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KPIWidget label="Novos" value={stats.novo} />
        <KPIWidget label="Qualificados" value={stats.qualificado} />
        <KPIWidget label="Visita Agendada" value={stats.visita_agendada} />
        <KPIWidget label="Propostas" value={stats.proposta_feita} />
        <KPIWidget label="Documentação" value={stats.documentacao} />
        <KPIWidget label="Concluídos" value={stats.concluido} />
        <KPIWidget label="Perdidos" value={stats.perdido} />
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-muted-foreground">Carregando leads...</p>
        ) : (
          <LeadTable data={leads} onReload={loadLeads} />
        )}
      </Card>

      {/* Modal de criação de lead */}
      <Modal open={open} onOpenChange={setOpen} title="Novo Lead">
        <LeadForm
          onSave={async (lead) => {
            await createLead(lead);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}
