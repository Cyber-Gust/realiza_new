"use client";

import LeadKanban from "@/components/crm/LeadKanban";
import { useLeads } from "@/hooks/useLeads";
import { useEffect } from "react";

export default function PipelinePanel() {
  const { leads, loadLeads, updateStatus } = useLeads();

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  if (!leads?.length) {
    return (
      <p className="p-6 text-center text-muted-foreground">
        Nenhum lead encontrado. Adicione novos na aba “Leads”.
      </p>
    );
  }

  return (
    <div className="w-full h-full">
      {/* 🔹 Scroll horizontal controlado apenas aqui */}
      <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-muted/40">
        {/* 🔸 O inline-flex mantém as colunas lado a lado sem estourar o card */}
        <div className="inline-flex w-max min-w-full px-4 py-3">
          <LeadKanban leads={leads} onStatusChange={updateStatus} />
        </div>
      </div>
    </div>
  );
}
