"use client";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import LeadKanban from "@/components/crm/LeadKanban";
import { useLeads } from "@/hooks/useLeads";
import { useEffect } from "react";

export default function PipelinePage() {
  const { leads, loadLeads, updateStatus } = useLeads();

  // Atualiza lista inicial
  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline de Vendas"
        description="Visualize e gerencie o funil de leads em tempo real."
      />

      <Card className="p-0">
        {leads.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">
            Nenhum lead encontrado. Adicione novos na aba “Leads”.
          </p>
        ) : (
          <div className="overflow-x-auto pb-4">
            <LeadKanban leads={leads} onStatusChange={updateStatus} />
          </div>
        )}
      </Card>
    </div>
  );
}
