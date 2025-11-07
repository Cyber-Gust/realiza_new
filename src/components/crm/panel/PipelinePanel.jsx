"use client";

import Card from "@/components/admin/ui/Card";
import LeadKanban from "@/components/crm/LeadKanban";
import { useLeads } from "@/hooks/useLeads";
import { useEffect } from "react";

export default function PipelinePanel() {
  const { leads, loadLeads, updateStatus } = useLeads();

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  return (
    <div className="space-y-6">
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
